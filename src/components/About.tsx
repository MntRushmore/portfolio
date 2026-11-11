import type { CSSProperties } from "react";
import { site } from "@/content/site";
import { Stripe, StripeLayer } from "./Stripe";

export function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="relative bg-plaster"
      style={{ "--b3": "var(--color-persimmon)" } as CSSProperties}
    >
      <StripeLayer>
        <Stripe
          piece="in-from-right-down-left"
          corner="tl"
          order="umber-in"
          paint="west-then-down"
        />
        <Stripe
          piece="down-left-out-right"
          corner="bl"
          order="umber-in"
          paint="down-then-east"
        />
      </StripeLayer>

      <div className="wrap rail-left page-grid relative z-[2] pt-[calc(var(--T)+5rem)] pb-28 lg:pt-[calc(var(--T)+8rem)] lg:pb-36">
        <div className="lane">
          <div className="lg:col-span-6 lg:row-start-1">
            <h2 id="about-title" className="type-h2">
              About
            </h2>
            <div className="mt-8 space-y-5 sm:mt-10">
              {site.about.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={i === 0 ? "type-lead max-w-[30ch]" : "prose-body"}
                >
                  {p}
                </p>
              ))}
            </div>
          </div>

          {/* Quick facts: a column beside the text on wide screens, aligned
              with the first paragraph; a grid under it on narrow ones. */}
          <dl className="mt-12 grid content-start gap-x-8 border-t-2 border-umber sm:grid-cols-2 lg:col-span-4 lg:col-start-8 lg:row-start-1 lg:mt-[calc(var(--t-h2)*0.92+2.5rem)] lg:grid-cols-1">
            {site.about.facts.map((fact) => (
              <div key={fact.label} className="border-b border-plaster-2 py-4">
                <dt className="text-[length:var(--t-small)] font-medium text-ink-2">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-[1.125rem] font-semibold leading-snug">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
