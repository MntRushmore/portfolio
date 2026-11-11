import type { NextConfig } from "next";

/**
 * labs.rushilchopra.com is served by this same app: requests to any `labs.*`
 * host are rewritten into the /labs section. In dev, open
 * http://labs.localhost:3000 to see it.
 */
const LABS_HOST = { type: "host" as const, value: "labs\\..+" };
const MAIN_HOST = { type: "host" as const, value: "(www\\.)?rushilchopra\\.com" };

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,

  async redirects() {
    // rushilchopra.com/labs/* lives on the subdomain.
    return [
      {
        source: "/labs/:path*",
        has: [MAIN_HOST],
        destination: "https://labs.rushilchopra.com/:path*",
        permanent: false,
      },
    ];
  },

  async rewrites() {
    return {
      // Before files, so the labs host's "/" isn't the portfolio's front page.
      // beforeFiles rewrites chain (each sees the last one's output), so the
      // catch-all runs first: it can't match "/", and "/" → "/labs" is final.
      beforeFiles: [
        {
          // Page paths only: Next internals (/_next, /__nextjs…), lab files, the API and
          // anything with a dot (icons, robots.txt, sitemap.xml) pass through.
          source: "/:path((?!_|lab-files/|api/)[^.]+)",
          has: [LABS_HOST],
          destination: "/labs/:path",
        },
        { source: "/", has: [LABS_HOST], destination: "/labs" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
