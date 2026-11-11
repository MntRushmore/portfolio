import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { LeadForm } from "@/components/LeadForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Stripe, StripeLayer } from "@/components/Stripe";
import { site } from "@/content/site";

const { offer } = site;

// Setting openGraph here replaces the root's, so the share image is restated.
const shareImage = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: `${site.name}, set in heavy expanded letters on a persimmon wall, with a three-band 1970s stripe running underneath.`,
};

export const metadata: Metadata = {
  title: offer.metaTitle,
  description: offer.lede,
  alternates: { canonical: "/free" },
  openGraph: {
    type: "website",
    url: "/free",
    siteName: site.name,
    title: offer.metaTitle,
    description: offer.lede,
    locale: "en_US",
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: offer.metaTitle,
    description: offer.lede,
    images: [{ ...shareImage, url: "/twitter-image.png" }],
  },
};

const NAV = [
  { label: "My work", href: "/#work" },
  { label: "About me", href: "/#about" },
];

export default function FreeSite() {
  // The title is sized so its longest word always fits its box.
  const longestWord = Math.max(...offer.title.split(/\s+/).map((w) => w.length));

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader home="/" nav={NAV} />
      <main id="main" tabIndex={-1} className="outline-none">
        <section
          id="top"
          aria-labelledby="offer-title"
          className="hero on-persimmon relative flex flex-col overflow-x-clip bg-persimmon"
          style={{ "--b3": "var(--color-plaster)" } as CSSProperties}
        >
          <div className="hero-body wrap hero-inner page-grid relative z-[2] lg:pb-16">
            <p className="type-meta lg:col-span-12">{offer.eyebrow}</p>
            <h1
              id="offer-title"
              className="offer-title mt-5 lg:col-span-11"
              style={{ "--chars": longestWord } as CSSProperties}
            >
              {offer.title}
            </h1>

            <div className="mt-7 sm:mt-10 lg:col-span-5">
              <p className="hero-lede max-w-[30ch] font-medium leading-[1.22] tracking-[-0.012em] [text-wrap:pretty] lg:max-w-none">
                {offer.lede}
              </p>
              <a href="#details" className="btn mt-8">
                Leave your details{" "}
                <span className="arrow" aria-hidden="true">
                  ↓
                </span>
              </a>
            </div>

            <ol className="mt-12 flex flex-col gap-y-6 sm:mt-14 lg:col-span-5 lg:col-start-8 lg:mt-10">
              {offer.steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="inline-grid size-9 shrink-0 place-items-center rounded-full border-2 border-umber font-display text-[0.8125rem] font-bold tabular-nums [font-variation-settings:'wdth'_112]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="pt-1">
                    <p className="font-display text-[1.25rem] font-black leading-[1.05] tracking-[-0.02em] [font-variation-settings:'wdth'_110] sm:text-[1.375rem] sm:[font-variation-settings:'wdth'_120]">
                      {step.title}
                    </p>
                    <p className="mt-1.5 max-w-[36ch] text-[length:var(--t-small)] leading-snug">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="hero-floor">
            <StripeLayer>
              <Stripe piece="hero" corner="tr" order="umber-out" />
            </StripeLayer>
          </div>
        </section>

        <section
          id="details"
          aria-labelledby="details-title"
          className="relative overflow-x-clip bg-plaster"
          style={
            {
              "--b3": "var(--color-persimmon)",
              "--exit-at": "clamp(40px, 7vw, 72px)",
            } as CSSProperties
          }
        >
          <StripeLayer>
            <Stripe
              piece="exit-left"
              corner="br"
              order="umber-out"
              paint="down-then-west"
            />
          </StripeLayer>

          <div className="wrap rail-right page-grid relative z-[2] pt-20 pb-[calc(var(--exit-at)+var(--T)+4.5rem)] sm:pt-28 lg:pt-36">
            <div className="lane">
              <h2 id="details-title" className="type-h2 lg:col-span-8">
                {offer.formTitle}
              </h2>
              <p className="type-lead mt-6 max-w-[32ch] lg:col-span-6">
                {offer.formLine}
              </p>
              <div className="mt-12 lg:col-span-8 lg:mt-16">
                <LeadForm thanks={offer.thanks} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
