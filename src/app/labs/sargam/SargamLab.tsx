"use client";

import { Noto_Sans_Devanagari } from "next/font/google";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { analyzeTrack } from "@/labs/sargam/analyze";
import { drawSargam, placeRows, yForMidi, type DrawFrame, type StringRow } from "@/labs/sargam/draw";
import { swaraRate, visibleSwaras } from "@/labs/sargam/segment";
import { synthesizeDemo } from "@/labs/sargam/synth";
import { TAAN_RATE, type Analysis, type NoteEvent, type PitchTrack } from "@/labs/sargam/types";
import { createPitchWorker } from "@/labs/sargam/worker-client";
import { detectPitch } from "@/labs/sargam/yin";
import {
  latinLabel,
  PITCH_CLASSES,
  RAAGS,
  raagPitchClasses,
  SWARA_BY_ID,
  tonicLegend,
  type RaagId,
} from "@/labs/sargam/swara";
import styles from "./sargam.module.css";

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const INTRO_MS = 1150;

type Engine = {
  job: number;
  worker: Worker | null;
  audio: AudioContext | null;
  gain: GainNode | null;
  buffer: AudioBuffer | null;
  track: PitchTrack | null;
  analysis: Analysis | null;
  rows: StringRow[];
  duration: number;
  time: number;
  offset: number;
  startedAt: number;
  rate: number;
  playing: boolean;
  source: AudioBufferSourceNode | null;
  sourceToken: object | null;
  introStart: number | null;
  cursor: number;
  plucks: { key: string; born: number }[];
  pings: { y: number; born: number }[];
  scrubbing: boolean;
  resumeAfterScrub: boolean;
  settings: { pitchClass: number; cents: number; touched: boolean; raag: RaagId };
  fonts: { deva: string; sans: string; display: string };
  calm: boolean;
  stripKey: string;
  statsKey: string;
};

function createEngine(): Engine {
  return {
    job: 0,
    worker: null,
    audio: null,
    gain: null,
    buffer: null,
    track: null,
    analysis: null,
    rows: [],
    duration: 0,
    time: 0,
    offset: 0,
    startedAt: 0,
    rate: 1,
    playing: false,
    source: null,
    sourceToken: null,
    introStart: null,
    cursor: 0,
    plucks: [],
    pings: [],
    scrubbing: false,
    resumeAfterScrub: false,
    settings: { pitchClass: 0, cents: 0, touched: false, raag: "chromatic" },
    fonts: { deva: "sans-serif", sans: "sans-serif", display: "sans-serif" },
    calm: false,
    stripKey: "",
    statsKey: "",
  };
}

function mixdown(buffer: AudioBuffer): Float32Array {
  const out = new Float32Array(buffer.length);
  const channels = buffer.numberOfChannels;
  for (let channel = 0; channel < channels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i++) out[i] += data[i] / channels;
  }
  return out;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function buildRows(track: PitchTrack, analysis: Analysis, raag: RaagId): StringRow[] {
  const visible = visibleSwaras(track, analysis.notes, analysis.tonic, raagPitchClasses(raag));
  return visible.map((row) => {
    const info = SWARA_BY_ID[row.swara];
    return {
      key: `${row.swara}${row.octave}`,
      swara: row.swara,
      octave: row.octave,
      midi: row.midi,
      y: 0,
      devanagari: info.devanagari,
      latin: latinLabel(row.swara, row.octave),
      komal: info.komal,
      tivra: info.tivra,
    };
  });
}

function resetCursor(eng: Engine, time: number) {
  const notes = eng.analysis?.notes ?? [];
  let cursor = 0;
  while (cursor < notes.length && notes[cursor].time < time - 0.02) cursor++;
  eng.cursor = cursor;
}

function stopSource(eng: Engine) {
  const source = eng.source;
  eng.sourceToken = null;
  eng.source = null;
  eng.playing = false;
  if (!source) return;
  source.onended = null;
  try {
    source.stop();
  } catch {
    /* already stopped */
  }
}

