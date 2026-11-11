// Audio: the plan's notes -> a Standard MIDI File -> FluidSynth (sampled instruments from a
// SoundFont) -> master to -14 LUFS integrated, true peak <= -1 dBTP, 48 kHz stereo.
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const SR = 48000;
const TICKS_PER_SECOND = 25000;         // 60 bpm, 25000 ticks per quarter: 40 µs resolution
// Pan positions per instrument, each on its own MIDI channel (15 melodic channels in all).
const PAN_SETS = { 5: [-0.62, -0.31, 0, 0.31, 0.62], 3: [-0.5, 0, 0.5], 1: [0] };

const vlq = (n) => { const out = [n & 0x7f]; while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80); return out; };
export const velocityOf = (loudness) => Math.max(1, Math.min(127, Math.round(40 + 80 * loudness)));
export const panOf = (x, width) => Math.max(-1, Math.min(1, ((x / width) - 0.5) * 2 * 0.75));

// Notes that go to FluidSynth: { time (s from the start of the video), midi, velocity, pan, program, ring }.
export function writeMidi(notes, totalSeconds) {
  const programs = [...new Set(notes.map((n) => n.program))];
  const PAN_BINS = PAN_SETS[programs.length <= 3 ? 5 : programs.length <= 5 ? 3 : 1];
  if (programs.length > 15) throw new Error("too many GM programs for one MIDI file");
  const chans = [...Array(16).keys()].filter((c) => c !== 9);
  const chanOf = (program, bin) => chans[programs.indexOf(program) * PAN_BINS.length + bin];
  const ev = [];
  programs.forEach((p) => PAN_BINS.forEach((pan, b) => {
    const c = chanOf(p, b);
    ev.push([0, 0, 0xc0 | c, p]);
    ev.push([0, 0, 0xb0 | c, 10, Math.round(64 + pan * 63)]);
    ev.push([0, 0, 0xb0 | c, 7, 110]);
    ev.push([0, 0, 0xb0 | c, 91, 46]);       // reverb send
    ev.push([0, 0, 0xb0 | c, 93, 0]);        // no chorus
  }));
  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const open = new Map();                    // "chan:key" -> index into offs
  const offs = [];
  for (const n of sorted) {
    let bin = 0;
    PAN_BINS.forEach((p, i) => { if (Math.abs(p - n.pan) < Math.abs(PAN_BINS[bin] - n.pan)) bin = i; });
    const c = chanOf(n.program, bin), key = n.midi, on = Math.round(n.time * TICKS_PER_SECOND);
    const id = `${c}:${key}`;
    if (open.has(id) && offs[open.get(id)][0] >= on) offs[open.get(id)][0] = on - 1;   // same bar struck again
    ev.push([on, 2, 0x90 | c, key, n.velocity]);
    open.set(id, offs.length);
    offs.push([on + Math.round(n.ring * TICKS_PER_SECOND), 1, 0x80 | c, key, 0]);
  }
  ev.push(...offs);
  ev.push([Math.round(totalSeconds * TICKS_PER_SECOND), 3, 0xb0, 121, 0]);            // keeps the file as long as the video
  ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const bytes = [0x00, 0xff, 0x51, 0x03, 0x0f, 0x42, 0x40];                           // tempo: 1 000 000 µs per quarter
  let last = 0;
  for (const e of ev) { bytes.push(...vlq(e[0] - last), ...e.slice(2)); last = e[0]; }
  bytes.push(0x00, 0xff, 0x2f, 0x00);
  const head = Buffer.from([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, TICKS_PER_SECOND >> 8, TICKS_PER_SECOND & 0xff]);
  const trk = Buffer.alloc(8); trk.write("MTrk"); trk.writeUInt32BE(bytes.length, 4);
  return Buffer.concat([head, trk, Buffer.from(bytes)]);
}

function decode(file, channels) {
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-f", "f32le", "-ac", String(channels), "-ar", String(SR), "-"], { maxBuffer: 1 << 30 });
  return new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
}

function measure(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" });
  const tail = r.stderr.slice(r.stderr.lastIndexOf("Summary:"));
  const num = (re) => parseFloat((re.exec(tail) || [0, "NaN"])[1]);
  return { lufs: num(/I:\s+(-?[\d.]+) LUFS/), lra: num(/LRA:\s+(-?[\d.]+) LU/), truePeak: num(/Peak:\s+(-?[\d.]+) dBFS/) };
}

