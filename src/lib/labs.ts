import type { Metadata } from "next";
import { labs, labsSite, type Lab } from "@/content/labs";

/** Drafts are hidden everywhere. Preview them with LABS_SHOW_DRAFTS=1 npm run dev. */
const showDrafts = process.env.LABS_SHOW_DRAFTS === "1";

export const labsUrl = () => new URL(labsSite.url);

/** Labs visible in this environment, newest first (ties: the later-made first). */
export function visibleLabs(): Lab[] {
  return labs
    .map((lab, i) => ({ lab, i }))
    .filter(({ lab }) => showDrafts || !lab.draft)
    .sort((a, b) => b.lab.date.localeCompare(a.lab.date) || b.i - a.i)
    .map(({ lab }) => lab);
}

export function findLab(slug: string): Lab | undefined {
  return visibleLabs().find((lab) => lab.slug === slug);
}

/** A lab's number is its place in the order they were made: "01", "02"… */
export function labNumber(slug: string): string {
  return String(labs.findIndex((l) => l.slug === slug) + 1).padStart(2, "0");
}

/** The next lab down the index, wrapping round to the newest. */
export function nextLab(slug: string): Lab | undefined {
  const list = visibleLabs();
  if (list.length < 2) return undefined;
  const i = list.findIndex((l) => l.slug === slug);
  return list[(i + 1) % list.length];
}

/** "2026-11-10" → "10 Nov 2026", without timezone drift. */
export function formatLabDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Page metadata for one lab. Paths are relative to labs.rushilchopra.com. */
export function labMetadata(slug: string): Metadata {
  const lab = labs.find((l) => l.slug === slug);
  if (!lab) return {};
  const images = lab.cover ? [{ url: lab.cover, width: 1600, height: 1000, alt: lab.title }] : undefined;
  return {
    title: lab.title,
    description: lab.summary,
    alternates: { canonical: `/${lab.slug}` },
    openGraph: {
      type: "article",
      url: `/${lab.slug}`,
      title: lab.title,
      description: lab.summary,
      publishedTime: lab.date,
      images,
    },
    twitter: { card: "summary_large_image", title: lab.title, description: lab.summary, images },
    robots: lab.draft ? { index: false, follow: false } : undefined,
  };
}
