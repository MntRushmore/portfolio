import type { PitchTrack } from "./types";
import { freqToMidi, mod12, referenceSa, type Tonic } from "./swara";

/**
 * How much each swara, counted from a candidate Sa, usually shows up in a
 * khayal. Sa and Pa carry the most weight; komal and tivra notes less, so a
 * song that sits on Pa is not mistaken for one whose Sa is Pa.
 */
const TEMPLATE = [3.1, 0.35, 1.55, 0.4, 1.6, 1.35, 0.65, 2.35, 0.45, 1.4, 0.45, 1.5];

function voicedMidis(track: PitchTrack): number[] {
  const midis: number[] = [];
  for (let i = 0; i < track.freq.length; i++) {
    const f = track.freq[i];
    if (f > 70 && f < 1200) midis.push(freqToMidi(f));
  }
  return midis;
}

/**
 * Guess Sa from a pitch-class histogram. Frames that are mid-glide (more
 * than 40 cents off a semitone) are left out, so a meend doesn't vote.
 */
export function estimateTonic(track: PitchTrack): Tonic {
  const midis = voicedMidis(track);
  const hist = new Float64Array(12);
  const fine: number[][] = Array.from({ length: 12 }, () => []);

  for (const midi of midis) {
    const rounded = Math.round(midi);
    const cents = (midi - rounded) * 100;
    if (Math.abs(cents) > 40) continue;
    const pc = mod12(rounded);
    hist[pc] += 1;
    fine[pc].push(cents);
  }

  const votes = hist.reduce((sum, n) => sum + n, 0);
  if (votes < 8) {
    return { pitchClass: 0, cents: 0, saFreq: referenceSa(0, 0, midis) };
  }

  let bestPc = 0;
  let bestScore = -Infinity;
  for (let tonic = 0; tonic < 12; tonic++) {
    let score = 0;
    for (let step = 0; step < 12; step++) score += hist[mod12(tonic + step)] * TEMPLATE[step];
    const sa = hist[tonic];
    const pa = hist[mod12(tonic + 7)];
    if (sa > 0 && pa > 0) score *= 1.12;
    if (score > bestScore) {
      bestScore = score;
      bestPc = tonic;
    }
  }

  const centsList = fine[bestPc].slice().sort((a, b) => a - b);
  const cents = centsList.length === 0 ? 0 : centsList[Math.floor(centsList.length / 2)];
  const clamped = Math.max(-50, Math.min(50, cents));
  return {
    pitchClass: bestPc,
    cents: clamped,
    saFreq: referenceSa(bestPc, clamped, midis),
  };
}

/** A Sa the listener picked, placed in the octave the melody actually uses. */
export function tonicFromChoice(pitchClass: number, cents: number, track: PitchTrack): Tonic {
  const pc = mod12(pitchClass);
  const fine = Math.max(-50, Math.min(50, cents));
  return { pitchClass: pc, cents: fine, saFreq: referenceSa(pc, fine, voicedMidis(track)) };
}
