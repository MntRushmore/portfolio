import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeTrack } from "./analyze";
import { findRepeats, segmentNotes } from "./segment";
import { midiToFreq, pitchToSwara, snapSwara, SWARA_BY_ID } from "./swara";
import { scoreKeys, synthesizeDemo } from "./synth";
import { estimateTonic } from "./tonic";
import type { PitchTrack } from "./types";
import { detectPitch } from "./yin";

const C4 = midiToFreq(60);

function trackOf(freqs: number[], dt = 0.01): PitchTrack {
  return { t0: 0, dt, freq: Float32Array.from(freqs) };
}

function fill(freq: number, frames: number): number[] {
  return Array.from({ length: frames }, () => freq);
}

test("pitchToSwara names the twelve swaras and the octaves around Sa", () => {
  const sa = pitchToSwara(C4, C4);
  assert.equal(sa.id, "S");
  assert.equal(sa.octave, 0);
  assert.ok(Math.abs(sa.cents) < 1);

  assert.equal(pitchToSwara(C4 * 2 ** (1 / 12), C4).id, "r");
  assert.equal(pitchToSwara(C4 * 2 ** (2 / 12), C4).id, "R");
  assert.equal(pitchToSwara(C4 * 2 ** (3 / 12), C4).id, "g");
  assert.equal(pitchToSwara(C4 * 2 ** (4 / 12), C4).id, "G");
  assert.equal(pitchToSwara(C4 * 2 ** (5 / 12), C4).id, "m");
  assert.equal(pitchToSwara(C4 * 2 ** (6 / 12), C4).id, "M");
  assert.equal(pitchToSwara(C4 * 2 ** (7 / 12), C4).id, "P");
  assert.equal(pitchToSwara(C4 * 2 ** (8 / 12), C4).id, "d");
  assert.equal(pitchToSwara(C4 * 2 ** (9 / 12), C4).id, "D");
  assert.equal(pitchToSwara(C4 * 2 ** (10 / 12), C4).id, "n");
  assert.equal(pitchToSwara(C4 * 2 ** (11 / 12), C4).id, "N");

  const upper = pitchToSwara(C4 * 2, C4);
  assert.equal(upper.id, "S");
  assert.equal(upper.octave, 1);

  const mandraNi = pitchToSwara(C4 * 2 ** (-1 / 12), C4);
  assert.equal(mandraNi.id, "N");
  assert.equal(mandraNi.octave, -1);

  const shy = pitchToSwara(C4 * 2 ** (0.4 / 12), C4);
  assert.equal(shy.id, "S");
  assert.ok(shy.cents > 30 && shy.cents < 50);

  const justOver = pitchToSwara(C4 * 2 ** (0.6 / 12), C4);
  assert.equal(justOver.id, "r");
});

test("snapSwara keeps raag notes and pulls a foreign one to the nearest", () => {
  const bilawal = [0, 2, 4, 5, 7, 9, 11];
  const re = pitchToSwara(C4 * 2 ** (2 / 12), C4);
  assert.equal(snapSwara(re, bilawal).id, "R");

  const komalRe = pitchToSwara(C4 * 2 ** (1 / 12), C4);
  assert.equal(snapSwara(komalRe, bilawal).id, "S");

  const tivra = pitchToSwara(C4 * 2 ** (6 / 12), C4);
  const yaman = [0, 2, 4, 6, 7, 9, 11];
  assert.equal(snapSwara(tivra, yaman).id, "M");
  assert.equal(SWARA_BY_ID[snapSwara(tivra, yaman).id].tivra, true);
});

test("estimateTonic hears Sa as C in a Bilawal-shaped melody", () => {
  const weights: Array<[number, number]> = [
    [0, 24],
    [2, 8],
    [4, 8],
    [5, 6],
    [7, 14],
    [9, 6],
    [11, 6],
  ];
  const freqs: number[] = [];
  for (const [semi, count] of weights) {
    freqs.push(...fill(midiToFreq(60 + semi), count));
  }
  const tonic = estimateTonic(trackOf(freqs));
  assert.equal(tonic.pitchClass, 0);
  assert.ok(Math.abs(tonic.cents) < 8, `cents ${tonic.cents}`);
  assert.ok(Math.abs(tonic.saFreq - C4) < 2, `sa ${tonic.saFreq}`);
});

