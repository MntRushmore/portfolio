import { midiToFreq, SWARA_BY_ID, type SwaraId } from "./swara";

/**
 * A short original melody in Yaman: a phrase sung twice, a line that glides
 * up to taar Sa, and a taan. Synthesised here so the page has something to
 * play without shipping anyone else's recording.
 *
 * The tone is a few harmonics plus a narrow vibrato, close enough to a voice
 * that the same pitch tracker used on an upload locks onto it.
 */

export type ScoreNote = {
  swara: SwaraId;
  octave: number;
  /** When the note starts sounding, including its glide in. */
  start: number;
  dur: number;
};

export type DemoAudio = {
  samples: Float32Array;
  sampleRate: number;
  score: ScoreNote[];
  /** Madhya Sa, C4. */
  saFreq: number;
};

const SA_MIDI = 60;

type Item = {
  swara: SwaraId;
  octave: number;
  dur: number;
  gap: number;
  glide: number;
};

function item(swara: SwaraId, octave: number, dur: number, gap: number, glide = 0.016): Item {
  return { swara, octave, dur, gap, glide };
}

function scoreItems(): Item[] {
  const phrase: Item[] = (
    [
      ["S", 0],
      ["R", 0],
      ["G", 0],
      ["M", 0],
      ["G", 0],
      ["R", 0],
      ["S", 0],
    ] as const
  ).map(([swara, octave]) => item(swara, octave, 0.34, 0.048, 0.018));

  const line: Item[] = [
    item("N", -1, 0.38, 0.04, 0.02),
    item("S", 0, 0.36, 0.04, 0.02),
    item("R", 0, 0.32, 0.04, 0.02),
    item("G", 0, 0.32, 0.04, 0.02),
    item("M", 0, 0.34, 0.04, 0.02),
    item("P", 0, 0.34, 0.04, 0.02),
    item("D", 0, 0.36, 0.05, 0.12),
    item("S", 1, 0.62, 0.08, 0.02),
  ];

  const taanShape = [
    ["S", 0],
    ["R", 0],
    ["G", 0],
    ["M", 0],
    ["P", 0],
    ["D", 0],
    ["N", 0],
    ["S", 1],
    ["N", 0],
    ["D", 0],
    ["P", 0],
    ["M", 0],
    ["G", 0],
    ["R", 0],
    ["S", 0],
    ["R", 0],
    ["G", 0],
    ["M", 0],
    ["P", 0],
    ["D", 0],
    ["N", 0],
    ["S", 1],
  ] as const;

  const taan = taanShape.map(([swara, octave]) => item(swara, octave, 0.1, 0.016, 0.008));

  return [
    ...phrase,
    ...phrase,
    ...line,
    ...taan,
    item("S", 0, 0.72, 0.25, 0.04),
  ];
}

function noteFreq(swara: SwaraId, octave: number, saFreq: number): number {
  return saFreq * 2 ** ((octave * 12 + SWARA_BY_ID[swara].pc) / 12);
}

const HARMONICS = [1, 0.32, 0.14, 0.06, 0.025];

export function synthesizeDemo(sampleRate = 44100): DemoAudio {
  const saFreq = midiToFreq(SA_MIDI);
  const items = scoreItems();
  const score: ScoreNote[] = [];
  let cursor = 0.06;
  for (const entry of items) {
    score.push({ swara: entry.swara, octave: entry.octave, start: cursor, dur: entry.dur });
    cursor += entry.dur + entry.gap;
  }
  const duration = cursor + 0.15;
  const samples = new Float32Array(Math.ceil(duration * sampleRate));

  let previous = saFreq;
  const phases = [0, 0, 0, 0, 0];

  for (let n = 0; n < items.length; n++) {
    const entry = items[n];
    const note = score[n];
    const target = noteFreq(entry.swara, entry.octave, saFreq);
    const start = Math.floor(note.start * sampleRate);
    const end = Math.min(samples.length, Math.floor((note.start + entry.dur) * sampleRate));
    const glideSamples = Math.floor(entry.glide * sampleRate);
    const vibrato = entry.dur > 0.22;

    for (let i = start; i < end; i++) {
      const local = (i - start) / sampleRate;
      let freq = target;
      if (i - start < glideSamples && glideSamples > 0) {
        const t = (i - start) / glideSamples;
        const shaped = t * t * (3 - 2 * t);
        freq = previous * (target / previous) ** shaped;
      }
      if (vibrato && local > entry.glide) {
        const depth = 11 / 1200;
        freq *= 2 ** (depth * Math.sin(2 * Math.PI * 5.4 * local));
      }

      let sample = 0;
      for (let h = 0; h < HARMONICS.length; h++) {
        phases[h] += (2 * Math.PI * freq * (h + 1)) / sampleRate;
        sample += HARMONICS[h] * Math.sin(phases[h]);
      }

      const attack = Math.min(1, local / 0.018);
      const remain = entry.dur - local;
      const release = Math.min(1, remain / 0.028);
      const env = Math.max(0, Math.min(attack, release));
      samples[i] += sample * env * 0.46;
    }
    previous = target;
  }

  return { samples, sampleRate, score, saFreq };
}

export function scoreKeys(score: ScoreNote[]): string[] {
  return score.map((note) => `${note.swara}${note.octave}`);
}
