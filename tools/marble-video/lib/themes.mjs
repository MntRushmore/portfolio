// Which sampled instrument plays each of the lab's sounds. Every instrument sounds like what it
// looks like: the look comes from the lab's key type (lib/adapter.mjs), the sound from its hit.
// program: General MIDI program (0-based) in the SoundFont.  ring: note length in seconds.
export const VOICES = {
  marimba:      { program: 12, ring: 1.4, label: "Marimba (FluidR3_GM)" },
  xylophone:    { program: 13, ring: 0.9, label: "Xylophone (FluidR3_GM)" },
  vibraphone:   { program: 11, ring: 2.6, label: "Vibraphone (FluidR3_GM)" },
  glockenspiel: { program: 9,  ring: 2.2, label: "Glockenspiel (FluidR3_GM)" },
  piano:        { program: 0,  ring: 1.3, label: "Acoustic Grand Piano (FluidR3_GM)" },
};

export function applyVoices(plan) {
  for (const n of plan.notes) {
    const v = VOICES[n.sound];
    if (!v) throw new Error(`no voice for the lab sound "${n.sound}" (add it to VOICES in lib/themes.mjs)`);
    n.program = v.program; n.ring = v.ring;
  }
  plan.voices = [...new Set(plan.notes.map((n) => n.sound))].map((s) => ({ sound: s, ...VOICES[s] }));
  return plan;
}
