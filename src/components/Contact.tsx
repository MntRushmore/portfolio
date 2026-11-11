import type { CSSProperties } from "react";
import { site } from "@/content/site";
import { CopyEmail } from "./CopyEmail";
import { Stripe, StripeLayer } from "./Stripe";

export function Contact() {
  const { email, line, socials } = site.contact;

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="on-persimmon relative overflow-x-clip bg-persimmon"
      style={
        {
          "--b3": "var(--color-plaster)",
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

      <div className="wrap rail-right page-grid relative z-[2] pt-24 pb-[calc(var(--exit-at)+var(--T)+4.5rem)] sm:pt-32 lg:pt-40">
        <div className="lane">
          <h2 id="contact-title" className="type-h2">
            Say hello
          </h2>
          <p className="type-lead mt-6 max-w-[30ch] lg:col-span-5">{line}</p>

          <div className="email-fit mt-10 flex flex-col items-start gap-6 lg:mt-14 lg:flex-row lg:items-center lg:gap-10">
            <a
              href={`mailto:${email}`}
              className="email link font-display font-black leading-[1.05] tracking-[-0.03em] [overflow-wrap:anywhere] [text-decoration-thickness:0.06em] [text-underline-offset:0.14em]"
              style={{ "--chars": email.length } as CSSProperties}
            >
              {email}
            </a>
            <CopyEmail email={email} />
          </div>

          <ul
            className="mt-12 flex flex-col gap-y-1 lg:mt-16 lg:flex-row lg:flex-wrap lg:gap-x-10"
            aria-label="Elsewhere"
          >
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="group inline-flex min-h-11 items-baseline gap-2.5 text-[length:var(--t-ui)]"
                >
                  <span className="font-semibold">{social.label}</span>
                  <span className="font-bold underline decoration-2 underline-offset-4 group-hover:decoration-4">
                    @{social.handle}&nbsp;<span aria-hidden="true">↗</span>
                  </span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
