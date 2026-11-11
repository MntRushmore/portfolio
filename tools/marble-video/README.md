# Marble video

Renders a marble-music video in Blender, ready to post on Instagram Reels, TikTok or YouTube Shorts.
It is a production tool that lives beside the website; nothing in the Next app imports it.

```
npm run marble:video -- --tune canon --aspect 9:16 --fps 60 --title
npm run marble:video -- --tune canon --preview            # quick look: 540x960, 30 fps, few samples
npm run marble:video -- --list                            # tunes and instrument voices
```

The MP4 lands in `tools/marble-video/output/` (git-ignored) next to a small `.json` with the numbers
of that render (frame count, render time, loudness, ffprobe).

## What it needs

- The dev server (`npm run dev`), so the lab page is at `http://labs.localhost:3123/lab-files/marble-run/index.html`.
  If the lab cannot be reached, the last saved score for that tune and aspect (`output/scores/`) is used.
- Blender 5.x at `/Applications/Blender.app` (or `BLENDER_BIN`), Google Chrome (or `CHROME_BIN`),
  `ffmpeg`, and `fluidsynth` (`brew install fluid-synth`).
- `assets/FluidR3_GM.sf2` and `assets/Anybody-ExtraBold.ttf`; both are downloaded on first run if missing.
  Sources and licences: `assets/README.md`.

## Flags

| flag | meaning | default |
| --- | --- | --- |
| `--tune <name or index>` | Ode to Joy, Twinkle, Frère Jacques, Für Elise, Mountain King, Canon in D, The Entertainer | `canon` |
| `--aspect 9:16` or `16:9` | 1080x1920 or 1920x1080 | `9:16` |
| `--fps <n>` | frame rate | `60` |
| `--title` | the lab's section titles at the top ("1. Vibraphone", ...), tune name over the first, end credit at the close | off |
| `--credit <text>` | end credit text | `labs.rushilchopra.com` |
| `--preview` | half resolution, half frame rate, 6 samples | off |
| `--speed <0.5..1.6>` | tempo multiplier (the lab re-solves the layout) | `1` |
| `--samples <n>` | EEVEE samples per frame | `20` (preview `6`) |
| `--jobs <n>` | Blender processes rendering chunks side by side | `2` |
| `--engine cycles` | path-traced "hero" mode: far slower, real refraction and caustics in the glass | `eevee` |
| `--score <file>` | use a saved lab score instead of asking the lab | |
| `--lab <url>` | where the lab page is served | the dev server |
| `--keep-frames` | keep the PNG sequence in `output/.work/` | off |

## How it works

1. **Score** (`lib/score.mjs`). Headless Chrome (always `--mute-audio`) loads the lab and calls
   `window.marbleRun.score(tune, { aspect, speed })` over the DevTools protocol. The lab solves the
   whole run: every key, every hit time, each marble's free-fall arcs. For a tune the lab does not
   ship (`lib/tunes.mjs`), the page is given one extra method as it loads, so the lab's own solver
   lays that tune out too; nothing on disk changes.
2. **Plan** (`lib/adapter.mjs`, `lib/rails.mjs`, `lib/themes.mjs`, joined in `lib/build-plan.mjs`). `adapter.mjs` is the only file that
   knows the lab's score format; if the export changes, that is the one file to edit. The lab's own wire rails
   (long waits between keys) arrive in the score and are built as they are. `rails.mjs` adds an entry and an
   exit: each marble rolls in on a rail and leaves its lip on an arc that lands on the
   first key at exactly the lab's first hit time, and after its last key it is caught by a rail and
   rolls away. No hit time moves. `themes.mjs` picks the sampled voice for each of the lab's sounds.
3. **Audio** (`lib/audio.mjs`). The hits become a MIDI file (velocity from impact speed, pan from the
   key's position), FluidSynth plays it through the SoundFont's recorded instruments with a small
   room, voices that no free sample set covers are made in code and mixed in sample-accurately, and the mix is mastered to -14 LUFS integrated with true peak under -1 dBTP at 48 kHz.
4. **Picture** (`blender/scene.py`). Everything is built in Python: tiled wall, keys by instrument,
   steel pins, wire rails, glass marbles with a swirl, a raking warm sun with soft shadows and cool
   fill, a perspective camera that glides down the wall with the run, depth of field, motion blur,
   and a small dip and ring of each key as it is struck. Marble keyframes are placed on every
   frame and exactly at every bounce, so the marble touches the key on the note. Frames render as
   animation jobs (the scene and shaders load once per job), not one Blender start per frame.
5. **Encode** (`make.mjs`). H.264 High, CRF 16, yuv420p, BT.709, AAC 320 kb/s at 48 kHz, `+faststart`.
   Titles are rendered to transparent PNGs by `blender/title.py` and laid over by ffmpeg. The frame
   sequence is deleted afterwards unless `--keep-frames` is given.

## Instruments

Every instrument sounds like what it looks like. The lab decides which instrument plays each section
of a tune; the pipeline gives each one a look and a voice.

| lab key / sound | look in Blender | voice |
| --- | --- | --- |
| `wood` / marimba | rosewood bars | Marimba, FluidR3_GM program 12 |
| `vibe` / vibraphone | grey brushed-metal bars | Vibraphone, program 11 |
| `bell` / glockenspiel | small brass bells (short cylinders, end-on) | Glockenspiel, program 9 (the lab plays these an octave up) |
| `white` / piano | white keys | Acoustic Grand Piano, program 0 |
| `key` / xylophone | painted keys | Xylophone, program 13 |
| `felt` | cream felt pad | silent |

There is no percussion-tube instrument. If a score still carries tubes, `lib/adapter.mjs` turns them
into brass bells (both are round in the plane of the run, so every bounce stays exact).

## Checking a render

```
~/tools/earshot/.venv/bin/python -m earshot measure output/<name>.mp4 --music
~/tools/earshot/.venv/bin/python -m earshot realness output/<name>.mp4
~/tools/earshot/.venv/bin/python -m earshot timeline output/<name>.mp4 --cues output/<name>.cues.json
```

`<name>.cues.json` lists every instant a marble lands on a key, so `timeline` reports how far each
sound is from its picture (sync) and any stretch with no sound (dropouts).
