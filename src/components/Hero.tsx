import Image from "next/image";
import type { CSSProperties } from "react";
import { site } from "@/content/site";
import { projectId, projectNumber } from "@/lib/site";
import { Stripe, StripeLayer } from "./Stripe";

export function Hero() {
  const [first, ...rest] = site.name.split(" ");
  const { portrait } = site;
  // The photo sits in the first line like an extra letter or so; budget for it
  // when fitting the name to its box.
  const longestWord = Math.max(
    first.length + (portrait ? 1.2 : 0),
    rest.join(" ").length,
  );

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="hero on-persimmon relative flex min-h-svh flex-col overflow-x-clip bg-persimmon"
      style={{ "--b3": "var(--color-plaster)" } as CSSProperties}
    >
      <div className="hero-body wrap hero-inner page-grid relative z-[2]">
        {/* A proper name: never machine-translated, and sized so its longest line always fits. */}
        <h1
          id="hero-title"
          className="type-display hero-name lg:col-span-12"
          translate="no"
          data-wd-ignore=""
          style={{ "--chars": longestWord } as CSSProperties}
        >
          <span className="block">
            {first}
            {portrait && (
              // Decorative here: the name beside it says who this is.
              <span
                className="hero-photo"
                aria-hidden="true"
                style={
                  {
                    "--fx": portrait.focus.split(" ")[0],
                    "--fy": portrait.focus.split(" ")[1],
                  } as CSSProperties
                }
              >
                <Image
                  src={portrait.src}
                  alt=""
                  fill
                  loading="eager"
                  sizes="(min-width: 1024px) 240px, 96px"
                  className="object-cover"
                  style={{ objectPosition: portrait.focus }}
                />
              </span>
            )}
          </span>
          {rest.length > 0 && <span className="block">{rest.join(" ")}</span>}
        </h1>

        <p className="hero-lede mt-7 max-w-[24ch] font-medium leading-[1.22] tracking-[-0.012em] [text-wrap:pretty] sm:mt-10 lg:col-span-5 lg:max-w-none">
          {site.tagline}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4 sm:mt-9 lg:col-span-6 lg:col-start-6 lg:mt-10 lg:self-center">
          <a href="#work" className="btn">
            See the work{" "}
            <span className="arrow" aria-hidden="true">
              ↓
            </span>
          </a>
          <a
            href="#contact"
            className="link inline-flex min-h-11 items-center text-[length:var(--t-ui)] font-bold"
          >
            Say hello
          </a>
        </div>
      </div>

      {/* The floor: the stripe's run and drop, with the project directory hung
          inside its U on wide screens (above the run on narrow ones). */}
      <div className="hero-floor">
        <nav aria-label="Selected work" className="relative z-[2]">
          <div className="wrap page-grid">
            <ol className="flex flex-col gap-y-2 lg:col-span-10 lg:flex-row lg:flex-wrap lg:gap-x-10 lg:gap-y-3">
              {site.projects.map((project, i) => (
                <li key={project.slug}>
                  <a
                    href={`#${projectId(project.slug)}`}
                    className="group inline-flex min-h-11 items-center gap-3.5"
                  >
                    <span className="inline-grid size-9 shrink-0 place-items-center rounded-full border-2 border-umber font-display text-[0.8125rem] font-bold tabular-nums transition-colors duration-150 [font-variation-settings:'wdth'_112] group-hover:bg-umber group-hover:text-plaster">
                      {projectNumber(i)}
                    </span>
                    <span className="font-display text-[1.25rem] font-black leading-[1.05] tracking-[-0.02em] underline decoration-transparent decoration-2 underline-offset-4 transition-colors duration-150 [font-variation-settings:'wdth'_110] sm:text-[1.375rem] sm:[font-variation-settings:'wdth'_120] group-hover:decoration-umber">
                      {project.title}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <StripeLayer>
          <Stripe piece="hero" corner="tr" order="umber-out" />
        </StripeLayer>
      </div>
    </section>
  );
}
