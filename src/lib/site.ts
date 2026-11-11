import { site } from "@/content/site";

/** The canonical origin: the explicit URL in site.ts, else Vercel's production URL. */
export function siteUrl(): URL {
  const explicit = site.url && !site.url.includes("example.com") ? site.url : null;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(explicit ?? (vercel ? `https://${vercel}` : site.url));
}

/** Two-digit project number: 1 → "01". */
export const projectNumber = (index: number) => String(index + 1).padStart(2, "0");

export const projectId = (slug: string) => `work-${slug}`;

export type ToolEntry = { name: string; refs: { number: string; id: string; title: string }[] };

/** Builds the Toolkit index: every tool, and which projects it appears in. */
export function toolIndex(): ToolEntry[] {
  const map = new Map<string, ToolEntry>();
  site.projects.forEach((project, i) => {
    for (const tool of project.tools) {
      const entry = map.get(tool) ?? { name: tool, refs: [] };
      entry.refs.push({ number: projectNumber(i), id: projectId(project.slug), title: project.title });
      map.set(tool, entry);
    }
  });
  for (const tool of site.toolkit.extraTools) {
    if (!map.has(tool)) map.set(tool, { name: tool, refs: [] });
  }
  // Most-used first, then alphabetical, like an index you'd actually scan.
  return [...map.values()].sort(
    (a, b) => b.refs.length - a.refs.length || a.name.localeCompare(b.name),
  );
}
