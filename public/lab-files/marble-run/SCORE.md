# Marble run score format (`marble-run-score/1`)

The lab can hand its whole run over as plain JSON, so another renderer can rebuild it exactly.

```js
// in the page (index.html), any time after load
const score = window.marbleRun.score(tune, { aspect, speed, bass });
```

| argument | values | default |
| --- | --- | --- |
| `tune` | index into the built-in tunes (`window.marbleRun.names()` lists them in order) or the name, case-insensitive | the tune currently loaded |
| `aspect` | `"9:16"` (1080×1920) or `"16:9"` (1920×1080) | `"9:16"` |
| `speed` | tempo multiplier, 0.5 to 1.6 | `1` |
| `bass` | `true` / `false`: include the second (bass) marble | the page's current setting (on) |

The call is pure: it does not change what the page is showing or playing. The layout is deterministic for a given tune, aspect, speed and bass setting. It depends on the aspect, because the field is narrower in 9:16.

## Coordinates and units

- 2D, in the plane the marbles move in (a vertical wall seen face on).
- **x to the right, y down.** Origin is the top-left corner of the field: `x = 0` is the field's left edge, `y = 0` is a little above the first chute.
- Lengths are in world pixels (`px`). One world pixel is `frame.pxPerUnit` output pixels. A melody marble has radius 12, a key is roughly 60 to 90 long: if you want real-world scale, treating 1 px as 1 mm gives a plausible 24 mm marble.
- Time in seconds. `t = 0` is the moment the first chute gate opens. The first note sounds at `firstNote` (0.55 s). Times can be negative (the camera path starts at `-camera.lead`).
- Angles in radians, measured from +x toward +y (so clockwise as seen on screen, because y is down).
- Velocities in px/s, gravity in px/s². Gravity is constant: `gravity = [0, 2000]`.
- For a z-up 3D scene: `X = x`, `Z = -y`, and `Y` is distance out from the wall. The 2D plane is the plane of the marble centres.

## Top level

```jsonc
{
  "format": "marble-run-score/1",
  "units": { "length": "px", "time": "s", "angle": "rad", "velocity": "px/s", "gravity": "px/s^2" },
  "tune": { "name": "Für Elise", "bpm": 272, "speed": 1, "beat": 0.221 },  // beat = seconds per beat at this speed
  "duration": 11.9,        // when the page considers the run over (last marble in its cup + 1 s)
  "firstNote": 0.55,
  "lastNoteEnds": 10.9,    // when the last note has had its length
  "gravity": [0, 2000],
  "field": { "width": 560, "top": 22, "bottom": 4054.5, "bassLaneWidth": 179.2, "sink": 340 },
  "frame": { "aspect": "9:16", "width": 1080, "height": 1920, "pxPerUnit": 1.929, "fieldLeft": 0 },
  "layoutFlaws": 0,
  "sections": [{ "t": 0.55, "title": "1. Marimba" }, ...],   // which instruments play from when; shown as a small title
  "marbles": [...], "keys": [...], "hits": [...], "extraSounds": [...], "tracks": [...],
  "fixtures": { "chutes": [...], "cups": [...] },
  "camera": {...}
}
```

- `field.width`: the run occupies `0 ≤ x ≤ width`. `top` / `bottom`: the y extent of everything (first chute to last cup, with margin).
- `field.bassLaneWidth`: the bass marble and its keys stay in `0 ≤ x ≤ bassLaneWidth`; the melody stays to the right of it. `0` when there is no bass marble.
- `field.sink`: the run descends at this steady rate (px/s). Every hit at time `t` has its marble centre at `y = hit0.y + sink × (t − firstNote)`.
- `layoutFlaws`: how many places the layout search could not fully clear (a marble passing within 2.5 px of a key it does not hit, or two keys closer than 6 px). `0` for every built-in tune at speed 1 in both aspects; can be non-zero at extreme speeds.
- `frame.fieldLeft`: output pixels of wall to the left of the field (non-zero in 16:9, where the field is centred with wall either side).

## `marbles[]`

