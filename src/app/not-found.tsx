import Link from "next/link";
import type { CSSProperties } from "react";
import { Stripe, StripeLayer } from "@/components/Stripe";

export const metadata = { title: "Wrong floor" };

export default function NotFound() {
  return (
    <main
      className="hero on-persimmon relative flex min-h-svh flex-col overflow-x-clip bg-persimmon"
      style={{ "--b3": "var(--color-plaster)" } as CSSProperties}
    >
      <div className="hero-body wrap relative z-[2]">
        <p className="type-sub">404</p>
        <h1 className="type-h2 mt-4">Wrong floor.</h1>
        <p className="type-lead mt-6 max-w-[28ch]">
          There’s no landing at this address. The stairs start at the front
          page.
        </p>
        <Link href="/" className="btn mt-10">
          Back to the front page
        </Link>
      </div>
      <div className="hero-floor">
        <StripeLayer>
          <Stripe piece="hero" corner="tr" order="umber-out" />
        </StripeLayer>
      </div>
    </main>
  );
}
