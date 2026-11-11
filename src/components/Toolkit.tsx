import type { CSSProperties } from "react";
import { site } from "@/content/site";
import { toolIndex } from "@/lib/site";
import { Stripe, StripeLayer } from "./Stripe";

export function Toolkit() {
  const tools = toolIndex();

  return (
    <section
      id="toolkit"
      aria-labelledby="toolkit-title"
      className="relative bg-plaster"
      style={{ "--b3": "var(--color-persimmon)" } as CSSProperties}
    >
      <StripeLayer>
        <Stripe
          piece="in-from-left-down-right"
          corner="tr"
          order="umber-out"
          paint="east-then-down"
        />
      </StripeLayer>

      <div className="wrap rail-right page-grid relative z-[2] pt-[calc(var(--T)+5rem)] pb-28 lg:pt-[calc(var(--T)+8rem)] lg:pb-36">
        <div className="lane lg:grid-rows-[auto_1fr]">
          <div className="lg:col-span-4 lg:row-start-1">
            <h2 id="toolkit-title" className="type-h2">
              Toolkit
            </h2>
            <p className="type-lead mt-6 max-w-[22ch] sm:mt-8">
              {site.toolkit.intro}
            </p>
          </div>

          <div className="mt-14 lg:col-span-6 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:pt-3">
            <h3 className="type-sub">Index of tools</h3>
            <ul className="mt-3 border-t-2 border-umber">
              {tools.map((tool) => (
                <li
                  key={tool.name}
                  className="index-row grid grid-cols-[minmax(0,auto)_minmax(3rem,1fr)_auto] items-end gap-3 border-b border-plaster-2 py-3.5 sm:gap-5 sm:py-4"
                >
                  <span className="index-name min-w-0 [overflow-wrap:anywhere]">
                    {tool.name}
                  </span>
                  <span className="index-leader h-[1.1em]" aria-hidden="true" />
                  {tool.refs.length > 0 ? (
                    <span className="flex shrink-0 gap-1.5">
                      <span className="sr-only">Used in </span>
                      {tool.refs.map((ref) => (
                        <a
                          key={ref.id}
                          href={`#${ref.id}`}
                          className="inline-grid size-9 place-items-center rounded-full border-2 border-umber font-display text-[0.8125rem] font-bold tabular-nums transition-colors duration-150 [font-variation-settings:'wdth'_112] hover:bg-umber hover:text-plaster"
                        >
                          <span aria-hidden="true">{ref.number}</span>
                          <span className="sr-only">
                            project {ref.number}, {ref.title}
                          </span>
                        </a>
                      ))}
                    </span>
                  ) : (
                    <span className="pb-1 text-[length:var(--t-small)] font-semibold text-ink-2">
                      Not yet<span className="sr-only"> used in a project</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-14 lg:col-span-4 lg:row-start-2 lg:mt-0 lg:self-start">
            <h3 className="type-sub lg:mt-16">Off the clock</h3>
            <ul className="mt-3 border-t-2 border-umber">
              {site.toolkit.interests.map((interest) => (
                <li
                  key={interest.name}
                  className="index-row border-b border-plaster-2 py-3.5 sm:py-4"
                >
                  <p className="index-name">{interest.name}</p>
                  {interest.note && (
                    <p className="mt-1 text-[length:var(--t-small)] leading-normal text-ink-2">
                      {interest.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