test("estimateTonic reports a sharp Sa in cents and still calls it C", () => {
  const sharp = 18;
  const semis = [0, 0, 0, 2, 4, 5, 7, 7, 9, 11, 0, 0];
  const freqs = semis.flatMap((semi) => fill(midiToFreq(60 + semi + sharp / 100), 6));
  const tonic = estimateTonic(trackOf(freqs));
  assert.equal(tonic.pitchClass, 0);
  assert.ok(Math.abs(tonic.cents - sharp) < 8, `cents ${tonic.cents}`);
});

test("estimateTonic does not take Pa for Sa just because Pa is frequent", () => {
  const freqs = [
    ...fill(midiToFreq(60), 10),
    ...fill(midiToFreq(64), 8),
    ...fill(midiToFreq(67), 18),
    ...fill(midiToFreq(69), 4),
    ...fill(midiToFreq(71), 4),
  ];
  const tonic = estimateTonic(trackOf(freqs));
  assert.equal(tonic.pitchClass, 0);
});

test("YIN measures a 440 Hz sine", () => {
  const sampleRate = 8000;
  const samples = new Float32Array(sampleRate);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = 0.6 * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
  }
  const track = detectPitch(samples, sampleRate);
  const voiced = [...track.freq].filter((freq) => freq > 0);
  assert.ok(voiced.length > 40, `voiced frames ${voiced.length}`);
  voiced.sort((a, b) => a - b);
  const median = voiced[voiced.length >> 1];
  assert.ok(Math.abs(median - 440) < 3, `median ${median}`);
});

test("segmentNotes splits held swaras and drops a fast passing tone", () => {
  const sa = C4;
  const re = midiToFreq(62);
  const ga = midiToFreq(64);
  const freqs = [...fill(sa, 20), ...fill(re, 3), ...fill(ga, 20)];
  const tonic = { pitchClass: 0, cents: 0, saFreq: sa };
  const notes = segmentNotes(trackOf(freqs), tonic, null);
  assert.deepEqual(
    notes.map((note) => note.swara),
    ["S", "G"],
  );
});

test("findRepeats marks an immediately repeated phrase and ignores a later one-off", () => {
  const phrase = ["S", "R", "G", "M", "G", "R", "S"] as const;
  const sequence = [...phrase, ...phrase];
  const notes = sequence.map((swara, i) => ({
    time: i * 0.34,
    end: i * 0.34 + 0.3,
    swara,
    octave: 0,
    midi: 60,
  }));
  // A Sa much later is not an immediate repeat of the phrase's last note.
  notes.push({ time: 20, end: 20.3, swara: "S", octave: 0, midi: 60 });
  const marks = findRepeats(notes);
  assert.equal(marks.length, 1);
  assert.equal(marks[0].times, 2);
  assert.ok(marks[0].start < 0.01);
});

test("the demo's detected swaras match the notes that were synthesised", () => {
  const demo = synthesizeDemo(22050);
  const track = detectPitch(demo.samples, demo.sampleRate);
  const analysis = analyzeTrack(track, null, "chromatic");
  const got = analysis.notes.map((note) => `${note.swara}${note.octave}`);
  const expected = scoreKeys(demo.score);
  assert.deepEqual(got, expected, `\nexpected ${expected.join(" ")}\ngot      ${got.join(" ")}`);

  assert.equal(analysis.auto.pitchClass, 0);
  assert.ok(Math.abs(analysis.auto.cents) < 15, `cents ${analysis.auto.cents}`);
  assert.ok(Math.abs(analysis.auto.saFreq - demo.saFreq) / demo.saFreq < 0.02);

  assert.ok(analysis.peak >= 6, `peak ${analysis.peak}`);
  assert.ok(
    analysis.repeats.some((mark) => mark.times >= 2),
    `repeats ${JSON.stringify(analysis.repeats)}`,
  );
});
