import { freqToMidi, type SwaraId } from "./swara";
import type { NoteEvent, PitchTrack, RepeatMark } from "./types";

export type Plot = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
};

export type StringRow = {
  key: string;
  swara: SwaraId;
  octave: number;
  midi: number;
  y: number;
  devanagari: string;
  latin: string;
  komal: boolean;
  tivra: boolean;
};

export type Pluck = { key: string; born: number };
export type Ping = { y: number; born: number };

export type DrawFrame = {
  width: number;
  height: number;
  dpr: number;
  time: number;
  /** 0…1 while the cyan playhead travels to centre. Null once playback owns it. */
  intro: number | null;
  calm: boolean;
  track: PitchTrack | null;
  notes: NoteEvent[];
  repeats: RepeatMark[];
  rows: StringRow[];
  plucks: Pluck[];
  pings: Ping[];
  now: number;
  activeKey: string | null;
  fonts: { deva: string; sans: string; display: string };
};

const BG = "#101010";
const NEON = "#ff2d5a";

/** High notes sit at the top. A handful of strings stay comfortably spaced. */
export function placeRows(rows: StringRow[], plot: Plot): StringRow[] {
  const count = rows.length;
  if (count === 0) return [];
  const pad = 16;
  const available = Math.max(48, plot.bottom - plot.top - pad * 2);
  if (count === 1) return [{ ...rows[0], y: plot.top + pad + available / 2 }];
  const spacing = Math.min(74, available / (count - 1));
  const total = spacing * (count - 1);
  const top = plot.top + pad + (available - total) / 2;
  return rows.map((row, index) => ({
    ...row,
    y: top + (count - 1 - index) * spacing,
  }));
}

export function yForMidi(midi: number, rows: StringRow[]): number {
  if (rows.length === 0) return 0;
  if (rows.length === 1 || midi <= rows[0].midi) {
    if (rows.length === 1) return rows[0].y;
    const span = rows[1].midi - rows[0].midi || 1;
    return rows[0].y + ((midi - rows[0].midi) / span) * (rows[1].y - rows[0].y);
  }
  const last = rows.length - 1;
  if (midi >= rows[last].midi) {
    const span = rows[last].midi - rows[last - 1].midi || 1;
    return rows[last].y + ((midi - rows[last].midi) / span) * (rows[last].y - rows[last - 1].y);
  }
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].midi <= midi) lo = mid;
    else hi = mid;
  }
  const span = rows[hi].midi - rows[lo].midi || 1;
  const t = (midi - rows[lo].midi) / span;
  return rows[lo].y + t * (rows[hi].y - rows[lo].y);
}

function easeOut(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return 1 - (1 - x) ** 3;
}

function stringOffset(x: number, playX: number, age: number, calm: boolean): number {
  if (calm || age < 0 || age > 1.15) return 0;
  const dist = x - playX;
  const ad = Math.abs(dist);
  const amp = 22 * Math.exp(-age * 2.1);
  const wave = Math.sin(ad * 0.09 - age * 36);
  const packet = Math.exp(-((ad - age * 920) ** 2) / (2 * 72 ** 2));
  return wave * amp * (0.22 + 0.78 * packet) * Math.exp(-ad / 640);
}

type Layer = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; w: number; h: number };

let trailLayer: Layer | null = null;

function trailSurface(width: number, height: number, dpr: number): Layer {
  const w = Math.max(1, Math.round(width * dpr));
  const h = Math.max(1, Math.round(height * dpr));
  if (!trailLayer || trailLayer.w !== w || trailLayer.h !== h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas");
    trailLayer = { canvas, ctx, w, h };
  }
  trailLayer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  trailLayer.ctx.clearRect(0, 0, width, height);
  return trailLayer;
}

type Run = { x: number; y: number }[];

