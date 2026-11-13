import type { MetadataRoute } from "next";
import { labsUrl, visibleLabs } from "@/lib/labs";
import { siteUrl } from "@/lib/site";

/**
 * Every public page on both hosts. The labs pages live on labs.rushilchopra.com;
 * listing them here is allowed because that host's robots.txt points at this file.
 * /labs/stats is private and left out.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const home = siteUrl();
  const labs = visibleLabs().filter((lab) => !lab.draft);
  return [
    { url: home.toString(), changeFrequency: "monthly", priority: 1 },
    { url: new URL("/free", home).toString(), changeFrequency: "monthly", priority: 0.5 },
    {
      url: labsUrl().toString(),
      lastModified: labs[0]?.date,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...labs.map((lab) => ({
      url: new URL(`/${lab.slug}`, labsUrl()).toString(),
      lastModified: lab.date,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