// plan.notes need: t, midi, loudness, x, program (General MIDI), ring.
export function renderAudio(plan, { workDir, outWav, soundfont, log = () => {} }) {
  fs.mkdirSync(workDir, { recursive: true });
  const total = plan.end - plan.start;
  const notes = plan.notes.map((n) => ({
    time: n.t - plan.start, midi: n.midi, velocity: velocityOf(n.loudness),
    pan: panOf(n.x, plan.field.width), program: n.program, ring: n.ring ?? 1.2,
  }));
  const mix = new Float32Array(Math.ceil(total * SR) * 2);
  const used = [];

  const gm = notes;
  if (gm.length) {
    const mid = path.join(workDir, "score.mid"), stem = path.join(workDir, "fluid.wav");
    fs.writeFileSync(mid, writeMidi(gm, total));
    const r = spawnSync("fluidsynth", ["-ni", "-q", "-F", stem, "-r", String(SR), "-g", "0.7",
      // A large, bright room (a tiled wall): of the reverbs tried, this is the smallest that earshot reads
      // as "real or pro-produced" (p_real 0.77; the earlier small room read 0.69, dry 0.56).
      "-o", "synth.reverb.active=1", "-o", "synth.reverb.room-size=0.85", "-o", "synth.reverb.damp=0.2",
      "-o", "synth.reverb.width=0.9", "-o", "synth.reverb.level=0.8", "-o", "synth.chorus.active=0",
      "-o", "synth.polyphony=256", soundfont, mid], { encoding: "utf8" });
    if (r.status !== 0 || !fs.existsSync(stem)) throw new Error("fluidsynth failed: " + (r.stderr || r.error));
    const a = decode(stem, 2);
    for (let i = 0; i < Math.min(a.length, mix.length); i++) mix[i] += a[i];
    used.push(`FluidSynth + ${path.basename(soundfont)} (${gm.length} notes)`);
  }
  // short fades so the file never starts or ends on a step
  const fin = Math.round(0.01 * SR), fout = Math.round(0.6 * SR), n = mix.length / 2;
  for (let i = 0; i < fin; i++) { mix[i * 2] *= i / fin; mix[i * 2 + 1] *= i / fin; }
  for (let i = 0; i < fout; i++) { const g = (i / fout) ** 2, o = n - 1 - i; mix[o * 2] *= g; mix[o * 2 + 1] *= g; }
  const raw = path.join(workDir, "mix.f32");
  fs.writeFileSync(raw, Buffer.from(mix.buffer));
  const pre = path.join(workDir, "premaster.wav");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "f32le", "-ar", String(SR), "-ac", "2", "-i", raw, "-c:a", "pcm_f32le", pre]);

  // Master: static gain to -14 LUFS, then a look-ahead limiter run at 4x the sample rate so
  // inter-sample peaks stay under -1 dBTP. Two passes: measure, correct, measure again.
  const TARGET = -14, CEIL = -1.3;
  let gain = TARGET - measure(pre).lufs, m = null;
  for (let pass = 0; pass < 3; pass++) {
    // A very quiet room tone (brown noise, about -49 dBFS RMS, different left and right) sits under the
    // whole piece so the gaps between notes are a room, not digital silence.
    const tone = (seed) => `anoisesrc=color=brown:amplitude=0.02:sample_rate=${SR}:duration=${total.toFixed(3)}:seed=${seed},highpass=f=40`;
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", pre, "-filter_complex",
      `${tone(7)}[nl];${tone(11)}[nr];[nl][nr]join=inputs=2:channel_layout=stereo,afade=t=in:d=0.4,afade=t=out:st=${(total - 0.7).toFixed(3)}:d=0.7[n];` +
      `[0:a]volume=${gain.toFixed(2)}dB[a];[a][n]amix=inputs=2:normalize=0:duration=first,` +
      `aresample=${SR * 4},alimiter=limit=${(10 ** (CEIL / 20)).toFixed(4)}:attack=3:release=80:level=false:latency=1,aresample=${SR}[o]`,
      "-map", "[o]", "-c:a", "pcm_s24le", outWav]);
    m = measure(outWav);
    log(`  master pass ${pass + 1}: ${m.lufs.toFixed(1)} LUFS, ${m.truePeak.toFixed(1)} dBTP, LRA ${m.lra.toFixed(1)} LU`);
    if (Math.abs(m.lufs - TARGET) < 0.15) break;
    gain += TARGET - m.lufs;
  }
  fs.rmSync(raw, { force: true });
  return { ...m, sources: used, wav: outWav };
}