```jsonc
{
  "id": "melody",                    // "melody" or "bass"
  "radius": 12,
  "glass": "rgb(255,226,200)",       // tint of the glass
  "swirl": ["#f2662a", "#c21f4e"],   // the two colours of the twist inside
  "release": { "t": 0, "at": [429, 118] },      // sits here, at rest, until t
  "segments": [
    { "type": "fall", "t0": 0, "t1": 0.55, "p0": [429, 118], "v0": [0, 0], "fromKey": null },
    { "type": "fall", "t0": 0.55, "t1": 0.771, "p0": [429, 420.5], "v0": [312.8, 119.412], "fromKey": "melody-0" },
    { "type": "rail", "t0": 3.2, "t1": 3.9, "track": "rail-0", "pts": [[x, y], ...], "ts": [3.2, ...], "fromKey": "melody-7" },
    { "type": "fall", "t0": 3.9, "t1": 4.2, "p0": [..], "v0": [..], "fromKey": null },
    ...
  ],
  "rest": { "t": 11.5, "at": [300, 3900] }      // from t on, sitting in its cup
}
```

Positions are the marble's **centre**. There are two kinds of segment.

A `"rail"` segment is the marble rolling along a wire rail: `pts` is a polyline of marble-centre positions and `ts` the time it reaches each point (same length, strictly increasing, `ts[0] = t0`, last `= t1`). Interpolate linearly between points. It is always followed by a `"fall"` segment from the rail's lip to the next key.

A `"fall"` segment is free fall; evaluate it at any `t0 ≤ t ≤ t1`:

```
p(t) = p0 + v0·(t − t0) + ½·gravity·(t − t0)²
v(t) = v0 + gravity·(t − t0)
```

The segments are continuous in position and meet at the hits: segment `i` ends exactly at segment `i+1`'s `p0`. Before `release.t` the marble is at `release.at`. After `rest.t` it is at `rest.at` (the page adds a small settling bounce: `y − |sin(15s)|·8·e^(−6s)` with `s = t − rest.t`). The page also rolls the marble visually by `x / (1.5·radius) + 1.6·t` radians; that is decoration.

## `keys[]`

One key per hit (keys are not reused), in play order per marble.

```jsonc
{
  "id": "melody-0", "marble": "melody",
  "type": "wood",            // "tube"  coloured plastic percussion tube, end-on to the wall (round); not used by any tune at present
                             // "bell"  small brass bell, a short cylinder end-on to the wall (round)
                             // "wood"  wooden marimba bar        "white"  white piano-like key
                             // "vibe"  grey brushed-metal vibraphone bar
                             // "felt"  silent pad on a long wait
  "round": true,             // true for tube and bell: in the plane of the run the key is a circle of diameter `length` (= `width`)
  "midi": 76, "note": "E",   // null for felt
  "color": "#f3b62c",        // the note's paint: one colour per pitch class
  "face": "#f3b62c",         // the body colour in the 2D drawing: paint for tubes, wood, off-white, grey or brass otherwise
  "length": 58.08,           // along `angle`
  "width": 19.2,             // across, i.e. along `normal`; the struck face is the long edge on the +normal side
  "depth": 30,               // suggested extent out from the wall (not used in 2D)
  "center": [411.21, 432.751],
  "angle": 0.968,            // direction of the long axis
  "normal": [0.824, -0.567], // unit vector from the key toward the marble at the hit
  "contact": [419.117, 427.306],        // the point on the struck face the marble touches
  "mount": [411.21, 432.751],           // where a rod straight back to the wall would land (= center)
  "mountDrawnAt": [384.21, 453.751],    // where the 2D page draws the wall mount (its fake perspective offset)
  "standoff": 48             // suggested gap between wall and the back of the key
}
```

Geometry facts you can rely on:

