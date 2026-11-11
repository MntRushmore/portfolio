# Rushil Chopra — portfolio

A one-page portfolio. Concept: a stairwell painted with a 1970s supergraphic.
One three-band stripe runs down the page, turning a corner at every section,
and paints itself in as you scroll.

## Edit your content

Everything personal lives in **one file: [`src/content/site.ts`](src/content/site.ts)**.
Every value marked `// PLACEHOLDER` still needs your words. Nothing in it was
made up about you.

- **Projects:** edit, add or remove entries in `projects`. Each one's `tools`
  feed the Toolkit index automatically.
- **Your photo:** `portrait` in `site.ts` points at `public/portrait.jpg` and is
  set into your name at the top of the page. Swap the file for a larger one
  (1000px+ looks sharpest) and adjust `focus` to where your face sits.
- **Project images (optional):** drop files into `public/work/` and add
  `image: { src: "/work/name.jpg", alt: "…", width: 1600, height: 1200 }` to a
  project. Without one, a project gets a painted cover with its number.
- **Domain:** set `url` to your live domain (on Vercel the production URL is
  used automatically while `url` is still `example.com`).

## Labs (labs.rushilchopra.com)

The same app serves labs.rushilchopra.com: `next.config.ts` rewrites any
`labs.*` host into `src/app/labs/`, and rushilchopra.com/labs redirects there.
Locally, open **http://labs.localhost:3000**.

Every lab is listed in [`src/content/labs.ts`](src/content/labs.ts), which
drives the index. Add an entry there, then build the lab one of two ways:

- **HTML lab** (`kind: "html"`): any self-contained HTML/JS/CSS goes in
  `public/lab-files/<slug>/index.html`, and it's shown full-screen under a bar
  back to the index. Good for canvas, WebGL, or anything you've hacked together.
  Link `../kit.css` for the site's paints, fonts, buttons and sliders, and add
  a 16:10 `cover.jpg` (set `cover` in the entry) for the index card.
- **React lab** (`kind: "page"`): create `src/app/labs/<slug>/page.tsx`:

  ```tsx
  import { LabShell } from "@/components/LabShell";
  import { labMetadata } from "@/lib/labs";

  export const metadata = labMetadata("my-lab");

  export default function MyLab() {
    return <LabShell slug="my-lab">{/* the experiment */}</LabShell>;
  }
  ```

Mark a lab `draft: true` to hide it everywhere. To preview drafts locally, run
`LABS_SHOW_DRAFTS=1 npm run dev`. Links inside labs are host-relative: `/` is the
labs index, and `/<slug>` is a lab.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## How it's built

- Next.js (App Router, static), TypeScript, Tailwind CSS v4, Framer Motion.
- **Tokens:** `src/app/globals.css` (`@theme` colours, the type scale, the
  stripe's band sizes). Design notes: `.design/DIRECTION.md`.
- **The stripe:** `src/components/Stripe.tsx` plus the "The stripe" block in
  `globals.css`. Each section owns one or two L-shaped pieces made of nested
  CSS borders; they meet on their straight runs. Painting uses CSS
  scroll-driven animations; browsers without them, and anyone with reduced
  motion, see it fully painted.
- **Fonts:** Anybody (display, width axis) and Hanken Grotesk (text), self-hosted
  by `next/font`.
- **Social card and icons:** `src/app/opengraph-image.png`, `icon.svg`,
  `apple-icon.png`, `favicon.ico`, `public/icon-*.png`. They show only your
  name and the stripe, so they stay correct as you edit content.

## Deploy

Push to GitHub and import the repo on Vercel (no configuration needed), or run
`npx vercel`.
