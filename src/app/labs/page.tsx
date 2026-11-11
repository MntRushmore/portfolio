import Link from "next/link";
import type { CSSProperties } from "react";
import { LabCard } from "@/components/LabCard";
import { LabTrack } from "@/components/LabTrack";
import { SiteHeader } from "@/components/SiteHeader";
import { Stripe, StripeLayer } from "@/components/Stripe";
import { labsSite } from "@/content/labs";
import { site } from "@/content/site";
import { formatLabDate, labNumber, visibleLabs } from "@/lib/labs";

export default function LabsIndex() {
  const list = visibleLabs();
  const latest = list[0];

  return (
    <>
      <LabTrack lab="index" />
      <SiteHeader home={site.url} nav={[{ label: "Portfolio", href: site.url }]} />
      <main>
        {/* The stairwell's basement: the same stripe runs in from the left,
            turns down, follows the labs and leaves at the bottom. */}
        <section
          aria-labelledby="labs-title"
          className="hero on-persimmon relative flex flex-col overflow-x-clip bg-persimmon"
          style={{ "--b3": "var(--color-plaster)" } as CSSProperties}
        >
          <div className="hero-body wrap hero-inner page-grid relative z-[2] pb-12 sm:pb-16 lg:pb-20">
            <h1
              id="labs-title"
              className="type-display hero-name lg:col-span-12"
              style={{ "--chars": labsSite.title.length } as CSSProperties}
            >
              {labsSite.title}
            </h1>
            <p className="hero-lede mt-7 max-w-[26ch] font-medium leading-[1.22] tracking-[-0.012em] [text-wrap:pretty] sm:mt-10 lg:col-span-6 lg:max-w-[24ch]">
              {labsSite.lede}
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-1 self-end sm:mt-10 sm:flex sm:gap-x-12 lg:col-span-5 lg:col-start-8 lg:mt-0 lg:justify-end">
              <div>
                <dt className="type-meta">Experiments</dt>
                <dd className="font-display text-[2.5rem] font-black leading-none tracking-[-0.03em] tabular-nums [font-variation-settings:'wdth'_130]">
                  {String(list.length).padStart(2, "0")}
                </dd>
              </div>
              {latest && (
                <div>
                  <dt className="type-meta">Latest</dt>
                  <dd className="mt-1.5 text-[length:var(--t-ui)] font-semibold">
                    <time dateTime={latest.date}>{formatLabDate(latest.date)}</time>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="hero-floor">
            {list.length > 0 && (
              <nav aria-label="All labs" className="relative z-[2]">
                <div className="wrap page-grid">
                  <ol className="flex flex-col gap-y-2 lg:col-span-10 lg:flex-row lg:flex-wrap lg:gap-x-10 lg:gap-y-3">
                    {list.map((lab) => (
                      <li key={lab.slug}>
                        <Link href={`/${lab.slug}`} className="group inline-flex min-h-11 items-center gap-3.5">
                          <span className="inline-grid size-9 shrink-0 place-items-center rounded-full border-2 border-umber font-display text-[0.8125rem] font-bold tabular-nums transition-colors duration-150 [font-variation-settings:'wdth'_112] group-hover:bg-umber group-hover:text-plaster">
                            {labNumber(lab.slug)}
                          </span>
                          <span className="font-display text-[1.25rem] font-black leading-[1.05] tracking-[-0.02em] underline decoration-transparent decoration-2 underline-offset-4 transition-colors duration-150 [font-variation-settings:'wdth'_110] group-hover:decoration-umber sm:text-[1.375rem] sm:[font-variation-settings:'wdth'_120]">
                            {lab.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              </nav>
            )}
            <StripeLayer>
              <Stripe piece="hero" corner="tr" order="umber-out" />
            </StripeLayer>
          </div>
        </section>

        <section
          aria-labelledby="bench-title"
          className="relative overflow-x-clip bg-plaster"
          style={
            {
              "--b3": "var(--color-persimmon)",
              "--exit-at": "clamp(40px, 7vw, 72px)",
            } as CSSProperties
          }
        >
          <StripeLayer>
            <Stripe piece="exit-left" corner="br" order="umber-out" paint="down-then-west" />
          </StripeLayer>

          <div className="wrap rail-right page-grid relative z-[2] pt-24 pb-[calc(var(--exit-at)+var(--T)+5rem)] sm:pt-32 lg:pt-36">
            <div className="lane">
              <h2 id="bench-title" className="type-h2">
                On the bench
              </h2>
              {list.length === 0 ? (
                <p className="type-lead mt-8 max-w-[30ch] text-ink-2">
                  Nothing on the bench yet. Check back soon.
                </p>
              ) : (
                <ol className="mt-14 grid gap-x-16 gap-y-20 sm:mt-20 lg:grid-cols-2 lg:gap-y-28">
                  {list.map((lab, i) => (
                    <LabCard key={lab.slug} lab={lab} number={labNumber(lab.slug)} featured={i === 0} />
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="on-umber bg-umber text-plaster">
        <div className="wrap flex flex-col gap-3 py-8 text-[length:var(--t-small)] sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <p className="text-plaster/80">No installs, no accounts. Everything runs in your browser.</p>
          <a href={site.url} className="link inline-flex min-h-11 items-center gap-1.5 font-semibold">
            rushilchopra.com <span aria-hidden="true">↗</span>
          </a>
        </div>
      </footer>
    </>
  );
}