- The key is a rectangle `length × width` centred on `center`, rotated by `angle`. Its struck face is at `center + normal·width/2`.
- `contact` lies on that face; the marble centre at the hit is `contact + normal·radius` (= the hit's `at`). The contact is usually at the middle of the key but can be up to 35% of the length off-centre.
- `normal` bisects the marble's incoming and outgoing directions (`normalize(v̂out − v̂in)`), so the bounce reads as a mirror reflection.
- Round keys (`tube`, `bell`) are cylinders whose axis points out of the wall: their footprint in the plane is the circle of radius `width / 2` centred on `center`, and `angle` is irrelevant. In the page's 3D view a tube is 88 to 150 long (longer for lower notes) starting 14 off the wall, a bell is 50 long centred on the marble plane, bars are 48 deep (white keys 54, felt 34), and the marble plane is 74 off the wall.
- In the 3D view a struck key glows briefly in its `color`.

## `hits[]`

Sorted by time, all marbles together.

```jsonc
{
  "t": 0.55, "marble": "melody", "key": "melody-0",
  "midi": 76,                    // null for felt
  "sound": "glockenspiel",       // "boomwhacker" (tube) | "marimba" (wood) | "piano" (white) | "vibraphone" (vibe) | "glockenspiel" (bell) | "felt"
  "playedMidi": 88,              // the pitch actually sounded: bells play an octave above `midi`
  "loudness": 0.923,             // 0..1, what the synth is given (from impact speed)
  "at": [429, 420.5],            // marble centre at the hit
  "vIn": [0, 1100], "vOut": [312.8, 119.412]
}
```

Pitch in Hz is `440 × 2^((playedMidi − 69) / 12)`.

`extraSounds[]` are the soft thuds when each marble lands in its cup: `{ "t", "marble", "sound": "felt", "loudness" }`.

## `tracks[]`

Wire rails. Where a marble has a long wait between two keys (0.8 s or more for the melody), it leaves the first key along a rail, rolls down it and flies off the lip onto the next key.

```jsonc
{
  "id": "rail-0", "type": "rail", "marble": "melody",
  "fromKey": "melody-7", "toKey": "melody-8",
  "t0": 3.2, "t1": 3.9,          // on the rail from t0 (the hit on fromKey) to t1 (leaving the lip)
  "radius": 14,                  // the marble's radius
  "kappa": 1650.2,               // see below
  "pts": [[x, y], ...],          // 37 points: the marble's centre along the rail
  "ts": [3.2, ...]               // when the centre reaches each point
}
```

- `pts[0]` is the marble's centre at the hit on `fromKey`; the last point is where it leaves the rail. The same `pts` / `ts` appear in the marble's `"rail"` segment, and the `"fall"` segment after it starts at the last point with the rail's exit velocity (12° below level).
- The rail itself sits under the path: in the page, two wires 1.2 × radius apart (0.6 × radius either side of the marble plane), their centres `0.8 × radius + 1.4` from the path on the side gravity presses toward, with a tie between them every other point and a post to the wall every fifth. The page starts drawing the wires 1.5 radii after `pts[0]`, clear of the key.
- Speed along the rail follows `v² = v_exit² − kappa × (y_exit − y)`: the marble speeds up as it descends. A ball rolling without slipping would have `kappa = (10/7) × gravity ≈ 2857`; the solver picks the shape whose required `kappa` is closest to 60% of that and uses whatever value makes the arrival time exact, so treat it as "rolling with some loss". No rail goes uphill, and none bends tighter than a 34 px radius.
- Rails stay inside their marble's lane and are included in the layout's collision checks.

## `fixtures`

```jsonc
"chutes": [{ "marble": "melody", "at": [429, 118],      // marble centre while it waits
             "innerHalfWidth": 17, "tubeTop": 62, "tubeBottom": 134, "funnelTop": 42,
             "gateOpens": 0 }],
"cups":   [{ "marble": "melody", "at": [300, 3900],     // marble centre at rest
             "innerHalfWidth": 18, "rim": 3875, "floor": 3915, "t": 11.5 }]
```

A chute is a vertical tube centred on `at.x` from `tubeTop` to `tubeBottom` (y values), with a funnel flaring above it up to `funnelTop`, and a gate under the marble that slides away at `gateOpens`. A cup is a U centred on `at.x`, open at the top, from `rim` down to `floor`; the marble drops in at `t`.

## `camera`

```jsonc
"camera": {
  "projection": "orthographic",
  "lead": 0.7,
  "columns": ["t", "centerX", "centerY", "viewHeight", "roll"],
  "samples": [[-0.7, 280, 497.778, 995.556, -0.00446], ...]   // 30 per second, from t = −lead to duration
}
```

Each sample is the page's camera for this aspect: the world point at the centre of the frame, the height of the visible area in world px (the width is `viewHeight × frame.width / frame.height`), and a roll in radians (positive = scene turns clockwise on screen). Interpolate linearly between samples.

How it is made, if you would rather regenerate it: the top of the view eases toward `max(0, y_line(t) − 0.6 × viewHeight)` with `y_line(t) = hit0.y + sink × (clamp(t, 0, lastCupTime) − firstNote)`, as `top += (target − top) × (1 − e^(−5·dt))` at 60 steps a second, starting from 0. So the hit line sits 60% of the way down the frame and the marbles arc up into the space above it. `viewHeight` shrinks by about 1% for a moment after each hit (a small push-in), and `roll = 0.013 × sin(0.5 t)`. A perspective camera is free to do better; the samples are a guide to framing and pace.

## Timeline for a video

The page's own export uses: video starts at `t = −lead` (1.9 s when there is a title card, else 0.7 s), follows the run until the last cup time + 0.9 s, then shows a 3.2 s closing card. Audio events are `hits[]` plus `extraSounds[]`.
