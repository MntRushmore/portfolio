import type { PitchTrack } from "./types";

/**
 * Pitch of the dominant melody, entirely offline.
 *
 * The signal is mixed (already mono), band-limited to roughly 70–1100 Hz and
 * resampled near 8 kHz. Each hop runs YIN (difference function, cumulative
 * mean normalisation, absolute threshold, parabolic interpolation). Frames
 * that fail the clarity or RMS gate are silence. A short median and an
 * octave check knock out the single-frame mistakes a vocal glide produces.
 */

const MIN_HZ = 75;
const MAX_HZ = 1150;
const CLARITY_MIN = 0.78;
const YIN_THRESHOLD = 0.15;

type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

function design(kind: "lowpass" | "highpass", freq: number, sampleRate: number): Biquad {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
  const a0 = 1 + alpha;
  const b0 = kind === "lowpass" ? (1 - cos) / 2 : (1 + cos) / 2;
  const b1 = kind === "lowpass" ? 1 - cos : -(1 + cos);
  const b2 = b0;
  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  };
}

function applyBiquad(samples: Float32Array, filter: Biquad) {
  let z1 = 0;
  let z2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    const y = filter.b0 * x + z1;
    z1 = filter.b1 * x - filter.a1 * y + z2;
    z2 = filter.b2 * x - filter.a2 * y;
    samples[i] = y;
  }
}

function bandLimit(samples: Float32Array, sampleRate: number) {
  const nyquist = sampleRate / 2;
  const high = Math.min(1100, nyquist * 0.9);
  const low = Math.min(70, high * 0.5);
  if (low > 20) applyBiquad(samples, design("highpass", low, sampleRate));
  if (high < nyquist * 0.95) applyBiquad(samples, design("lowpass", high, sampleRate));
}

/** Low-pass, then pick samples so the result sits near 8 kHz. */
export function prepare(samples: Float32Array, sampleRate: number): { samples: Float32Array; sampleRate: number } {
  const copy = samples.slice();
  let mean = 0;
  for (let i = 0; i < copy.length; i++) mean += copy[i];
  mean /= Math.max(1, copy.length);
  for (let i = 0; i < copy.length; i++) copy[i] -= mean;

  const target = 8000;
  if (sampleRate <= target * 1.15) {
    bandLimit(copy, sampleRate);
    return { samples: copy, sampleRate };
  }

  const factor = Math.max(2, Math.round(sampleRate / target));
  const outRate = sampleRate / factor;
  applyBiquad(copy, design("lowpass", outRate * 0.42, sampleRate));

  const outLen = Math.floor(copy.length / factor);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) out[i] = copy[i * factor];
  bandLimit(out, outRate);
  return { samples: out, sampleRate: outRate };
}

type RawFrame = { freq: number; clarity: number; rms: number };

