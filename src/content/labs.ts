/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LABS: every experiment on labs.rushilchopra.com is listed here.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Add a lab in two steps:
 *
 *  1. Build it, in one of two ways:
 *     - kind "html": any self-contained HTML/JS/CSS (canvas, WebGL, a toy).
 *       Put it in public/lab-files/<slug>/index.html. Relative paths to its
 *       own scripts, images and models work as usual.
 *     - kind "page": a React page. Create src/app/labs/<slug>/page.tsx and
 *       wrap it in <LabShell slug="<slug>"> (copy the pattern in README).
 *
 *  2. Add an entry below. Newest first is not required: the index sorts by date.
 *
 *  `draft: true` hides a lab everywhere (index, its page, the sitemap). To
 *  preview drafts locally, run `LABS_SHOW_DRAFTS=1 npm run dev`.
 */

export type Lab = {
  /** The URL: labs.rushilchopra.com/<slug>. Lowercase, dashes, no dots. */
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** One or two sentences for the index: what it is, why it's fun. */
  summary: string;
  /** A short paragraph or two for the lab's "About" panel: how to play, how it works. */
  about?: string[];
  tags: string[];
  kind: "html" | "page";
  /** Cover image for the index, e.g. "/lab-files/<slug>/cover.jpg" (16:10). */
  cover?: string;
  draft?: boolean;
  /** Optional link to the code. */
  source?: string;
};

export const labsSite = {
  url: "https://labs.rushilchopra.com",
  title: "Labs",
  /** The line under the title on the index. Rewrite it in your own words. */
  lede: "Experiments, toys and half-finished ideas. Everything runs right in your browser.",
  description:
    "Rushil Chopra’s lab: small experiments with code, models and the web, published as they’re made.",
};

