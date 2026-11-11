import type { CSSProperties, ReactNode } from "react";

type Corner = "tr" | "br" | "bl" | "tl";
type Piece =
  | "hero"
  | "rail-right-turn-left"
  | "in-from-right-down-left"
  | "down-left-out-right"
  | "in-from-left-down-right"
  | "exit-left";
type Paint =
  "down-then-west" | "west-then-down" | "down-then-east" | "east-then-down";

/**
 * Band order across the stripe, outermost first. On right turns the umber band
 * is on the outside; on left turns it is on the inside. Keeping this straight
 * is what makes the pieces join into one continuous stripe.
 */
const ORDER = {
  "umber-out": ["var(--color-umber)", "var(--color-brick)", "var(--b3)"],
  "umber-in": ["var(--b3)", "var(--color-brick)", "var(--color-umber)"],
} as const;

export function StripeLayer({ children }: { children: ReactNode }) {
  return (
    <div className="stripe-layer" aria-hidden="true">
      <div className="stripe-frame">{children}</div>
    </div>
  );
}

export function Stripe({
  piece,
  corner,
  order,
  paint,
}: {
  piece: Piece;
  corner: Corner;
  order: keyof typeof ORDER;
  paint?: Paint;
}) {
  return (
    <div
      className={`stripe stripe--${piece}`}
      data-corner={corner}
      data-paint={paint}
    >
      {ORDER[order].map((color, i) => (
        <i key={i} style={{ "--i": i, "--c": color } as CSSProperties} />
      ))}
    </div>
  );
}