function startAudio(eng: Engine, offset: number, onEnded: () => void) {
  const ctx = eng.audio;
  const buffer = eng.buffer;
  if (!ctx || !buffer) return;
  stopSource(eng);
  if (offset >= buffer.duration - 0.03) {
    eng.time = buffer.duration;
    eng.offset = buffer.duration;
    onEnded();
    return;
  }
  if (!eng.gain) {
    const gain = ctx.createGain();
    gain.gain.value = 0.92;
    gain.connect(ctx.destination);
    eng.gain = gain;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = eng.rate;
  source.connect(eng.gain);
  const token = {};
  eng.sourceToken = token;
  source.onended = () => {
    if (eng.sourceToken !== token) return;
    eng.playing = false;
    eng.time = eng.duration;
    eng.offset = eng.duration;
    onEnded();
  };
  source.start(0, Math.max(0, offset));
  eng.source = source;
  eng.startedAt = ctx.currentTime;
  eng.offset = offset;
  eng.time = offset;
  eng.playing = true;
}

function songTime(eng: Engine): number {
  if (eng.playing && eng.audio) {
    return eng.offset + (eng.audio.currentTime - eng.startedAt) * eng.rate;
  }
  return eng.time;
}

function resegment(eng: Engine) {
  if (!eng.track) return;
  const choice = eng.settings.touched
    ? { pitchClass: eng.settings.pitchClass, cents: eng.settings.cents }
    : null;
  const analysis = analyzeTrack(eng.track, choice, eng.settings.raag);
  eng.analysis = analysis;
  eng.rows = buildRows(eng.track, analysis, eng.settings.raag);
  resetCursor(eng, eng.time);
  eng.stripKey = "";
  eng.statsKey = "";
}

function currentNote(notes: NoteEvent[], time: number): NoteEvent | null {
  let found: NoteEvent | null = null;
  for (const note of notes) {
    if (note.time > time + 0.03) break;
    found = note;
  }
  return found;
}

function sungCount(notes: NoteEvent[], time: number): number {
  let count = 0;
  for (const note of notes) {
    if (note.time <= time + 0.03) count++;
    else break;
  }
  return count;
}

type Chrome = {
  stats: HTMLParagraphElement | null;
  taan: HTMLParagraphElement | null;
  strip: HTMLDivElement | null;
  counter: HTMLParagraphElement | null;
  legend: HTMLParagraphElement | null;
  scrub: HTMLInputElement | null;
  live: HTMLParagraphElement | null;
};

function renderStrip(el: HTMLDivElement, notes: NoteEvent[], current: number) {
  el.replaceChildren();
  if (notes.length === 0) {
    const hint = document.createElement("span");
    hint.className = styles.waiting;
    hint.textContent = "No melody in range";
    el.appendChild(hint);
    return;
  }
  if (current < 0) {
    const hint = document.createElement("span");
    hint.className = styles.waiting;
    hint.textContent = "Press play";
    el.appendChild(hint);
    return;
  }
  const from = Math.max(0, current - 14);
  for (let i = from; i <= current; i++) {
    const span = document.createElement("span");
    span.textContent = latinLabel(notes[i].swara, notes[i].octave);
    span.className = i === current ? styles.sung : styles.past;
    el.appendChild(span);
  }
}

function paintChrome(engine: Engine, chrome: Chrome, active: NoteEvent | null) {
  const analysis = engine.analysis;
  const notes = analysis?.notes ?? [];
  const time = engine.introStart == null ? engine.time : 0;
  const current = notes.length ? swaraRate(notes, time) : 0;
  const peak = analysis?.peak ?? 0;
  const stats = `${notes.length} SWARAS · ${formatDuration(engine.duration)} · PEAK ${peak.toFixed(1)}/S · NOW ${current.toFixed(1)}/S`;
  if (chrome.stats && engine.statsKey !== stats) {
    engine.statsKey = stats;
    chrome.stats.textContent = stats;
  }
  const taan = current >= TAAN_RATE;
  if (chrome.taan) {
    chrome.taan.hidden = !taan;
    chrome.taan.textContent = taan ? `TAAN · ${current.toFixed(1)} SWARAS/S` : "";
  }
  const sung = sungCount(notes, time);
  const counter = `SWARAS SUNG ${String(sung).padStart(3, "0")} / ${notes.length}`;
  if (chrome.counter && chrome.counter.textContent !== counter) chrome.counter.textContent = counter;
  if (chrome.legend && analysis) {
    const legend = tonicLegend(analysis.tonic);
    if (chrome.legend.textContent !== legend) chrome.legend.textContent = legend;
  }
  const stripKey = `${sung}:${notes.length}:${analysis?.tonic.saFreq ?? 0}`;
  if (chrome.strip && stripKey !== engine.stripKey) {
    engine.stripKey = stripKey;
    renderStrip(chrome.strip, notes, sung - 1);
    if (chrome.live) chrome.live.textContent = active ? latinLabel(active.swara, active.octave) : "";
  }
  if (chrome.scrub && !engine.scrubbing) {
    chrome.scrub.max = String(engine.duration || 0);
    chrome.scrub.value = String(Math.min(engine.duration, Math.max(0, time)));
  }
}

type AnalyseUi = {
  setPhase: (phase: "analyzing" | "ready" | "error") => void;
  setProgress: (ratio: number) => void;
  setRunning: (playing: boolean) => void;
  setPitchClass: (pitchClass: number) => void;
  setCents: (cents: number) => void;
  setDuration: (duration: number) => void;
};

async function analyse(engine: Engine, buffer: AudioBuffer, job: number, ui: AnalyseUi) {
  ui.setPhase("analyzing");
  ui.setProgress(0);
  stopSource(engine);
  engine.introStart = null;
  engine.playing = false;
  ui.setRunning(false);
  const samples = mixdown(buffer);
  const track = await detectInWorker(engine, samples, buffer.sampleRate, job, (ratio) => {
    if (engine.job === job) ui.setProgress(ratio);
  });
  if (engine.job !== job) return;
  const choice = engine.settings.touched
    ? { pitchClass: engine.settings.pitchClass, cents: engine.settings.cents }
    : null;
  const analysis = analyzeTrack(track, choice, engine.settings.raag);
  engine.track = track;
  engine.analysis = analysis;
  engine.buffer = buffer;
  engine.duration = buffer.duration;
  engine.time = 0;
  engine.offset = 0;
  engine.cursor = 0;
  engine.plucks = [];
  engine.pings = [];
  engine.rows = buildRows(track, analysis, engine.settings.raag);
  engine.stripKey = "";
  engine.statsKey = "";
  if (!engine.settings.touched) {
    engine.settings.pitchClass = analysis.auto.pitchClass;
    engine.settings.cents = Math.round(analysis.auto.cents);
    ui.setPitchClass(analysis.auto.pitchClass);
    ui.setCents(Math.round(analysis.auto.cents));
  }
  ui.setDuration(buffer.duration);
  ui.setPhase("ready");
  ui.setProgress(1);
}

export function SargamLab() {
  const eng = useRef<Engine | null>(null);
  if (eng.current == null) eng.current = createEngine();

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bannerRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLParagraphElement>(null);
  const taanRef = useRef<HTMLParagraphElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLParagraphElement>(null);
  const legendRef = useRef<HTMLParagraphElement>(null);
  const scrubRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<"analyzing" | "ready" | "error">("analyzing");
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState("Yaman study");
  const [running, setRunning] = useState(false);
  const [rate, setRate] = useState(1);
  const [clean, setClean] = useState(false);
  const [pitchClass, setPitchClass] = useState(0);
  const [cents, setCents] = useState(0);
  const [raag, setRaag] = useState<RaagId>("chromatic");
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);
  const [dropping, setDropping] = useState(false);

  const cleanRef = useRef(false);
  const actions = useRef({ toggle: () => {}, restart: () => {} });

  useEffect(() => {
    cleanRef.current = clean;
  }, [clean]);

  useEffect(() => {
    const engine = eng.current;
    if (!engine) return;
    const root = getComputedStyle(document.documentElement);
    engine.fonts = {
      deva: devanagari.style.fontFamily,
      sans: root.getPropertyValue("--font-hanken").trim() || "sans-serif",
      display: root.getPropertyValue("--font-anybody").trim() || "sans-serif",
    };
    engine.calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    void document.fonts.load(`600 16px ${devanagari.style.fontFamily}`);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let frame = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width < 2 || height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const bitmapW = Math.round(width * dpr);
      const bitmapH = Math.round(height * dpr);
      if (canvas.width !== bitmapW || canvas.height !== bitmapH) {
        canvas.width = bitmapW;
        canvas.height = bitmapH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const now = performance.now();
      if (engine.introStart != null && now - engine.introStart >= INTRO_MS) {
        engine.introStart = null;
        startAudio(engine, 0, () => setRunning(false));
        setRunning(true);
      }

      const bannerH = bannerRef.current?.offsetHeight ?? 68;
      const footH = footerRef.current?.offsetHeight ?? 92;
      const controlsH = cleanRef.current ? 0 : (controlsRef.current?.offsetHeight ?? 0);
      if (controlsRef.current) controlsRef.current.style.bottom = `${footH + 8}px`;
      const narrow = width < 720;
      let top = bannerH + (narrow ? 4 : 8);
      let bottom = height - footH - (controlsH > 0 ? controlsH + 14 : 4);
      if (bottom < top + 96) {
        top = Math.max(36, bannerH);
        bottom = height - Math.max(56, footH);
      }
      const plot = {
        top,
        bottom,
        left: narrow ? 52 : 88,
        right: width - (narrow ? 64 : 104),
        width,
        height,
      };
      const placed = placeRows(engine.rows, plot);

      if (engine.playing && engine.audio && !engine.scrubbing && engine.introStart == null) {
        const prev = engine.time;
        const next = Math.min(engine.duration, Math.max(0, songTime(engine)));
        engine.time = next;
        if (next - prev > 0.12) resetCursor(engine, next);
        else if (next > prev) fireOnsets(engine, prev, next, placed, now);
      }

      const intro =
        engine.introStart == null ? null : Math.min(1, (now - engine.introStart) / INTRO_MS);
      const notes = engine.analysis?.notes ?? [];
      const active = currentNote(notes, engine.introStart == null ? engine.time : 0);
      const drawFrame: DrawFrame = {
        width,
        height,
        dpr,
        time: engine.introStart == null ? engine.time : 0,
        intro,
        calm: engine.calm,
        track: engine.track,
        notes,
        repeats: engine.analysis?.repeats ?? [],
        rows: placed,
        plucks: engine.plucks,
        pings: engine.pings,
        now,
        activeKey: active ? `${active.swara}${active.octave}` : null,
        fonts: engine.fonts,
      };
      drawSargam(ctx, drawFrame, plot);
      paintChrome(
        engine,
        {
          stats: statsRef.current,
          taan: taanRef.current,
          strip: stripRef.current,
          counter: counterRef.current,
          legend: legendRef.current,
          scrub: scrubRef.current,
          live: liveRef.current,
        },
        active,
      );
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const engine = eng.current;
    if (!engine) return;
    const ctx = new AudioContext();
    engine.audio = ctx;
    const job = ++engine.job;
    const demo = synthesizeDemo(44100);
    const buffer = ctx.createBuffer(1, demo.samples.length, demo.sampleRate);
    buffer.getChannelData(0).set(demo.samples);
    const ui: AnalyseUi = { setPhase, setProgress, setRunning, setPitchClass, setCents, setDuration };
    void analyse(engine, buffer, job, ui);

    return () => {
      engine.job++;
      engine.worker?.terminate();
      stopSource(engine);
      void ctx.close();
      if (engine.audio === ctx) engine.audio = null;
    };
  }, []);

  async function openBuffer(buffer: AudioBuffer) {
    const engine = eng.current;
    if (!engine) return;
    const job = ++engine.job;
    engine.worker?.terminate();
    setError("");
    await analyse(engine, buffer, job, { setPhase, setProgress, setRunning, setPitchClass, setCents, setDuration });
  }

  async function loadFile(file: File) {
    const engine = eng.current;
    if (!engine) return;
    setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_]+/g, " "));
    engine.settings.touched = false;
    const ctx = engine.audio ?? new AudioContext();
    engine.audio = ctx;
    try {
      const encoded = await file.arrayBuffer();
      const buffer = await ctx.decodeAudioData(encoded.slice(0));
      await openBuffer(buffer);
      window.labTrack?.("upload", { type: file.type || "audio" });
    } catch {
      setPhase("error");
      setError("That file couldn’t be read. Try an mp3 or a wav.");
    }
  }

  async function loadDemo() {
    const engine = eng.current;
    if (!engine) return;
    setTitle("Yaman study");
    engine.settings.touched = false;
    const ctx = engine.audio ?? new AudioContext();
    engine.audio = ctx;
    const demo = synthesizeDemo(44100);
    const buffer = ctx.createBuffer(1, demo.samples.length, demo.sampleRate);
    buffer.getChannelData(0).set(demo.samples);
    await openBuffer(buffer);
  }

  function toggle() {
    const engine = eng.current;
    if (!engine || !engine.buffer || phase === "analyzing") return;
    if (engine.introStart != null || engine.playing) {
      if (engine.playing) {
        engine.time = songTime(engine);
        engine.offset = engine.time;
      }
      engine.introStart = null;
      stopSource(engine);
      setRunning(false);
      return;
    }
    void engine.audio?.resume();
    const atEnd = engine.time >= engine.duration - 0.05;
    if (atEnd) {
      engine.time = 0;
      engine.offset = 0;
      resetCursor(engine, 0);
    }
    const fromStart = engine.time < 0.05;
    if (fromStart && !engine.calm) {
      engine.introStart = performance.now();
      engine.time = 0;
      setRunning(true);
    } else {
      startAudio(engine, engine.time, () => setRunning(false));
      setRunning(true);
    }
    window.labTrack?.("play", { rate: engine.rate });
  }

  function restart() {
    const engine = eng.current;
    if (!engine || !engine.buffer || phase === "analyzing") return;
    void engine.audio?.resume();
    stopSource(engine);
    engine.time = 0;
    engine.offset = 0;
    engine.plucks = [];
    engine.pings = [];
    resetCursor(engine, 0);
    if (engine.calm) {
      startAudio(engine, 0, () => setRunning(false));
    } else {
      engine.introStart = performance.now();
    }
    setRunning(true);
  }

  useEffect(() => {
    actions.current.toggle = toggle;
    actions.current.restart = restart;
  });

  function changeSpeed(next: number) {
    const engine = eng.current;
    if (!engine) return;
    engine.rate = next;
    setRate(next);
    if (engine.playing) {
      const at = songTime(engine);
      startAudio(engine, at, () => setRunning(false));
    }
  }

  function changeTonic(nextClass: number, nextCents: number) {
    const engine = eng.current;
    if (!engine) return;
    engine.settings.touched = true;
    engine.settings.pitchClass = nextClass;
    engine.settings.cents = nextCents;
    setPitchClass(nextClass);
    setCents(nextCents);
    resegment(engine);
  }

  function changeRaag(next: RaagId) {
    const engine = eng.current;
    if (!engine) return;
    engine.settings.raag = next;
    setRaag(next);
    resegment(engine);
  }

  function beginScrub(event: ReactPointerEvent<HTMLInputElement>) {
    const engine = eng.current;
    if (!engine) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    engine.resumeAfterScrub = engine.playing || engine.introStart != null;
    if (engine.playing) engine.time = songTime(engine);
    engine.introStart = null;
    stopSource(engine);
    engine.scrubbing = true;
    setRunning(false);
  }

  function moveScrub(value: number) {
    const engine = eng.current;
    if (!engine) return;
    const time = Math.max(0, Math.min(engine.duration, value));
    engine.time = time;
    engine.offset = time;
    resetCursor(engine, time);
  }

  function endScrub() {
    const engine = eng.current;
    if (!engine) return;
    engine.scrubbing = false;
    if (engine.resumeAfterScrub && engine.buffer) {
      void engine.audio?.resume();
      startAudio(engine, engine.time, () => setRunning(false));
      setRunning(true);
    }
    engine.resumeAfterScrub = false;
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        actions.current.toggle();
      } else if (event.key === "c" || event.key === "C") {
        setClean((value) => !value);
      } else if (event.key === "r" || event.key === "R") {
        actions.current.restart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const busy = phase === "analyzing";

  return (
    <section
      ref={stageRef}
      className={`${styles.stage} ${devanagari.className}`}
      aria-label="Sargam"
      onDragOver={(event) => {
        event.preventDefault();
        setDropping(true);
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDropping(false);
        const file = event.dataTransfer.files[0];
        if (file) void loadFile(file);
      }}
    >
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <header ref={bannerRef} className={styles.banner}>
        <input
          className={styles.title}
          aria-label="Song title"
          value={title}
          spellCheck={false}
          onChange={(event) => setTitle(event.target.value)}
        />
        <div className={styles.stats}>
          <p ref={statsRef}>0 SWARAS · 0:00 · PEAK 0.0/S · NOW 0.0/S</p>
          <p ref={taanRef} className={styles.taan} hidden />
        </div>
      </header>

      <div
        ref={controlsRef}
        className={styles.controls}
        data-hidden={clean ? "true" : "false"}
        aria-hidden={clean}
      >
        <button type="button" className={styles.primary} onClick={toggle} disabled={busy}>
          {running ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={restart} disabled={busy}>
          Restart
        </button>
        <input
          ref={scrubRef}
          className={styles.scrub}
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          defaultValue={0}
          aria-label="Position in the song"
          disabled={busy}
          onPointerDown={beginScrub}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
          onInput={(event) => moveScrub(Number(event.currentTarget.value))}
        />
        <button type="button" aria-pressed={rate === 0.5} className={rate === 0.5 ? styles.pressed : undefined} onClick={() => changeSpeed(0.5)}>
          0.5×
        </button>
        <button type="button" aria-pressed={rate === 1} className={rate === 1 ? styles.pressed : undefined} onClick={() => changeSpeed(1)}>
          1×
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}>
          Upload
        </button>
        <button type="button" onClick={() => void loadDemo()} disabled={busy}>
          Demo
        </button>
        <label className={styles.field}>
          Sa
          <select
            aria-label="Tonic"
            value={pitchClass}
            disabled={busy}
            onChange={(event) => changeTonic(Number(event.target.value), cents)}
          >
            {PITCH_CLASSES.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Cents
          <input
            className={styles.cents}
            type="range"
            min={-50}
            max={50}
            step={1}
            value={cents}
            aria-label="Fine tune Sa in cents"
            disabled={busy}
            onChange={(event) => changeTonic(pitchClass, Number(event.target.value))}
          />
          <output>{cents > 0 ? `+${cents}` : cents}¢</output>
        </label>
        <label className={styles.field}>
          Raag
          <select
            aria-label="Raag"
            value={raag}
            disabled={busy}
            onChange={(event) => changeRaag(event.target.value as RaagId)}
          >
            {RAAGS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" aria-pressed={clean} onClick={() => setClean(true)}>
          Clean
        </button>
      </div>
      <input
        ref={fileRef}
        className={styles.sr}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.aac,.mp4"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void loadFile(file);
          event.target.value = "";
        }}
      />

      <footer ref={footerRef} className={styles.foot}>
        <div ref={stripRef} className={styles.strip} aria-hidden="true">
          <span className={styles.waiting}>Press play</span>
        </div>
        <p ref={counterRef} className={styles.counter}>
          SWARAS SUNG 000 / 0
        </p>
        <p ref={legendRef} className={styles.legend}>
          SA = C · _ = KOMAL · ’ = TIVRA
        </p>
      </footer>

      {clean && (
        <button type="button" className={styles.restore} onClick={() => setClean(false)}>
          Controls
        </button>
      )}

      {busy && (
        <div className={styles.overlay}>
          <div className={styles.card} role="status">
            <p>Reading the melody</p>
            <div className={styles.meter} aria-hidden="true">
              <i style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          </div>
        </div>
      )}
      {phase === "error" && (
        <div className={styles.overlay}>
          <div className={styles.card} role="alert">
            <p>Couldn’t read that</p>
            <p className={styles.hint}>{error}</p>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={() => void loadDemo()}>
                Play the demo
              </button>
              <button type="button" onClick={() => setPhase("ready")}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {dropping && <div className={styles.drop}>Drop the song</div>}
      <p ref={liveRef} className={styles.sr} aria-live="polite" />
    </section>
  );
}

function fireOnsets(engine: Engine, prev: number, time: number, rows: StringRow[], now: number) {
  const notes = engine.analysis?.notes ?? [];
  let cursor = engine.cursor;
  while (cursor < notes.length && notes[cursor].time <= time) {
    const note = notes[cursor];
    if (note.time >= prev - 0.02) {
      const key = `${note.swara}${note.octave}`;
      const row = rows.find((item) => item.key === key);
      const y = row ? row.y : yForMidi(note.midi, rows);
      engine.plucks.push({ key, born: now });
      engine.pings.push({ y, born: now });
      if (engine.plucks.length > 16) engine.plucks.shift();
      if (engine.pings.length > 16) engine.pings.shift();
    }
    cursor++;
  }
  engine.cursor = cursor;
}

function detectInWorker(
  engine: Engine,
  samples: Float32Array,
  sampleRate: number,
  job: number,
  onProgress: (ratio: number) => void,
): Promise<PitchTrack> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (track: PitchTrack) => {
      if (settled || engine.job !== job) return;
      settled = true;
      resolve(track);
    };
    let worker: Worker;
    try {
      worker = createPitchWorker();
    } catch {
      finish(detectPitch(samples, sampleRate, onProgress));
      return;
    }
    engine.worker = worker;
    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string;
        ratio?: number;
        t0?: number;
        dt?: number;
        freq?: Float32Array;
      };
      if (engine.job !== job) return;
      if (data.type === "progress" && typeof data.ratio === "number") onProgress(data.ratio);
      else if (data.type === "done" && data.freq && typeof data.t0 === "number" && typeof data.dt === "number") {
        worker.terminate();
        finish({ t0: data.t0, dt: data.dt, freq: data.freq });
      } else if (data.type === "error") {
        worker.terminate();
        finish(detectPitch(samples, sampleRate, onProgress));
      }
    };
    worker.onerror = () => {
      worker.terminate();
      finish(detectPitch(samples, sampleRate, onProgress));
    };
    worker.postMessage({ samples, sampleRate });
  });
}

declare global {
  interface Window {
    labTrack?: (event: string, props?: Record<string, string | number | boolean>) => void;
  }
}