function pitchRuns(frame: DrawFrame, playAnchor: number, pxPerSec: number, plot: Plot): Run[] {
  const track = frame.track;
  if (!track || track.freq.length === 0 || frame.rows.length === 0) return [];
  const lead = frame.width < 700 ? 2.2 : 3.45;
  const from = frame.time - lead - 0.05;
  const i0 = Math.max(0, Math.floor((from - track.t0) / track.dt));
  const i1 = Math.min(track.freq.length - 1, Math.ceil((frame.time - track.t0) / track.dt));
  const runs: Run[] = [];
  let run: Run = [];
  let prevMidi = Number.NaN;
  let prevTime = Number.NaN;

  for (let i = i0; i <= i1; i++) {
    const freq = track.freq[i];
    const t = track.t0 + i * track.dt;
    if (t > frame.time + 0.01) break;
    if (freq <= 0) {
      if (run.length > 1) runs.push(run);
      run = [];
      prevMidi = Number.NaN;
      continue;
    }
    const midi = freqToMidi(freq);
    const jumped = Number.isFinite(prevMidi) && Math.abs(midi - prevMidi) > 3.6;
    const gap = Number.isFinite(prevTime) && t - prevTime > track.dt * 2.4;
    if ((jumped || gap) && run.length > 1) runs.push(run);
    if (jumped || gap) run = [];
    const x = playAnchor + (t - frame.time) * pxPerSec;
    if (x < plot.left - 8) {
      prevMidi = midi;
      prevTime = t;
      run = [];
      continue;
    }
    if (x > playAnchor + 1) break;
    run.push({ x, y: yForMidi(midi, frame.rows) });
    prevMidi = midi;
    prevTime = t;
  }
  if (run.length > 1) runs.push(run);
  return runs;
}

