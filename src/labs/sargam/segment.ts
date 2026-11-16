import type { NoteEvent, PitchTrack, RepeatMark } from "./types";
import { freqToMidi, pitchToSwara, snapSwara, SWARA_BY_ID, type SwaraId, type Tonic } from "./swara";

/** A frame this far from a swara centre is a glide, not a note. */
const STABLE_CENTS = 42;
/** Shorter than this and it is a passing tone inside a meend. */
const MIN_NOTE_SEC = 0.064;
/** How many unvoiced hops may sit inside one held note. */
const MAX_HOLE = 2;

type Mark = { swara: SwaraId; octave: number; midi: number } | null;

function markFrame(freq: number, tonic: Tonic, allowed: readonly number[] | null): Mark {
  if (freq <= 0) return null;
  let swara = pitchToSwara(freq, tonic.saFreq);
  if (Math.abs(swara.cents) > STABLE_CENTS) return null;
  if (allowed && allowed.length > 0) swara = snapSwara(swara, allowed);
  const info = SWARA_BY_ID[swara.id];
  return {
    swara: swara.id,
    octave: swara.octave,
    midi: freqToMidi(tonic.saFreq) + swara.octave * 12 + info.pc,
  };
}

/**
 * Collapse a pitch track into notes. Stable runs of one swara become a note;
 * anything shorter than MIN_NOTE_SEC is thrown away, which is what drops the
 * semitones a glide merely passes through.
 */
export function segmentNotes(track: PitchTrack, tonic: Tonic, allowed: readonly number[] | null): NoteEvent[] {
  const { freq, dt, t0 } = track;
  const marks: Mark[] = new Array(freq.length);
  for (let i = 0; i < freq.length; i++) marks[i] = markFrame(freq[i], tonic, allowed);

  const notes: NoteEvent[] = [];
  let i = 0;
  while (i < marks.length) {
    const start = marks[i];
    if (!start) {
      i++;
      continue;
    }
    let j = i + 1;
    let holes = 0;
    while (j < marks.length) {
      const mark = marks[j];
      if (!mark) {
        holes++;
        if (holes > MAX_HOLE) break;
        j++;
        continue;
      }
      if (mark.swara !== start.swara || mark.octave !== start.octave) break;
      holes = 0;
      j++;
    }
    while (j > i && !marks[j - 1]) j--;
    const time = t0 + i * dt;
    const end = t0 + j * dt;
    if (end - time >= MIN_NOTE_SEC) {
      notes.push({ time, end, swara: start.swara, octave: start.octave, midi: start.midi });
    }
    i = Math.max(j, i + 1);
  }

  // Join a note that was split by a one-hop dropout the grouper still broke on.
  const merged: NoteEvent[] = [];
  for (const note of notes) {
    const prev = merged[merged.length - 1];
    if (prev && prev.swara === note.swara && prev.octave === note.octave && note.time - prev.end < 0.05) {
      prev.end = note.end;
      continue;
    }
    merged.push({ ...note });
  }
  return merged;
}

function keysEqual(keys: string[], a: number, b: number, len: number): boolean {
  for (let i = 0; i < len; i++) if (keys[a + i] !== keys[b + i]) return false;
  return true;
}

/** Phrases of at least three swaras that repeat immediately, tagged x2, x3, … */
export function findRepeats(notes: NoteEvent[]): RepeatMark[] {
  const keys = notes.map((note) => `${note.swara}${note.octave}`);
  const used = new Array<boolean>(notes.length).fill(false);
  const marks: RepeatMark[] = [];
  const maxLen = Math.min(12, Math.floor(notes.length / 2));

  for (let len = maxLen; len >= 3; len--) {
    for (let i = 0; i + len * 2 <= notes.length; i++) {
      if (used[i]) continue;
      let times = 1;
      while (i + (times + 1) * len <= notes.length) {
        const next = i + times * len;
        if (used[next]) break;
        if (!keysEqual(keys, i, next, len)) break;
        const gap = notes[next].time - notes[next - 1].end;
        if (gap > 0.22) break;
        times++;
      }
      if (times < 2) continue;
      const last = i + times * len - 1;
      let blocked = false;
      for (let k = i; k <= last; k++) if (used[k]) blocked = true;
      if (blocked) continue;
      marks.push({ start: notes[i].time, end: notes[last].end, times });
      for (let k = i; k <= last; k++) used[k] = true;
    }
  }

  marks.sort((a, b) => a.start - b.start);
  return marks;
}

/** Onsets in the one second ending at `time`. */
export function swaraRate(notes: NoteEvent[], time: number, window = 1): number {
  let count = 0;
  for (let i = notes.length - 1; i >= 0; i--) {
    const t = notes[i].time;
    if (t > time) continue;
    if (t <= time - window) break;
    count++;
  }
  return count / window;
}

export function peakSwaraRate(notes: NoteEvent[], window = 1): number {
  let peak = 0;
  let start = 0;
  for (let i = 0; i < notes.length; i++) {
    while (notes[i].time - notes[start].time > window) start++;
    const rate = (i - start + 1) / window;
    if (rate > peak) peak = rate;
  }
  return peak;
}

/** Swaras the graph should draw a string for, low to high. */
export function visibleSwaras(
  track: PitchTrack,
  notes: NoteEvent[],
  tonic: Tonic,
  allowed: readonly number[] | null,
): { swara: SwaraId; octave: number; midi: number }[] {
  const byKey = new Map<string, { swara: SwaraId; octave: number; midi: number }>();
  const saMidi = freqToMidi(tonic.saFreq);

  if (allowed && allowed.length > 0) {
    const midis: number[] = [];
    for (let i = 0; i < track.freq.length; i++) {
      if (track.freq[i] > 0) midis.push(freqToMidi(track.freq[i]));
    }
    for (const note of notes) midis.push(note.midi);
    if (midis.length === 0) midis.push(saMidi, saMidi + 12);
    const lo = Math.min(...midis) - 0.5;
    const hi = Math.max(...midis) + 0.5;
    for (let semitone = Math.floor(lo - saMidi) - 1; semitone <= Math.ceil(hi - saMidi) + 1; semitone++) {
      const pc = mod(semitone);
      if (!allowed.includes(pc)) continue;
      const octave = Math.floor(semitone / 12);
      const midi = saMidi + semitone;
      if (midi < lo - 1 || midi > hi + 1) continue;
      const swara = SWARA_BY_ID_PC(pc);
      byKey.set(`${swara}${octave}`, { swara, octave, midi });
    }
  } else {
    for (const note of notes) {
      byKey.set(`${note.swara}${note.octave}`, { swara: note.swara, octave: note.octave, midi: note.midi });
    }
  }

  if (byKey.size === 0) {
    for (let semitone = 0; semitone <= 12; semitone++) {
      const pc = mod(semitone);
      if (allowed && !allowed.includes(pc) && semitone !== 12) continue;
      const swara = SWARA_BY_ID_PC(pc === 12 ? 0 : pc);
      const octave = Math.floor(semitone / 12);
      byKey.set(`${swara}${octave}`, { swara, octave, midi: saMidi + semitone });
    }
  }

  return [...byKey.values()].sort((a, b) => a.midi - b.midi);
}

function mod(n: number): number {
  return ((n % 12) + 12) % 12;
}

function SWARA_BY_ID_PC(pc: number): SwaraId {
  return (["S", "r", "R", "g", "G", "m", "M", "P", "d", "D", "n", "N"] as const)[pc];
}
