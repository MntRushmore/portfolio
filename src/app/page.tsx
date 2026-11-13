import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { MotionProvider } from "@/components/MotionProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Toolkit } from "@/components/Toolkit";
import { Work } from "@/components/Work";
import type { Metadata } from "next";
import { jsonLdScript, profileJsonLd } from "@/lib/structured-data";

// Here, not in the root layout, so other pages (the 404 above all) don't inherit it.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <MotionProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Work />
        <About />
        <Toolkit />
        <Contact />
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(profileJsonLd()) }}
      />
    </MotionProvider>
  );
}
