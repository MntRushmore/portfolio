# Critique

One critic for the whole job (fresh agent, continued each round).

## Round 1

Renders: `shots/r1/` (first screens, `scroll/*-painted-*` fully painted slices,
`scroll/*-scroll-*` as a visitor scrolls, `film/strip.png`, `film-cover/strip.png`,
`matrix/sheet.png`).

| # | Line | R1 |
|---|---|---|
| 1 | Concept on the page | 4 |
| 2 | Not the category average | 4 |
| 3 | Not a slop face | 4 |
| 4 | First screen | 3 |
| 5 | Typography | 4 |
| 6 | Colour | 4 |
| 7 | Richness | 4 |
| 8 | Structure and rhythm | 3 |
| 9 | Craft | 3 |
| 10 | Responsive | 3 |
| 11 | Everyone's computer | 3 |
| 12 | Signature | 4 |
| 13 | Screenshot test | 4 |

Not done (9 of 13 at 4+; matrix had 2 l10n FAILs).

### The five asks

1. Hero name clipping under l10n stress: size the h1 to its box; never clip.
2. Craft: monogram reads "R¢" (stripe crosses the C); three underlines per
   social link; 1px seams at piece joins and ground changes (and in High
   Contrast); half-dots at leader ends on phones; cover hover blanks the
   stripe before repainting (paint a second coat instead).
3. Evidence on the first screen: a "floor directory" of the projects inside
   the stripe's U on desktop, above the run on phones; larger descriptor.
4. One grid: Toolkit's "Off the clock" into the left column, index at the
   page's second vertical; same h2 size everywhere.
5. Phone/tablet: bands 10/5 at 390; top-align 768 hero; paint head runs ahead
   of the reader.

### Mechanical fixes made before/while round 1 was judged

- Header contrast FAIL (scanner read the umber body behind an absolutely
  positioned header): header now carries its own persimmon ground.
- l10n FAIL: the name is now sized from its longest word against its own
  container (`100cqi / (chars × 1.04)`), so any name fits; it is also marked
  `translate="no"` (a proper name is never machine-translated) and excluded
  from the pseudo-localisation pass. Matrix re-run: clean (`r1/matrix2`).
- Build trap: Lightning CSS rewrote `animation-range: … entry 100%` to
  `entry 0%` (inverting the Contact piece). Re-expressed in `cover` terms and
  verified in the built CSS.
- Focus ring squared off pills and round chips (`border-radius: 2px` on
  `:focus-visible`): removed.
- Framer Motion features now load after hydration (initial JS −13 KB gzip).

## Round 2

Changes, by ask:

1. Name: sized from its own container (`min(185px, 100cqi / (chars × 1.04))`);
   `translate="no"`. **Declined** the JS width-axis condensing step: pure CSS
   already guarantees the fit with no layout shift.
2. Craft: monogram clear of the stripe; one underline per social link (handle
   only); 1px overlaps at every piece join; leader dots `round`; cover hover
   paints a rotated second coat (never blank).
3. First screen: floor directory of the projects (inside the stripe's U on
   desktop, above the run on phone/tablet); descriptor 32px at 1440.
4. One 12-column page grid from 1024px with an 11-column subgrid "lane" beside
   the rail; shared second vertical at x≈619 (hero CTA, cover 02, Toolkit
   index); Toolkit reflowed; type steps consolidated (185/80/38/32/28/19/17/15).
5. Bands 10/5 at phone, 14/6 at tablet; tablet hero top-aligned; paint head
   moved to ~88% down the screen.

Mechanical: l10n-phone nav overflow (+2px) fixed (tighter phone nav padding,
header may wrap). Matrix clean on all passes.

### Round 2 scores

| # | Line | R1 | R2 |
|---|---|---|---|
| 1 | Concept on the page | 4 | 5 |
| 2 | Not the category average | 4 | 4 |
| 3 | Not a slop face | 4 | 4 |
| 4 | First screen | 3 | 4 |
| 5 | Typography | 4 | 4 |
| 6 | Colour | 4 | 4 |
| 7 | Richness | 4 | 4 |
| 8 | Structure and rhythm | 3 | 4 |
| 9 | Craft | 3 | 4 |
| 10 | Responsive | 3 | 4 |
| 11 | Everyone's computer | 3 | 4 |
| 12 | Signature | 4 | 4 |
| 13 | Screenshot test | 4 | 4 |

**Done by the stop rule** (13 of 13 at 4+, no FAILs). Firefox untested (not installed).

### Fixed after the last round, not rescored

- Directory confined to columns 1–10 (≥45px clear of the inner band) as a
  wrapping row; the stripe's floor grows with it, so a second row (l10n) stays
  inside the U. *Declined* the critic's "let titles wrap with balance": the
  scan FAILs wrapped link labels, and the scan wins; items wrap instead.
- Short laptop screens (1024+ wide, ≤760 tall): name capped at 19svh, so the
  directory stays on the fold at 1280×610.
- Cover second coat is now the hover/focus state only; leaving repaints the
  resting coat; all three bands paint in unison; project title turns brick on
  hover; the cover is a pointer link to the project's first URL (hidden from
  the tab order and screen readers, which use the text links).
- Seams: root cause found. Chrome antialiases a hairline along a band's open
  (zero-width-border) edge when the box has a radius. Bands now run 20px past
  every open end and are clipped by their piece (`overflow: clip`); measured
  seam contrast at the About join went from 53.8 to 0. Zero-width sides are
  also transparent. High Contrast swaps the band colour variable instead of
  painting every side.
- Paint reveal uses each band's own corner strip (`--Ri`), not the outer
  band's, so no straight run is revealed early.
- Covers sit exactly on the grid (row/column gap on subgrids removed: 627 → 619).
- Toolkit index at the 32px step with a ≥48px leader.
- 768: About facts beside the portrait; Contact socials stacked below 1024.
- High Contrast: cover numbers and the portrait monogram use CanvasText.

Verified: scan clean at 390/768/1280/1440; matrix clean on every pass
(Windows 125/150/HC, Linux, Android, Safari, iPhone, 320 reflow, reduced
motion, l10n desktop and phone); production build static; built CSS keeps the
scroll-timeline ranges.
