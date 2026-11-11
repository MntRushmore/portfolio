import type { MetadataRoute } from "next";
import { labsUrl, visibleLabs } from "@/lib/labs";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const labs = labsUrl();
  return [
    { url: siteUrl().toString(), changeFrequency: "monthly", priority: 1 },
    { url: labs.toString(), changeFrequency: "weekly", priority: 0.8 },
    ...visibleLabs()
      .filter((lab) => !lab.draft)
      .map((lab) => ({
        url: new URL(`/${lab.slug}`, labs).toString(),
        lastModified: lab.date,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
  ];
}
