// Extra public-domain tunes that the web lab does not ship. Same shape as the lab's own songs:
// notes and bass are [midi, beats]; midi 0 is a rest. They are laid out by the lab's own solver
// (see score.mjs), so timing and physics are exactly as for the built-in tunes.
const D4 = 62, Ds4 = 63, E4 = 64, Fs4 = 66, G4 = 67, A4 = 69, B4 = 71, C5 = 72, D5 = 74, Ds5 = 75, E5 = 76;

// Scott Joplin, "The Entertainer" (1902), the whole first strain (16 bars; the lab's own copy is the
// first 8). One beat is a sixteenth.
const A1 = [[E4,1],[C5,2],[E4,1],[C5,2],[E4,1],[C5,6]];
const A3 = [[E5,1],[C5,1],[D5,1],[E5,2],[B4,1],[D5,2]];
const RUN = [[E5,1],[C5,1],[D5,1],[E5,2],[C5,1],[D5,1],[C5,1]];
const oom = (...pairs) => pairs.map((m) => [m, 4]);
export const EXTRA_TUNES = [
  { name: "The Entertainer", bpm: 380, sharps: true, credit: "Scott Joplin, 1902 (public domain)",
    // which instrument plays from which beat, in the lab's own format: piano first, bells for the reprise
    parts: [[0, "white", "Marimba and piano"], [66, "bell", "Brass bells"]],
    notes: [
      [D4,1],[Ds4,1],
      ...A1, [C5,1],[D5,1],[Ds5,1], ...A3, [C5,6],[D4,1],[Ds4,1],
      ...A1, [A4,1],[G4,1],[Fs4,1], [A4,1],[C5,1],[E5,2],[D5,1],[C5,1],[A4,1],[D5,7],[D4,1],[Ds4,1],
      ...A1, [C5,1],[D5,1],[Ds5,1], ...A3, [C5,6],[C5,1],[D5,1],
      ...RUN, ...RUN, ...A3, [C5,8]],
    bass: [[0,2],
      ...oom(48,55, 48,55, 48,43, 48,55,  48,55, 48,55, 50,54, 43,50,
             48,55, 48,55, 48,43, 48,55,  48,52, 53,54, 55,43), [48,8]] },
];

// Names the lab is known to ship (it may have more: any other name is passed to the lab as typed).
export const LAB_TUNES = ["Ode to Joy", "Twinkle", "Frère Jacques", "Für Elise", "Mountain King", "Canon in D", "Happy Birthday", "Greensleeves", "Jingle Bells"];
const plain = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
const ALIAS = { canon: "Canon in D", ode: "Ode to Joy", elise: "Für Elise", furelise: "Für Elise", frere: "Frère Jacques", jacques: "Frère Jacques",
  mountain: "Mountain King", hall: "Mountain King", twinkle: "Twinkle", entertainer: "The Entertainer", birthday: "Happy Birthday", jingle: "Jingle Bells" };
export function resolveTune(q) {
  const all = [...EXTRA_TUNES.map((t) => t.name), ...LAB_TUNES];
  const p = plain(String(q));
  const name = all.find((n) => plain(n) === p) || ALIAS[p] || all.find((n) => plain(n).includes(p)) || String(q);
  return { name, extra: EXTRA_TUNES.find((t) => t.name === name) || null };
}
export const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
