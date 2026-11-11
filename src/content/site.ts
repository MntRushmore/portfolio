/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONTENT: everything personal on the site lives in this one file.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Every value marked `// PLACEHOLDER` is not real yet. Replace it with your
 *  own words, then delete the marker. Nothing here was invented about you:
 *  until you fill it in, the site shows instructions written to you.
 *
 *  Real details below come from you, your X profile (@mnt_rushmore), your
 *  GitHub (MntRushmore), agathon.app, fuime.com and youthforyoga.org.
 *  `// CONFIRM` marks a detail inferred on your behalf; check it reads right.
 *
 *  Tips
 *  - Keep `tagline` to one line (about 8–14 words).
 *  - Projects render in the order listed. Three is the sweet spot; 2–5 work.
 *  - Tools listed under each project build the Toolkit index automatically,
 *    so spell each tool the same way everywhere ("TypeScript", not "TS").
 *  - Project images: put files in /public/work and set
 *    `image: { src: "/work/name.jpg", alt: "What the image shows", width, height }`.
 *    Without an image, a project gets a painted cover with its number.
 */

export type Link = { label: string; href: string };

export type Project = {
  /** Used for the in-page anchor (#work-<slug>). Lowercase, no spaces. */
  slug: string;
  title: string;
  year: string;
  role: string;
  summary: string;
  tools: string[];
  links: Link[];
  image?: { src: string; alt: string; width: number; height: number };
};

export type Social = Link & { handle: string };

export const site = {
  name: "Rushil Chopra",
  /** Two letters for the header mark and favicon. */
  monogram: "RC",

  /**
   * Your photo, set into your name at the top of the page. `focus` is where
   * your face sits in the photo (x% y%), so the crop keeps it centred.
   * Set to null to show the name alone.
   */
  portrait: {
    src: "/portrait.jpg",
    alt: "Rushil Chopra smiling in a garden, wearing blue glasses and a cream knit shirt.",
    focus: "57% 42%",
  } as null | { src: string; alt: string; focus: string },

  /** The line under your name in the hero. */
  tagline: "High schooler building tools that help teens learn and do more.",

  /**
   * Your live domain, used for social previews and search. Leave as-is on
   * Vercel (its production URL is picked up automatically) or set it here.
   */
  url: "https://rushilchopra.com",

  /** Search and social preview text. */
  description:
    "Rushil Chopra is a high schooler building tools that help teens learn and do more: Agathon, fuime and Youth for Yoga. Junior at founders.school by Alpha, staff at Hack Club, 1517 Fund grantee.",

  about: {
    paragraphs: [
      "I’m a high schooler building tools that help teens learn and do more. Right now that’s Agathon, a whiteboard that writes back, and fuime, which lets teens invoice clients and get paid for the work they already do.",
      "Away from the keyboard, I co-founded Youth for Yoga with Kashni Chopra: a youth-led nonprofit bringing yoga and mindfulness into schools. In 2026 we taught 500+ students in Firozabad, India.",
    ],
    facts: [
      { label: "Based in", value: "San Francisco + NYC" },
      { label: "Studying", value: "Junior at founders.school by Alpha" },
      { label: "Also", value: "Staff at Hack Club" },
      { label: "Grant", value: "1517 Fund" },
    ],
  },

  projects: [
    {
      slug: "agathon",
      title: "Agathon",
      year: "2025–26",
      role: "Founder",
      summary:
        "A whiteboard that writes back. Students write math by hand; Agathon reads every line as it’s written, checks each step, and answers in its own handwriting, from graphs and geometry to proofs.",
      tools: ["TypeScript", "Next.js", "Supabase", "AI SDK"],
      links: [
        { label: "Try Agathon", href: "https://www.agathon.app/" },
        {
          label: "Watch the demo",
          href: "https://x.com/mnt_rushmore/status/2106017831049629907",
        },
      ],
    },
    {
      slug: "fuime",
      title: "fuime",
      year: "2026",
      role: "Founder",
      summary:
        "Invoicing, payments and books for teens who sell their work, from tutoring and lawn care to photography and DJ sets. Clients pay by card; fuime pays out the sale, less one fee, and keeps the books.",
      tools: ["JavaScript", "HTML & CSS"], // CONFIRM (from the fuime.com repo)
      links: [{ label: "Visit fuime", href: "https://fuime.com/" }],
    },
    {
      slug: "youth-for-yoga",
      title: "Youth for Yoga",
      year: "2024–",
      role: "Co-founder",
      summary:
        "A youth-led nonprofit making yoga accessible to young people through classes, leadership programs that certify teen instructors, and school workshops. 500+ students taught across 5+ schools, from San Mateo to Firozabad.",
      tools: ["Yoga", "Mindfulness", "Teaching"],
      links: [
        { label: "Visit Youth for Yoga", href: "https://youthforyoga.org/" },
        { label: "The India journey", href: "https://yfyindia.vercel.app/" },
      ],
    },
  ] satisfies Project[] as Project[],

  toolkit: {
    intro: "The tools I reach for, and where they show up in the work above.",
    /** Tools you use that aren't attached to a project above. */
    extraTools: [] as string[],
    /** Add an optional `note` (one line) to any interest. */
    interests: [
      { name: "Vibecoding" },
      { name: "Yoga" },
      { name: "Reading" },
    ] as { name: string; note?: string }[],
  },

  contact: {
    line: "The fastest way to reach me is email.",
    email: "rushil.chopra@alpha.school",
    socials: [
      {
        label: "X",
        handle: "mnt_rushmore",
        href: "https://x.com/mnt_rushmore",
      },
      {
        label: "LinkedIn",
        handle: "therushilchopra",
        href: "https://www.linkedin.com/in/therushilchopra/",
      },
      {
        label: "GitHub",
        handle: "MntRushmore",
        href: "https://github.com/MntRushmore",
      },
    ] satisfies Social[] as Social[],
  },

  /**
   * The free-website offer at /free: the page you send people to (QR code,
   * a text, or say it out loud). Each form sent is saved as a row in the
   * `leads` table of your Neon database.
   */
  offer: {
    /** Browser tab and link-preview title. */
    metaTitle: "A free website for your business",
    eyebrow: "For New York businesses",
    title: "A free website for your business.",
    lede: "I’m Rushil, a student who builds websites and apps. Right now I’m designing them free for businesses around New York. Leave your details and I’ll get in touch.", // CONFIRM
    steps: [
      { title: "Leave your details", body: "It takes about a minute." },
      {
        title: "I get in touch",
        body: "By text or email, to hear about the business and what you need.",
      },
      {
        title: "I design your site",
        body: "Free. You see it, then decide what happens next.", // CONFIRM
      },
    ],
    formTitle: "Tell me about your business",
    formLine: "I’ll only use your details to talk to you about your website.",
    thanks: "I’ll be in touch soon.",
  },
};

export type Site = typeof site;
