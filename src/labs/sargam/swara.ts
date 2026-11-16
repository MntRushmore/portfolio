/**
 * Hindustani swaras: twelve pitch classes, their names, and the raags the
 * lab can snap a melody to. Sa is whatever tonic the listener sets.
 */

export type SwaraId = "S" | "r" | "R" | "g" | "G" | "m" | "M" | "P" | "d" | "D" | "n" | "N";

export type SwaraInfo = {
  id: SwaraId;
  /** Semitones above Sa. */
  pc: number;
  /** Latin name. Lowercase is komal, an apostrophe is tivra. */
  latin: string;
  devanagari: string;
  komal: boolean;
  tivra: boolean;
};

export const SWARAS: readonly SwaraInfo[] = [
  { id: "S", pc: 0, latin: "Sa", devanagari: "सा", komal: false, tivra: false },
  { id: "r", pc: 1, latin: "re", devanagari: "रे", komal: true, tivra: false },
  { id: "R", pc: 2, latin: "Re", devanagari: "रे", komal: false, tivra: false },
  { id: "g", pc: 3, latin: "ga", devanagari: "ग", komal: true, tivra: false },
  { id: "G", pc: 4, latin: "Ga", devanagari: "ग", komal: false, tivra: false },
  { id: "m", pc: 5, latin: "Ma", devanagari: "म", komal: false, tivra: false },
  { id: "M", pc: 6, latin: "Ma'", devanagari: "म", komal: false, tivra: true },
  { id: "P", pc: 7, latin: "Pa", devanagari: "प", komal: false, tivra: false },
  { id: "d", pc: 8, latin: "dha", devanagari: "ध", komal: true, tivra: false },
  { id: "D", pc: 9, latin: "Dha", devanagari: "ध", komal: false, tivra: false },
  { id: "n", pc: 10, latin: "ni", devanagari: "नि", komal: true, tivra: false },
  { id: "N", pc: 11, latin: "Ni", devanagari: "नि", komal: false, tivra: false },
] as const;

export const SWARA_BY_ID: Record<SwaraId, SwaraInfo> = Object.fromEntries(SWARAS.map((s) => [s.id, s])) as Record<
  SwaraId,
  SwaraInfo
>;

/** C is 0. The dropdown is every semitone; cents are the fine nudge on top. */
export const PITCH_CLASSES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"] as const;

export const A4 = 440;

export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / A4);
}

export function midiToFreq(midi: number): number {
  return A4 * 2 ** ((midi - 69) / 12);
}

export function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

export type SwaraAt = {
  id: SwaraId;
  /** 0 is madhya saptak, +1 taar, −1 mandra. */
  octave: number;
  /** Signed distance from the nearest swara centre, in cents. */
  cents: number;
  /** Semitones from madhya Sa, rounded. */
  semitone: number;
};

/** Map a frequency onto the swara lattice of a given madhya Sa. */
export function pitchToSwara(freq: number, saFreq: number): SwaraAt {
  const semitones = 12 * Math.log2(freq / saFreq);
  const rounded = Math.round(semitones);
  const cents = (semitones - rounded) * 100;
  const pc = mod12(rounded);
  const octave = Math.floor(rounded / 12);
  return { id: SWARAS[pc].id, octave, cents, semitone: rounded };
}

/**
 * Move a swara onto the nearest allowed pitch class (a raag). Ties break
 * toward the lower neighbour, so komal re in Bilawal becomes Sa.
 */
export function snapSwara(swara: SwaraAt, allowed: readonly number[]): SwaraAt {
  const pc = mod12(swara.semitone);
  let best = allowed[0];
  let bestDist = 99;
  for (const candidate of allowed) {
    const dist = Math.min(Math.abs(candidate - pc), 12 - Math.abs(candidate - pc));
    if (dist < bestDist || (dist === bestDist && candidate < best)) {
      best = candidate;
      bestDist = dist;
    }
  }
  let delta = best - pc;
  if (delta > 6) delta -= 12;
  if (delta < -6) delta += 12;
  const semitone = swara.semitone + delta;
  const nextPc = mod12(semitone);
  return {
    id: SWARAS[nextPc].id,
    octave: Math.floor(semitone / 12),
    cents: swara.cents,
    semitone,
  };
}

/** Latin label. An apostrophe per octave above madhya; a dot is drawn for mandra. */
export function latinLabel(id: SwaraId, octave: number): string {
  const base = SWARA_BY_ID[id].latin;
  if (octave > 0) return base + "'".repeat(octave);
  return base;
}

export type RaagId = "chromatic" | "yaman" | "bhairav" | "puriya-dhanashree" | "bilawal" | "kafi";

export type Raag = {
  id: RaagId;
  name: string;
  /** Null means every swara is allowed. */
  swaras: readonly SwaraId[] | null;
};

export const RAAGS: readonly Raag[] = [
  { id: "chromatic", name: "Chromatic", swaras: null },
  { id: "yaman", name: "Yaman", swaras: ["S", "R", "G", "M", "P", "D", "N"] },
  { id: "bhairav", name: "Bhairav", swaras: ["S", "r", "G", "m", "P", "d", "N"] },
  { id: "puriya-dhanashree", name: "Puriya Dhanashree", swaras: ["S", "r", "G", "M", "P", "d", "N"] },
  { id: "bilawal", name: "Bilawal", swaras: ["S", "R", "G", "m", "P", "D", "N"] },
  { id: "kafi", name: "Kafi", swaras: ["S", "R", "g", "m", "P", "D", "n"] },
];

export function raagById(id: RaagId): Raag {
  return RAAGS.find((r) => r.id === id) ?? RAAGS[0];
}

export function raagPitchClasses(id: RaagId): number[] | null {
  const raag = raagById(id);
  if (!raag.swaras) return null;
  return raag.swaras.map((s) => SWARA_BY_ID[s].pc);
}

export type Tonic = {
  /** 0 is C. */
  pitchClass: number;
  /** Fine offset of Sa, in cents, roughly −50…+50. */
  cents: number;
  /** Frequency of madhya Sa. */
  saFreq: number;
};

/**
 * Pick the Sa an octave below the bulk of the melody, so most notes land in
 * madhya or taar saptak rather than a pile of ledger dots.
 */
export function referenceSa(pitchClass: number, cents: number, midis: number[]): number {
  const base = pitchClass + cents / 100;
  if (midis.length === 0) return midiToFreq(60 + base);
  const sorted = midis.slice().sort((a, b) => a - b);
  const anchor = sorted[Math.floor(sorted.length * 0.35)];
  let sa = base;
  sa += 12 * Math.floor((anchor - sa) / 12);
  return midiToFreq(sa);
}

export function formatCents(cents: number): string {
  const rounded = Math.round(cents);
  if (rounded === 0) return "0¢";
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${Math.abs(rounded)}¢`;
}

export function tonicLegend(tonic: Tonic): string {
  const name = PITCH_CLASSES[mod12(tonic.pitchClass)];
  const fine = Math.abs(tonic.cents) >= 1 ? ` ${formatCents(tonic.cents)}` : "";
  return `SA = ${name}${fine} · _ = KOMAL · ’ = TIVRA`;
}