function strokeRuns(ctx: CanvasRenderingContext2D, runs: Run[], width: number, color: string) {
  ctx.beginPath();
  for (const run of runs) {
    ctx.moveTo(run[0].x, run[0].y);
    for (let i = 1; i < run.length; i++) ctx.lineTo(run[i].x, run[i].y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawTrail(frame: DrawFrame, playAnchor: number, pxPerSec: number, plot: Plot) {
  const runs = pitchRuns(frame, playAnchor, pxPerSec, plot);
  if (runs.length === 0) return;
  const layer = trailSurface(frame.width, frame.height, frame.dpr);
  const ctx = layer.ctx;
  strokeRuns(ctx, runs, 18, "rgba(255, 40, 80, 0.16)");
  strokeRuns(ctx, runs, 8, "rgba(255, 47, 92, 0.42)");
  strokeRuns(ctx, runs, 2.7, NEON);
  strokeRuns(ctx, runs, 1.05, "rgba(255, 236, 240, 0.9)");

  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  const fade = ctx.createLinearGradient(plot.left, 0, playAnchor, 0);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(0.16, "rgba(0,0,0,1)");
  fade.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = fade;
  ctx.fillRect(plot.left - 20, 0, playAnchor - plot.left + 24, frame.height);
  ctx.restore();

  frameContextBlit(frame, layer);
}

let mainCtx: CanvasRenderingContext2D | null = null;

function frameContextBlit(frame: DrawFrame, layer: Layer) {
  if (!mainCtx) return;
  mainCtx.save();
  mainCtx.setTransform(1, 0, 0, 1, 0, 0);
  mainCtx.drawImage(layer.canvas, 0, 0);
  mainCtx.restore();
  mainCtx.setTransform(frame.dpr, 0, 0, frame.dpr, 0, 0);
}

function drawString(ctx: CanvasRenderingContext2D, row: StringRow, plot: Plot, playX: number, pluck: Pluck | undefined, now: number, active: boolean, calm: boolean) {
  const age = pluck ? (now - pluck.born) / 1000 : 99;
  ctx.beginPath();
  const steps = age < 1.15 ? 48 : 1;
  for (let i = 0; i <= steps; i++) {
    const x = plot.left + ((plot.right - plot.left) * i) / steps;
    const y = row.y + stringOffset(x, playX, age, calm);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = active ? "rgba(255, 70, 112, 0.95)" : "rgba(255,255,255,0.2)";
  ctx.lineWidth = active ? 1.6 : 1;
  ctx.stroke();
}

function drawLabels(ctx: CanvasRenderingContext2D, row: StringRow, plot: Plot, size: number, fonts: DrawFrame["fonts"], active: boolean) {
  ctx.save();
  ctx.shadowColor = active ? "rgba(255, 45, 90, 0.9)" : "transparent";
  ctx.shadowBlur = active ? 14 : 0;
  ctx.fillStyle = active ? NEON : "rgba(226, 226, 226, 0.86)";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${size}px ${fonts.deva}`;
  ctx.textAlign = "right";
  const dx = plot.left - 12;
  ctx.fillText(row.devanagari, dx, row.y);
  const width = ctx.measureText(row.devanagari).width;
  ctx.shadowBlur = 0;
  if (row.komal) {
    ctx.fillRect(dx - width, row.y + size * 0.46, width, Math.max(1.25, size * 0.07));
  }
  if (row.tivra) {
    const cx = dx - width / 2;
    ctx.fillRect(cx - 0.75, row.y - size * 0.86, 1.6, size * 0.28);
  }
  const dots = Math.min(3, Math.abs(row.octave));
  if (dots > 0) {
    const cx = dx - width / 2;
    const above = row.octave > 0;
    const y = above ? row.y - size * (row.tivra ? 1.02 : 0.72) : row.y + size * (row.komal ? 0.78 : 0.62);
    for (let i = 0; i < dots; i++) {
      ctx.beginPath();
      ctx.arc(cx + (i - (dots - 1) / 2) * 5, y, Math.max(1.3, size * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.font = `650 ${Math.max(11, size * 0.86)}px ${fonts.sans}`;
  ctx.textAlign = "left";
  ctx.shadowBlur = active ? 14 : 0;
  ctx.shadowColor = active ? "rgba(255, 45, 90, 0.9)" : "transparent";
  ctx.fillText(row.latin, plot.right + 12, row.y);
  if (row.octave < 0) {
    const latinWidth = ctx.measureText(row.latin).width;
    const cx = plot.right + 12 + latinWidth / 2;
    ctx.shadowBlur = 0;
    for (let i = 0; i < dots; i++) {
      ctx.beginPath();
      ctx.arc(cx + (i - (dots - 1) / 2) * 5, row.y + size * 0.58, Math.max(1.3, size * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBrackets(ctx: CanvasRenderingContext2D, frame: DrawFrame, anchor: number, pxPerSec: number, plot: Plot) {
  if (frame.notes.length === 0) return;
  ctx.save();
    ctx.font = `600 11px ${frame.fonts.sans}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.lineWidth = 1;
    for (const mark of frame.repeats) {
      const x0 = anchor + (mark.start - frame.time) * pxPerSec;
      const x1 = anchor + (mark.end - frame.time) * pxPerSec;
      if (x1 < plot.left || x0 > plot.right) continue;
      const left = Math.max(plot.left, x0);
      const right = Math.min(plot.right, x1);
      let y = Infinity;
      for (const note of frame.notes) {
        if (note.end < mark.start || note.time > mark.end) continue;
        y = Math.min(y, yForMidi(note.midi, frame.rows) - 16);
      }
      if (!Number.isFinite(y)) continue;
      y = Math.max(plot.top + 14, Math.min(y, plot.bottom - 24));
    ctx.strokeStyle = "rgba(186, 186, 186, 0.75)";
    ctx.beginPath();
    ctx.moveTo(left, y + 8);
    ctx.lineTo(left, y);
    ctx.lineTo(right, y);
    ctx.lineTo(right, y + 8);
    ctx.stroke();
    ctx.fillStyle = "rgba(196, 196, 196, 0.9)";
    const label = `[x${mark.times}]`;
    const mid = (left + right) / 2;
    if (mid > plot.left && mid < plot.right) ctx.fillText(label, mid, y - 2);
  }
  ctx.restore();
}

/** The graph: grid, strings, the neon pitch, and the playhead. Chrome is HTML. */
export function drawSargam(ctx: CanvasRenderingContext2D, frame: DrawFrame, plot: Plot) {
  mainCtx = ctx;
  const { width, height } = frame;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255,255,255,0.038)";
  ctx.lineWidth = 1;
  const grid = width < 700 ? 26 : 32;
  for (let x = 0.5; x < width; x += grid) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0.5; y < height; y += grid) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
  ctx.restore();

  const anchor = width / 2;
  const introT = frame.intro == null ? 1 : easeOut(frame.intro);
  const playX = frame.intro == null ? anchor : 14 + (anchor - 14) * introT;
  const lead = width < 700 ? 2.2 : 3.45;
  const pxPerSec = anchor / lead;

  const newest = new Map<string, Pluck>();
  for (const pluck of frame.plucks) newest.set(pluck.key, pluck);

  ctx.save();
  ctx.beginPath();
  ctx.rect(plot.left, plot.top - 28, plot.right - plot.left, plot.bottom - plot.top + 56);
  ctx.clip();
  for (const row of frame.rows) {
    drawString(ctx, row, plot, anchor, newest.get(row.key), frame.now, row.key === frame.activeKey, frame.calm);
  }
  ctx.restore();

  if (frame.intro == null) drawTrail(frame, anchor, pxPerSec, plot);

  ctx.save();
  ctx.beginPath();
  ctx.rect(plot.left, plot.top - 20, plot.right - plot.left, plot.bottom - plot.top + 40);
  ctx.clip();
  ctx.lineWidth = 1.35;
  ctx.strokeStyle = "rgba(198, 198, 198, 0.92)";
  for (const note of frame.notes) {
    const x = anchor + (note.time - frame.time) * pxPerSec;
    if (x < anchor - 0.5 || x > plot.right + 4) continue;
    const y = yForMidi(note.midi, frame.rows);
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawBrackets(ctx, frame, anchor, pxPerSec, plot);

  for (const ping of frame.pings) {
    const age = (frame.now - ping.born) / 1000;
    if (age < 0 || age > 0.62) continue;
    const alpha = (1 - age / 0.62) ** 1.15;
    for (const delay of [0, 0.08]) {
      const local = age - delay;
      if (local < 0) continue;
      ctx.beginPath();
      ctx.arc(anchor, ping.y, 4 + local * 148, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 70, 112, ${alpha * (delay ? 0.45 : 0.9)})`;
      ctx.lineWidth = delay ? 1.25 : 2;
      ctx.stroke();
    }
  }
  ctx.restore();

  const spacing = frame.rows.length > 1 ? Math.abs(frame.rows[1].y - frame.rows[0].y) : 46;
  const narrow = width < 700;
  const size = Math.max(narrow ? 11 : 12, Math.min(narrow ? 16 : 18, spacing * 0.4));
  for (const row of frame.rows) {
    drawLabels(ctx, row, plot, size, frame.fonts, row.key === frame.activeKey);
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(playX, plot.top - 4);
  ctx.lineTo(playX, plot.bottom + 4);
  if (frame.intro != null) {
    ctx.strokeStyle = "#3cefff";
    ctx.shadowColor = "rgba(60, 239, 255, 0.9)";
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2;
  } else {
    ctx.strokeStyle = "rgba(255,255,255,0.78)";
    ctx.lineWidth = 1.35;
  }
  ctx.stroke();
  ctx.restore();

  if (frame.intro == null && frame.track && frame.rows.length > 0) {
    const freq = freqAt(frame.track, frame.time);
    if (freq > 0) {
      const y = yForMidi(freqToMidi(freq), frame.rows);
      ctx.save();
      ctx.fillStyle = "#fff";
      ctx.shadowColor = NEON;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(anchor, y, 3.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function freqAt(track: PitchTrack, time: number): number {
  const index = (time - track.t0) / track.dt;
  const i0 = Math.floor(index);
  if (i0 < 0 || i0 >= track.freq.length) return 0;
  const a = track.freq[i0];
  const b = track.freq[Math.min(track.freq.length - 1, i0 + 1)] ?? 0;
  if (a <= 0) return 0;
  if (b <= 0) return a;
  const t = index - i0;
  return Math.exp(Math.log(a) * (1 - t) + Math.log(b) * t);
}
