import type { SwaraId, Tonic } from "./swara";

/** A pitch track. freq[i] is Hz at time t0 + i * dt, or 0 when unvoiced. */
export type PitchTrack = {
  t0: number;
  dt: number;
  freq: Float32Array;
};

export type NoteEvent = {
  /** Onset, seconds. */
  time: number;
  end: number;
  swara: SwaraId;
  octave: number;
  /** Absolute MIDI of the quantised swara (fractional when Sa is detuned). */
  midi: number;
};

export type RepeatMark = {
  start: number;
  end: number;
  times: number;
};

export type Analysis = {
  /** What the histogram guessed, before any override. */
  auto: Tonic;
  tonic: Tonic;
  notes: NoteEvent[];
  repeats: RepeatMark[];
  /** Fastest 1-second run, in swaras per second. */
  peak: number;
};

export const TAAN_RATE = 6;
