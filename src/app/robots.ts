import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * AI search and assistant crawlers, named so they're welcome even where a
 * blanket rule elsewhere (a CDN's managed robots.txt, say) would turn them away.
 * A crawler that matches a named group ignores the `*` group, so each repeats it.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  const rule = { allow: "/", disallow: "/api/" };
  return {
    rules: [
      { userAgent: "*", ...rule },
      { userAgent: AI_CRAWLERS, ...rule },
    ],
    // One sitemap for both hosts. labs.rushilchopra.com serves this same file,
    // which is what lets the www sitemap list the labs pages.
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