/** In the order they were made: a lab's number is its place in this list. */
export const labs: Lab[] = [
  {
    slug: "marble-run",
    title: "Marble run",
    date: "2026-11-10",
    summary:
      "Pick a tune and it builds a marble run that plays it: every bounce lands on a xylophone bar exactly on the note.",
    about: [
      "Like the marble-music videos, but worked out backwards: each note becomes a bar placed where the marble will be at that note’s time, tilted so the bounce carries it to the next one. Bars sit left to right by pitch, so the path draws the melody’s shape.",
      "Write your own plays a little piano (keys A–K): play a tune and it builds a run for it. Space to play or stop.",
    ],
    tags: ["physics", "web audio", "music"],
    kind: "html",
    cover: "/lab-files/marble-run/cover.jpg",
  },
  {
    slug: "heavy-type",
    title: "Heavy Type",
    date: "2026-11-10",
    summary:
      "Point at a letter and it puts on weight, while the rest of the line squeezes to make room. On a phone, tilt it and the weight rolls downhill.",
    about: [
      'Anybody is a variable font, one file that can be any width from squashed to stretched and any weight from light to black. Here every letter is its own element with its own setting, driven by how close it is to your pointer.',
      'The trick is the balancing. Each line is solved so its letters always add up to exactly the screen width, so one letter can only swell if its neighbours give way. The heavy spot rides on a spring, and on a phone it can follow the tilt sensor instead of your finger.',
    ],
    tags: ["variable fonts", "typography", "device orientation"],
    kind: "html",
    cover: "/lab-files/heavy-type/cover.jpg",
  },
  {
    slug: "sand-world",
    title: "Sand world",
    date: "2026-11-10",
    summary:
      "A falling-sand sandbox where eighteen elements burn, melt, grow, dissolve and explode into each other, on a night island that’s already alive when you arrive.",
    about: [
      "Every grain on screen is a cell following a few small rules about what it does to its neighbours. Sand piles, water levels, oil floats, fire climbs wood, lava meets water and leaves stone and steam, and the steam cools back into rain. None of the big moments are scripted: a volcano building a stone shelf into a lake, a meadow flowering after rain, a fuse carrying fire to a crate of TNT all fall out of the same rules.",
      "It opens on an island at night with a waterfall, a simmering crater and a persimmon tree; the next scene is a bonfire wired to a row of firework mortars. Sprinkle seeds and water them, glaze sand into glass with lightning, turn the wind on a burning tree, or stack TNT and stand back. Keys: 1–0 and letters pick elements, space pauses, arrows blow wind.",
    ],
    tags: ["simulation", "sandbox", "physics"],
    kind: "html",
    cover: "/lab-files/sand-world/cover.jpg",
  },
  {
    slug: "say-the-room",
    title: "Say the Room",
    date: "2026-11-11",
    summary:
      "Describe a 1970s living room out loud and it furnishes itself while you’re still mid-sentence. Change your mind (“actually, no plant”) and things vanish just as fast.",
    about: [
      "Press Talk and say what you want: teal walls, a big rainbow, a mustard sofa, a cat, make it night, put a lamp on. Every word goes to Jev, TypeSafe AI’s decision model, which answers 23 small questions about the room in around 150 milliseconds. The room redraws from those answers, so the sofa lands before you finish saying where it goes. A readout in the corner shows the real time from word to screen.",
      "Jev never writes a word. It only decides: which wall colour, is there a dog, how wild is the party, and how sure it is of each. Corrections work because every question asks about your latest intent, so “no wait, lose the disco ball” simply flips an answer. When you like what you’ve said, save the room as a poster or copy a link that rebuilds it.",
    ],
    tags: ["voice", "ai", "illustration"],
    kind: "html",
    cover: "/lab-files/say-the-room/cover.jpg",
  },
  {
    slug: "lights-out-no-script",
    title: "Lights Out, Script Off",
    date: "2026-11-10",
    summary:
      "A complete Lights Out puzzle with five levels and not one byte of JavaScript. The flip rule is done by a blend mode, and winning is a single CSS selector.",
    about: [
      'Every lamp is a label for a hidden checkbox. Ticking a box reveals a plus-shaped patch of yellow over that lamp and its neighbours, painted in the difference blend mode, where yellow on yellow makes black. Two patches cancel, three light up again, which is exactly the rule the game needs.',
      'The rest is plain HTML doing its job: a CSS counter keeps the tally, a form reset button starts over, radio buttons pick the level, and one long selector notices when you have won. View the source; there is nothing else in there.',
    ],
    tags: ["CSS only", "puzzle", "no JavaScript"],
    kind: "html",
    cover: "/lab-files/lights-out-no-script/cover.jpg",
    draft: true,
  },
  {
    slug: "pocket-shaders",
    title: "Pocket Shaders",
    date: "2026-11-10",
    summary:
      "Three moving pictures, a sunset, a lava lamp and a ribbon, each drawn by under 400 bytes of code. The code sits right beside the picture, and editing it changes the picture as you type.",
    about: [
      'Each picture is a fragment shader, a tiny program the graphics chip runs once per pixel, every frame, to answer one question: what colour is this pixel? There are no shapes or images. The sun is “pixels closer than 0.45 to this point”, and the stripes come from rounding a number down.',
      'The box holds the whole program and counts its bytes. Change a number and it recompiles on the spot; break it and the last working picture carries on while the error shows underneath.',
    ],
    tags: ["shaders", "WebGL", "live code"],
    kind: "html",
    cover: "/lab-files/pocket-shaders/cover.jpg",
    draft: true,
  },
  {
    slug: "dont-let-go",
    title: "Don’t let go",
    date: "2026-11-10",
    summary:
      "Hold one big orange button for as long as you can while the page does everything in its power to make you let go. Your mother texts, a cat sits on it, bugs unionise, and the page fakes its own death.",
    about: [
      "A game with one rule and no prize. Press the button and keep it pressed; the timer counts up, and that’s it. Then the page starts trying to get rid of you: a free car that is a drawing of a car, a fire drill for a building that barely exists, a cookie that was never real, a cat nobody can move, and a steady stream of texts from Mom.",
      "There are 27 distractions across about five minutes, shuffled every run. Hold with a mouse, a finger or the space bar, and tap things with a spare finger or a spare key, though some of those buttons are traps. When you finally let go, it tells you exactly what beat you.",
    ],
    tags: ["game", "comedy", "web audio"],
    kind: "html",
    cover: "/lab-files/dont-let-go/cover.jpg",
    draft: true,
  },
  {
    slug: "corduroy",
    title: "Corduroy",
    date: "2026-11-10",
    summary:
      "A tiny programming language where your pen is a ribbon of stripes. Type a few words and 70s supergraphics draw themselves, and play themselves as a tune.",
    about: [
      "A language I made up, small enough to learn in two minutes. Instead of a thin line, your pen is a ribbon of coloured stripes: go rolls it forward, right sweeps it round a curve, spin folds a sharp corner. Add repeat, a few numbers and words you teach it yourself, and a handful of lines turns into rainbows, zigzags, spirals, trees and tiled walls.",
      "The interpreter is written from scratch, with a tokenizer, parser and evaluator, and runs again as you type. Mistakes get a plain-English note and an underline on the exact spot. Press Play to watch the ribbon draw and hear it: every stroke is a note, and the higher it sits on the wall, the higher it sings. Programs live in the link, so you can send one to a friend.",
    ],
    tags: ["language", "generative art", "sound"],
    kind: "html",
    cover: "/lab-files/corduroy/cover.jpg",
    draft: true,
  },
  {
    slug: "craft",
    title: "Craft",
    date: "2026-11-10",
    summary:
      "A combine-anything game where an AI decides what two things make, and every answer is remembered so everyone’s world agrees. Each day there’s one target, scored like golf: fewest combinations wins.",
    about: [
      "You start with earth, fire, water and wind. Drop any two things together and a model on the server decides what they become; that answer is saved forever, so the same pair makes the same thing for everybody. If you’re the first person ever to make something, the game tells you, and the tile keeps a star.",
      "The twist is the daily hole. Everyone gets the same target and a par. Every new combination you try is a stroke, and when you make the target you get a verdict, from hole in one to lost ball, plus a spoiler-free emoji route to share. Free play keeps everything you’ve ever discovered.",
    ],
    tags: ["game", "ai", "daily puzzle"],
    kind: "html",
    cover: "/lab-files/craft/cover.jpg",
    draft: true,
  },
  {
    slug: "supergraphic",
    title: "Supergraphic",
    date: "2026-11-10",
    summary:
      "Paint 1970s stairwell stripes. Drag anywhere and the bands turn their corners for you, concentric and clean.",
    about: [
      "Drag to paint. The stripe follows one direction at a time; move across it and it turns a rounded corner where you turned. Shuffle paints a new wall, and the colourways repaint everything at once.",
      "Each band is the same centre line offset to the left or right of travel, so the corners stay concentric whatever the width. Keys: 1–5 for colourways, S to shuffle, ⌘Z to undo.",
    ],
    tags: ["canvas", "generative", "draw"],
    kind: "html",
    cover: "/lab-files/supergraphic/cover.jpg",
    draft: true,
  },
  {
    slug: "learning-to-paint",
    title: "Learning to paint",
    date: "2026-11-10",
    summary:
      "A tiny neural network learns a picture in front of you. Draw on it, give it a photo, and break it with the knobs.",
    about: [
      "A neural network written from scratch, training in your browser: it maps a position (x, y) to a colour, and learns by guessing 256 random pixels at a time and correcting itself.",
      "Turn Fourier features off to see why plain networks paint blurry pictures. Push the wave frequency up to watch it overfit into static. Zoom out to see what it imagines past the edges it never saw.",
    ],
    tags: ["neural nets", "ml", "from scratch"],
    kind: "html",
    cover: "/lab-files/learning-to-paint/cover.jpg",
    draft: true,
  },
  {
    slug: "plink",
    title: "Plink",
    date: "2026-11-10",
    summary:
      "Draw lines, drop balls, make music. Every bounce plays a note, and short lines sing higher than long ones.",
    about: [
      "Drag to draw a line. Balls drop from the orange droppers on the beat, and every bounce rings the line like a marimba bar, tuned by its length. Drag a dropper to move it.",
      "Turn the sound on, then try the scales. Keys: space to pause, D to draw, E to erase.",
    ],
    tags: ["physics", "web audio", "toy"],
    kind: "html",
    cover: "/lab-files/plink/cover.jpg",
    draft: true,
  },
];
