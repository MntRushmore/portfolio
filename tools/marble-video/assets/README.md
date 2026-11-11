# Assets for the marble video pipeline

Large files here are git-ignored (see `.gitignore`); `npm run marble:video` re-downloads anything missing.

## Instrument samples: FluidR3_GM.sf2

| | |
| --- | --- |
| Name | Fluid (R3) General MIDI SoundFont, `FluidR3_GM.sf2` (148 MB, SoundFont 2) |
| Author | Frank Wen and contributors |
| Licence | MIT. The file's own INFO chunk says: "Licensed under the MIT License.", copyright "Frank Wen 2000-2002, 2008; Toby Smithe 2008" (the licence text also ships with the Debian/Ubuntu package `fluid-soundfont-gm`, file `COPYING`; the same statement is in the upstream README) |
| Download | https://github.com/pianobooster/fluid-soundfont/releases/download/v3.1/FluidR3_GM.sf2 |
| Mirror | https://keymusician01.s3.amazonaws.com/FluidR3_GM.zip (zip of the same file) |
| SHA-256 | `74594e8f4250680adf590507a306655a299935343583256f3b722c48a1bc1cb0` |
| Player | FluidSynth 2.x (`brew install fluid-synth`, LGPL-2.1, only used as a tool) |

### Program mapping (General MIDI, bank 0, program numbers are 0-based)

| Lab sound (`hits[].sound`) | Look | GM program (0-based / 1-based) | GM name | Note length |
| --- | --- | --- | --- | --- |
| `marimba` | rosewood bars (bass) | 12 / 13 | Marimba | 1.4 s |
| `vibraphone` | grey metal bars | 11 / 12 | Vibraphone | 2.6 s |
| `glockenspiel` | small brass bells (short cylinders) | 9 / 10 | Glockenspiel | 2.2 s |
| `xylophone` | painted keys | 13 / 14 | Xylophone | 0.9 s |
| `piano` | white keys | 0 / 1 | Acoustic Grand Piano | 1.3 s |

Also in the SoundFont and unused so far: Tubular Bells 14 / 15, Celesta 8 / 9, Music Box 10 / 11.

The pitch played is the lab's `playedMidi`. Per note: MIDI velocity = 40 + 80 x loudness (loudness
0.5..1 comes from impact speed), pan from the key's x position across the field (five fixed pan
positions per instrument, each on its own MIDI channel, so a ringing note never jumps when the next
one is panned elsewhere). FluidSynth settings: 48 kHz, gain 0.7, reverb on (room 0.52, damp 0.35,
width 0.9, level 0.42), chorus off. The mapping lives in `../lib/themes.mjs`, the MIDI writer and
the mastering chain in `../lib/audio.mjs`.

## Percussion tubes: not used

The videos have no tube instrument (the user did not like the sound, and the web lab dropped it
too). Nothing tube-related is stored here. If an old score still has tubes, `lib/adapter.mjs` plays
them as brass bells on the Glockenspiel program.

## Font: Anybody ExtraBold

`Anybody-ExtraBold.ttf`, by Tyler Finck (Etcetera Type Co), SIL Open Font License 1.1, from Google
Fonts: https://fonts.google.com/specimen/Anybody (file URL is resolved from
`https://fonts.googleapis.com/css2?family=Anybody:wght@800`). Used for the section title and end credit.