function yinFrame(
  samples: Float32Array,
  start: number,
  half: number,
  sampleRate: number,
  tauMin: number,
  yin: Float32Array,
): { freq: number; clarity: number } {
  yin.fill(0);
  for (let tau = 1; tau < half; tau++) {
    let sum = 0;
    const base = start;
    const shifted = start + tau;
    for (let i = 0; i < half; i++) {
      const delta = samples[base + i] - samples[shifted + i];
      sum += delta * delta;
    }
    yin[tau] = sum;
  }

  yin[0] = 1;
  let running = 0;
  for (let tau = 1; tau < half; tau++) {
    running += yin[tau];
    yin[tau] = running > 0 ? (yin[tau] * tau) / running : 1;
  }

  let tau = -1;
  for (let t = tauMin; t < half; t++) {
    if (yin[t] < YIN_THRESHOLD) {
      while (t + 1 < half && yin[t + 1] < yin[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) return { freq: 0, clarity: 0 };

  let better = tau;
  if (tau > 0 && tau + 1 < half) {
    const s0 = yin[tau - 1];
    const s1 = yin[tau];
    const s2 = yin[tau + 1];
    const denom = 2 * s1 - s2 - s0;
    if (denom !== 0) {
      const shift = (s2 - s0) / (2 * denom);
      if (shift > -1 && shift < 1) better = tau + shift;
    }
  }
  const freq = sampleRate / better;
  const clarity = 1 - yin[tau];
  if (freq < MIN_HZ || freq > MAX_HZ) return { freq: 0, clarity };
  return { freq, clarity };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[index];
}

function fixOctaves(freq: Float32Array) {
  const window = 8;
  const logs: number[] = [];
  for (let i = 0; i < freq.length; i++) {
    if (freq[i] <= 0) continue;
    logs.length = 0;
    const from = Math.max(0, i - window);
    const to = Math.min(freq.length - 1, i + window);
    for (let j = from; j <= to; j++) {
      if (freq[j] > 0) logs.push(Math.log2(freq[j]));
    }
    if (logs.length < 5) continue;
    logs.sort((a, b) => a - b);
    const median = logs[logs.length >> 1];
    const semis = (Math.log2(freq[i]) - median) * 12;
    if (semis > 10 && semis < 14) freq[i] *= 0.5;
    else if (semis < -10 && semis > -14) freq[i] *= 2;
  }
}

function medianSmooth(freq: Float32Array) {
  const radius = 2;
  const next = new Float32Array(freq.length);
  const bin: number[] = [];
  for (let i = 0; i < freq.length; i++) {
    bin.length = 0;
    const from = Math.max(0, i - radius);
    const to = Math.min(freq.length - 1, i + radius);
    for (let j = from; j <= to; j++) {
      if (freq[j] > 0) bin.push(Math.log(freq[j]));
    }
    if (bin.length < radius + 1) continue;
    bin.sort((a, b) => a - b);
    next[i] = Math.exp(bin[bin.length >> 1]);
  }
  freq.set(next);
}

function postProcess(frames: RawFrame[], dt: number): PitchTrack {
  const rmsValues = frames.map((frame) => frame.rms).filter((rms) => rms > 1e-5);
  rmsValues.sort((a, b) => a - b);
  const loud = percentile(rmsValues, 0.86);
  const gate = Math.max(1e-4, loud * 0.12);

  const freq = new Float32Array(frames.length);
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    if (frame.rms < gate || frame.clarity < CLARITY_MIN || frame.freq < MIN_HZ || frame.freq > MAX_HZ) continue;
    freq[i] = frame.freq;
  }
  fixOctaves(freq);
  medianSmooth(freq);
  fixOctaves(freq);
  for (let i = 0; i < freq.length; i++) {
    if (freq[i] !== 0 && (freq[i] < MIN_HZ || freq[i] > MAX_HZ)) freq[i] = 0;
  }
  return { t0: 0, dt, freq };
}

export type PitchProgress = (ratio: number) => void;

/** Detect the melody. `onProgress` is called a few dozen times with 0…1. */
export function detectPitch(samples: Float32Array, sampleRate: number, onProgress?: PitchProgress): PitchTrack {
  const prepared = prepare(samples, sampleRate);
  const data = prepared.samples;
  const sr = prepared.sampleRate;
  const half = Math.max(48, Math.floor(sr / 70));
  const tauMin = Math.max(2, Math.floor(sr / 1250));
  const window = half * 2;
  const hop = Math.max(1, Math.round(sr / 100));
  const total = Math.max(1, Math.floor((data.length - window) / hop));
  const frames: RawFrame[] = [];
  const yin = new Float32Array(half);
  let reported = -1;

  for (let index = 0, start = 0; start + window <= data.length; index++, start += hop) {
    if (onProgress) {
      const step = Math.floor((index / total) * 40);
      if (step !== reported) {
        reported = step;
        onProgress(index / total);
      }
    }

    let energy = 0;
    for (let i = 0; i < window; i++) {
      const s = data[start + i];
      energy += s * s;
    }
    const rms = Math.sqrt(energy / window);
    if (rms < 1e-4) {
      frames.push({ freq: 0, clarity: 0, rms });
      continue;
    }
    const found = yinFrame(data, start, half, sr, tauMin, yin);
    frames.push({ freq: found.freq, clarity: found.clarity, rms });
  }

  onProgress?.(1);
  const dt = hop / sr;
  return postProcess(frames, dt);
}
