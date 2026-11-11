# Instrument samples

Five instruments, one MP3 each. Every file is a sheet of single notes three semitones apart, each note in its own fixed slot, mono, 44.1 kHz, LAME VBR quality 5. The page plays the nearest note and repitches it (at most a semitone and a half either way).

| file | instrument | GM program | notes (MIDI) | slot | size |
| --- | --- | --- | --- | --- | --- |
| `marimba.mp3` | marimba (wooden bars, the bass marble) | 13 Marimba | 36 to 84, every 3 | 2.0 s | 149 KB |
| `vibraphone.mp3` | vibraphone (grey metal bars) | 12 Vibraphone | 53 to 89, every 3 | 4.0 s | 232 KB |
| `glockenspiel.mp3` | glockenspiel (small brass bells, played an octave up) | 10 Glockenspiel | 60 to 96, every 3 | 3.0 s | 206 KB |
| `piano.mp3` | acoustic grand (white keys) | 1 Acoustic Grand Piano | 45 to 90, every 3 | 4.0 s | 333 KB |

| `tubes.mp3` | percussion tubes (boomwhackers), **unused** | a real recording, see below | five hits: C4, D4, F♯4, A4, D5 | 0.6 s | 36 KB |

Total: about 0.96 MB. Each file loads only when a tune uses that instrument.

The first note starts 0.25 s into the file and note `i` starts at `0.25 + i × slot` seconds. MP3 decoders add a short delay, so the page finds each note's real onset after decoding rather than trusting those times.

## Source and licence

### SoundFont instruments

Marimba, vibraphone, glockenspiel and piano are rendered from **FluidR3_GM.sf2** (Fluid Release 3 General MIDI SoundFont, by Frank Wen and contributors), which is released under the **MIT licence**. The same SoundFont is used by the video pipeline in `tools/marble-video/`, so the web lab and the rendered videos share one sound.

```
Copyright (c) 2000-2002, 2008 Frank Wen

Permission is hereby granted, free of charge, to any person obtaining a copy of this soundfont and associated documentation files (the "SoundFont"), to deal in the SoundFont without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the SoundFont, and to permit persons to whom the SoundFont is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the SoundFont.

THE SOUNDFONT IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOUNDFONT OR THE USE OR OTHER DEALINGS IN THE SOUNDFONT.
```

### Percussion tubes (unused)

**Not used at present.** The percussion-tube instrument has been removed from the lab, so `tubes.mp3` is never loaded. The file and its details are kept here in case it returns.

`tubes.mp3` is cut from a real recording of boomwhackers:

- **Sound:** "Boomwhacker.wav"
- **Author:** mayonaka123
- **URL:** https://freesound.org/people/mayonaka123/sounds/410443/
- **Licence:** Creative Commons 0 (public domain dedication), https://creativecommons.org/publicdomain/zero/1.0/

Five single hits were taken from the unaccompanied opening of that recording (at 11.86 s, 9.38 s, 8.34 s, 10.43 s and 12.51 s), each trimmed to start 4 ms before its attack, faded out over its last 50 ms, and normalised to the same peak. Their measured pitches are MIDI 60.21, 62.16, 66.02, 69.15 and 73.99; the page repitches from those exact values, so the tubes play in tune. Notes far above D5 are stretched a long way from the nearest hit and sound thinner.

## How the SoundFont instruments were made

For each instrument: a MIDI file with one note per slot (velocity 100, held for most of the slot) was rendered with FluidSynth, reverb and chorus off:

```
fluidsynth -ni -g 0.7 -R 0 -C 0 -r 44100 -F marimba.raw.wav FluidR3_GM.sf2 marimba.mid
```

The render was mixed to mono, normalised so the loudest note peaks at 0.71 of full scale, given a 60 ms fade at the end of every slot, and encoded with `ffmpeg -c:a libmp3lame -q:a 5 -ac 1`.

## Not sampled

- If `tubes.mp3` fails to load, the tubes fall back to a synthesised stand-in (`bonk` in `index.html`): a burst of noise through narrow resonators at the note and its overtones.
- **Felt pads** and the cup landings are a synthesised thud.
- If a sample file fails to load, the page falls back to its built-in synthesised mallet for that instrument.
