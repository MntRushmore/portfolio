// The ONLY file that knows the web lab's score format (marble-run-score/1, see
// public/lab-files/marble-run/SCORE.md). It turns a lab score into the pipeline's own "plan".
// If the lab's export changes, this is the one file to touch.
//
// Plan coordinates stay the lab's: millimetre-like world px, x right, y DOWN, seconds.
// (Blender maps X = x, Z = -y, Y = out from the wall.)

const rgb = (s) => {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(s);
  if (m) return [m[1] / 255, m[2] / 255, m[3] / 255];
  const h = s.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};

// lab key type -> the pipeline's instrument look (built in blender/scene.py)
// There is no percussion-tube instrument in the videos. If a score still carries tubes, they become
// brass bells: a tube is round in the plane of the run, and so is a bell, so every bounce stays exact.
const LOOK = { tube: "brass", vibe: "vibe", white: "piano", bell: "brass", wood: "wood", key: "painted", felt: "felt" };
const BELL_UP = 12;      // the lab plays its bells an octave above the written note

export function planFromLabScore(score) {
  if (score.format !== "marble-run-score/1") throw new Error(`unknown score format: ${score.format}`);
  const g = score.gravity[1];
  const hitByKey = new Map(score.hits.map((h) => [h.key, h]));
  const keys = score.keys.map((k) => {
    const h = hitByKey.get(k.id);
    if (!LOOK[k.type]) throw new Error(`the lab sent a key type this pipeline has no look for: "${k.type}" (add it to LOOK in lib/adapter.mjs)`);
    return {
      id: k.id, marble: k.marble, look: LOOK[k.type], round: !!k.round,
      midi: k.midi, color: rgb(k.color), length: k.length, width: k.width, depth: k.depth ?? 30,
      center: k.center, angle: k.angle, normal: k.normal, contact: k.contact, standoff: k.standoff ?? 48,
      hitT: h ? h.t : null, hitSpeed: h ? Math.hypot(h.vIn[0], h.vIn[1]) : 0,
    };
  });
  // Every sounding hit. `sound` is the lab's instrument name: marimba | vibraphone | glockenspiel |
  // xylophone | piano. `midi` is the pitch that sounds (the lab's playedMidi).
  const notes = score.hits.filter((h) => h.midi != null && h.sound !== "felt").map((h) => (h.sound === "boomwhacker"
    ? { t: h.t, midi: h.midi + BELL_UP, marble: h.marble, key: h.key, sound: "glockenspiel", loudness: h.loudness, x: h.at[0] }
    : { t: h.t, midi: h.playedMidi ?? h.midi, marble: h.marble, key: h.key, sound: h.sound, loudness: h.loudness, x: h.at[0] }));
  const marbles = score.marbles.map((m) => {
    const first = score.hits.find((h) => h.marble === m.id);
    return {
      id: m.id, radius: m.radius, glass: rgb(m.glass), swirl: m.swirl.map(rgb),
      firstHit: { t: first.t, at: first.at },
      // "fall": free flight from p0 with v0 under gravity.  "rail": centre positions pts at times ts.
      path: m.segments.map((s) => (s.type === "rail"
        ? { type: "rail", t0: s.t0, t1: s.t1, pts: s.pts, ts: s.ts }
        : { type: "fall", t0: s.t0, t1: s.t1, p0: s.p0, v0: s.v0 })),
    };
  });
  const rails = (score.tracks || []).filter((t) => t.type === "rail").map((t) => ({ marble: t.marble, role: "lab", radius: t.radius, pts: t.pts }));
  const lastHit = Math.max(...score.hits.map((h) => h.t));
  return {
    format: "marble-video-plan/2",
    tune: { name: score.tune.name, bpm: score.tune.bpm, beat: score.tune.beat },
    aspect: score.frame.aspect, gravity: g, sink: score.field.sink,
    field: { width: score.field.width, top: score.field.top, bottom: score.field.bottom, bassLaneWidth: score.field.bassLaneWidth },
    firstNote: score.firstNote, lastHit, lastNoteEnds: score.lastNoteEnds,
    sections: (score.sections || []).map((s) => ({ t: s.t, title: /tube/i.test(s.title) ? s.title.replace(/percussion tubes/i, "Brass bells").replace(/tubes/i, "bells") : s.title })),
    layoutFlaws: score.layoutFlaws ?? 0,
    marbles, keys, notes, rails,
  };
}
