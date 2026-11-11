# Rushil Chopra — portfolio direction

## Brief (partly self-authored)

The user gave the brief below. The parts marked *self-authored* were decided by
the designer because the user asked for an end-to-end build without a check-in.

- **What:** a one-page personal portfolio site for Rushil Chopra.
- **Who visits:** people deciding whether to work with, hire, or collaborate
  with Rushil. *(self-authored: nothing is known about Rushil's field, so the
  site must not assume one.)*
- **The one job:** in ten seconds, know who this is and what they make, then
  open the work or get in touch.
- **Feel (user's words):** editorial, playful, technically polished.
- **References outside the web** *(self-authored)*: a two-colour risograph
  zine, a 1970s painted stairwell supergraphic, a deck of collectible cards.
- **Web reference:** neesh.page (studied, not copied).
- **What exists:** the name. No photos, no logo, no copy, no projects, no
  URLs. All personal content lives in `src/content/site.ts` as obvious
  placeholders.
- **Image generation:** not used *(self-authored: paid credits not authorised)*.
- **Stack:** empty repo → Next.js (App Router), TypeScript, Tailwind CSS v4,
  Framer Motion.

## What the reference does (neesh.page)

Studied at 390 and 1440 (`shots/reference/`).

- **Distinctive:** 70s supergraphic hero (flat cream and teal "road" shapes in
  a chunky dark frame), heavy Bowlby One display, a different coloured ground
  per section (cream, slate, orange), a checkerboard divider, orange grid
  paper behind the works, outlined/filled stacked type ("THE / CRAFT /
  GALLERY"), work shown as autoplaying videos with VCR-style controls in
  horizontal carousels, offset text shadows. Personality: a toy, confident,
  handmade.
- **Weak:** the whole page scrolls inside a fixed `div` (breaks native scroll,
  find-in-page, keyboard paging); 8 contrast failures (teal on cream at
  2.3–2.9:1); 51 icon-only buttons with no accessible name; 35 tap targets at
  10×10px; no action on the first screen; dozens of autoplaying videos;
  three near-identical section headings.
- **Take forward:** colour-blocked sections with meaning, one big flat graphic
  idea, chunky confident display type, a sense of play.
- **Leave behind:** the scroll container, carousels as the main way to see
  work, contrast and target failures, the teal/cream/orange palette, the
  Bowlby face.

## The category default being refused

The 2026 personal developer/design portfolio is one of two pages:

1. **Dark dev portfolio:** `#0a0a0a`, Inter or Geist, "Hi, I'm X 👋", gradient
   name, a terminal intro, a 3-column grid of screenshot cards with tech
   pills, a skills cloud of logo icons, a vertical experience timeline, a
   cursor follower. (Slop faces 2 and 4.)
2. **The considered studio portfolio:** warm paper, a giant serif name, mono
   numbered eyebrows ("01 — Work"), local time and coordinates in the header,
   hairlines everywhere, one rust accent, no images. (Slop face 1 and the
   overcorrection.)

Category colour clichés: black + violet/cyan; paper + rust. Both refused.
Also refused: a skills tag cloud, skill-percentage bars, logo walls.

## Exploration (Step 2)

Imagery honestly available: none from the user, no generation. So the richness
must be drawn in code: shape, colour, type.

| | Concept | Ground | Type | Richness | Accent | Grammar | Motion |
|---|---|---|---|---|---|---|---|
| A | "Rushil's site is a two-colour risograph zine." (printed matter) | light, cool stock | Bricolage Grotesque, condensed | halftone sphere (illustration) | fluoro pink + federal blue | index | dot-matrix halftone, light follows pointer |
| B | "Rushil's site is a stairwell painted with a 1970s supergraphic." (place) | persimmon colour field | Anybody, expanded 900 | a three-band stripe (shape) | orange | scroll-story | self-drawing line art |
| C | "Rushil's site is a deck of collectible cards." (play) | dark baize | Gloock serif | 3D cards (object) | gilt yellow | catalogue | 3D tilt cards |

Shots: `shots/explore-a|b|c/`, phones side by side in `shots/explore-phones.png`.

**Winner: B.** It is the most memorable on both phone and desktop, it keeps the
reference's spirit (one confident flat graphic, colour-blocked grounds) while
being plainly its own (expanded type, parallel bands instead of blobs, a
different palette), and a stripe that runs *through* the page gives the
one-page site a route.

- **A lost** because overprinting the blue plate on the pink made the name a
  muddy purple and the halftone sphere fought the name for attention; also the
  scan failed it on contrast over the dots.
- **C lost** because it reads as a luxury template (dark ground, display
  serif, a fan of cards); least playful, and cards with placeholder titles
  look emptier than any other device.
- **Merged in:** from A, the back-of-the-zine *index* (the toolkit is an index
  that points into the projects); from C, each project gets its own drawn
  cover so placeholder projects still look like objects.

History: `site|place|colour-field|expanded|orange|shape|scroll-story` (clear).

## Concept

**Rushil's site is a stairwell painted with a 1970s supergraphic.** Think Sea
Ranch, a 1972 municipal pool, a parking-garage ramp: one three-band stripe
painted straight onto the wall that turns rounded corners at every landing.
The page is the stairwell; each section is a landing; the stripe switchbacks
down the page, alternating sides, and paints itself in as you descend.

## Tokens

### Colour (light only, by decision)

| Token | Value | Source / job |
|---|---|---|
| `--persimmon` | `#F2662A` | the painted wall: hero and contact grounds, project cover fields, third band on cream |
| `--umber` | `#241006` | burnt-umber paint: all text on persimmon and cream, the outer band, footer ground |
| `--brick` | `#B32317` | the middle band; hover/active state for links on cream (5.5:1 on cream) |
| `--plaster` | `#FBE6CC` | the plaster between stripes: About, Work, Toolkit grounds; third band on persimmon |
| `--plaster-2` | `#F4D5B1` | hairlines and pressed states on plaster |
| `--ink-2` | `#5A3A26` | secondary text on plaster (8.3:1) |

Measured: umber on persimmon 5.8:1, umber on plaster 15:1, brick on plaster
5.5:1, persimmon on umber 5.8:1. **Never** plaster text on persimmon (2.6:1) or
persimmon text on plaster (2.6:1).

Accent: there is no separate accent hue. The **persimmon field is the
accent**: it marks the two places you act (the hero's actions, the contact
section). Brick is state (hover, current).

**Dark mode: declined on purpose.** The site *is* its painted colours; an
umber night version would be a different building. `color-scheme: light`.

Focus: a two-colour ring like the stripe itself: `outline: 3px solid umber`
plus a `0 0 0 6px plaster` halo, so it reads on persimmon, plaster and umber.

### Type

- **Anybody** (variable, wdth 50–150, wght 100–900) for display, because its
  expanded black cuts are the lettering a sign painter would put on that
  stairwell wall, and its width axis lets type stretch on interaction.
- **Hanken Grotesk** for text, because it is a warm geometric grotesque that
  stays quiet next to Anybody and reads well at 17–21px.

Scale: display `clamp(3.25rem, 0.6rem + 12.2vw, 13.5rem)` (wdth 150, wght
900, −0.035em) · h2 `clamp(2.6rem, 1.4rem + 4.6vw, 6rem)` (wdth 150, 900) ·
h3 `clamp(1.6rem, 1.15rem + 1.5vw, 2.4rem)` (wdth 125, 850) · lead
`clamp(1.25rem, 1.05rem + 0.8vw, 1.75rem)` · body 19px · small 15px · meta
13px (Anybody wdth 110, 700, uppercase +0.06em, used once per section at most).

### Space, radius, grid

Space: 4, 8, 12, 16, 24, 40, 64, 104, 168. Sections 168 apart on desktop, 104
on phones. Max width 1440, side padding `clamp(16px, 4vw, 56px)`.
Radius family: stripe corners (the bands) are the only big radii; buttons are
pills (the stripe's end caps); covers 4px; nothing else rounded.
The stripe: three 18px bands with 8px gaps (desktop), 10px/5px (phone).

## Grammar (scroll-story, five landings)

Order as built: Hero → Work → About → Toolkit → Contact (work moved ahead of
About so the evidence comes first). From 1024px every section sits on one
12-column page grid; the rail lives in column 12 or 1 and content uses an
11-column subgrid "lane" beside it.

1. **Hero (persimmon):** who is this and what do they make? Name, one line,
   "See the work", "Say hello", and a floor directory of the projects hung
   inside the stripe's U (above the run on narrow screens).
2. **About (plaster):** who are they, really? Two short paragraphs, three
   facts, a portrait frame.
3. **Work (plaster):** what have they made? Three projects, each with a drawn
   cover, summary, role, year, tools, links.
4. **Toolkit (plaster):** what do they work with and care about? An index of
   tools that points into the projects, plus interests.
5. **Contact (persimmon):** how do I reach them? A big email, copy button,
   socials. Then a one-line umber footer.

## Signature

**The stripe walks you down the stairwell.**
- Trigger: load (hero) and scroll (everything after).
- Frames: 0 ms, the hero wall is bare. 150–1500 ms, the three bands paint in
  from the left edge one after another (90 ms stagger) and turn the corner
  down. As you scroll, each run paints in as it crosses the lower third of
  the viewport, turning a corner at every landing; at Contact the stripe
  runs under the email and off the right edge.
- Timing: hero 1.3 s per band, ease-out `cubic-bezier(.2,.8,.2,1)`; scroll
  runs are scrubbed by `animation-timeline: view()` (no JS).
- Reduced motion, Firefox without scroll timelines, and no-JS: the stripe is
  fully painted and still.

Small details: project covers are stripe routes unique to each project that
shift on hover; toolkit words stretch along Anybody's width axis on hover;
the email copies with a "Copied" confirmation; selection colour is brick.

## Voice

Plain, warm, a little dry. Short sentences. Placeholders are written *to*
Rushil, in the second person, so they read as instructions, not as fake bio.

## Content (exact)

All of it lives in `src/content/site.ts`.

- **Header:** "RC" mark · Work · About · Contact.
- **Hero:** h1 "Rushil Chopra" · line "A one-line description of what you
  make goes here." *(placeholder)* · button "See the work" · link "Say hello".
- **About:** h2 "About" · ¶1 "Two or three sentences on who you are and what
  you're working on right now. Keep it specific: name the thing, the people,
  the place." *(placeholder)* · ¶2 "A second, shorter paragraph on what you
  care about or how you like to work. Delete it if one is enough."
  *(placeholder)* · facts: "Based in / Your city", "Currently / What you're
  doing now", "Before that / Where you were before" *(placeholders)* ·
  portrait frame "RC", caption "Your portrait goes here."
- **Work:** h2 "Selected work" · three projects, each: number 01–03, title
  "Project title" *(placeholder)*, year "20XX", role "Your role", summary
  "Two sentences: what it is, who it's for, and what changed because it
  exists.", tools ["A language", "A framework", "A tool"], links "Live site",
  "Source" → example.com.
- **Toolkit:** h2 "Toolkit" · intro "The tools you reach for, and where they
  show up in the work above." · index of tools with project numbers ·
  "Off the clock" list of interests "An interest", "A hobby", "Something
  you're learning" *(placeholders)*.
- **Contact:** h2 "Say hello" · line "The fastest way to reach me is email."
  · email `hello@example.com` *(placeholder)* · "Copy" · socials GitHub,
  LinkedIn, X *(placeholder URLs: platform home pages)*.
- **Footer:** "© 2026 Rushil Chopra" · "Back to top".
