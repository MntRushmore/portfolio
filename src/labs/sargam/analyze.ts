import { findRepeats, peakSwaraRate, segmentNotes } from "./segment";
import { estimateTonic, tonicFromChoice } from "./tonic";
import type { Analysis, PitchTrack } from "./types";
import { raagPitchClasses, type RaagId, type Tonic } from "./swara";

export type TonicChoice = { pitchClass: number; cents: number } | null;

/**
 * Quantise a finished pitch track. Cheap enough to rerun when the listener
 * changes Sa or the raag: the slow part is the pitch track, and that stays.
 */
export function analyzeTrack(track: PitchTrack, choice: TonicChoice, raag: RaagId): Analysis {
  const auto = estimateTonic(track);
  const tonic: Tonic = choice ? tonicFromChoice(choice.pitchClass, choice.cents, track) : auto;
  const allowed = raagPitchClasses(raag);
  const notes = segmentNotes(track, tonic, allowed);
  return {
    auto,
    tonic,
    notes,
    repeats: findRepeats(notes),
    peak: peakSwaraRate(notes),
  };
}
