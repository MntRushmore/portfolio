"use client";

import Image from "next/image";
import { m, useReducedMotion } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";
import { stripe, type Point } from "@/lib/route";

/** Three painted walls, cycled by project. Bands are listed left-of-travel first. */
const WALLS = [
  {
    field: "var(--color-persimmon)",
    bands: ["var(--color-umber)", "var(--color-brick)", "var(--color-plaster)"],
    number: "var(--color-umber)",
    // In from the left, a right turn, out the bottom.
    route: [
      [-40, 104],
      [318, 104],
      [318, 420],
    ] as Point[],
    numberAt: { x: 30, y: 326, anchor: "start" as const },
  },
  {
    field: "var(--color-umber)",
    bands: [
      "var(--color-persimmon)",
      "var(--color-brick)",
      "var(--color-plaster)",
    ],
    number: "var(--color-plaster)",
    // Down from the top, a right turn, out the left.
    route: [
      [372, -40],
      [372, 222],
      [-40, 222],
    ] as Point[],
    numberAt: { x: 30, y: 152, anchor: "start" as const },
  },
  {
    field: "var(--color-brick)",
    bands: [
      "var(--color-umber)",
      "var(--color-persimmon)",
      "var(--color-plaster)",
    ],
    number: "var(--color-plaster)",
    // In from the left, up a step, out the right.
    route: [
      [-40, 262],
      [178, 262],
      [178, 92],
      [520, 92],
    ] as Point[],
    numberAt: { x: 452, y: 330, anchor: "end" as const },
  },
];

/** The bands in the order of the k-th coat of paint (0 = at rest, 1 = hover). */
const coatColors = (bands: string[], k: number) =>
  bands.map((_, i) => bands[(i + k) % bands.length]);

export function ProjectCard({
  index,
  number,
  image,
  href,
  children,
  id,
}: {
  index: number;
  number: string;
  image?: { src: string; alt: string; width: number; height: number };
  /** Where the cover links to: the project's first link, if any. */
  href?: string;
  children: ReactNode;
  id: string;
}) {
  const reduce = useReducedMotion();
  // Hover or keyboard focus paints a second coat over the cover with the bands
  // rotated; leaving paints the resting coat back. Each coat goes on over the
  // last one, so the cover is never blank.
  const [paint, setPaint] = useState({ n: 0, from: 0, to: 0 });
  const hovered = useRef(false);
  const focused = useRef(false);
  const update = () => {
    const to = hovered.current || focused.current ? 1 : 0;
    setPaint((p) => (p.to === to ? p : { n: p.n + 1, from: p.to, to }));
  };

  const wall = WALLS[index % WALLS.length];
  const paths = stripe(wall.route, 64, 26);
  const flip = index % 2 === 1;

  const cover = (
    <div
      className="relative aspect-[4/3] overflow-hidden rounded-[4px]"
      style={{ background: wall.field }}
    >
      {image ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 46vw, (min-width: 768px) 86vw, 92vw"
          className="object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 480 360"
          className="absolute inset-0 size-full"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid slice"
        >
          <text
            className="cover-number"
            x={wall.numberAt.x}
            y={wall.numberAt.y}
            textAnchor={wall.numberAt.anchor}
            fill={wall.number}
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontVariationSettings: "'wdth' 150",
              fontSize: 132,
              letterSpacing: "-0.04em",
            }}
          >
            {number}
          </text>
          <g fill="none" strokeWidth={18}>
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                stroke={coatColors(wall.bands, paint.from)[i]}
              />
            ))}
          </g>
          {paint.n > 0 && (
            <g key={paint.n} fill="none" strokeWidth={18}>
              {paths.map((d, i) => (
                <m.path
                  key={i}
                  d={d}
                  stroke={coatColors(wall.bands, paint.to)[i]}
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: [0.5, 0, 0.2, 1] }}
                />
              ))}
            </g>
          )}
        </svg>
      )}
      {image && (
        <span className="type-meta absolute left-3 top-3 rounded-full bg-umber px-3 py-1.5 text-plaster">
          {number}
        </span>
      )}
    </div>
  );

  return (
    <m.li
      id={id}
      className="group/project grid gap-y-7 md:gap-y-10 lg:col-span-full lg:grid-cols-subgrid lg:items-center"
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        hovered.current = true;
        update();
      }}
      onPointerLeave={() => {
        hovered.current = false;
        update();
      }}
      onFocus={() => {
        focused.current = true;
        update();
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        focused.current = false;
        update();
      }}
    >
      <div
        className={`lg:row-start-1 lg:col-span-6 ${flip ? "lg:col-start-6" : "lg:col-start-1"}`}
      >
        {href ? (
          // The text links below carry the name; this is a bigger target for the pointer.
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={-1}
            aria-hidden="true"
            className="block"
          >
            {cover}
          </a>
        ) : (
          cover
        )}
      </div>
      <div
        className={`lg:row-start-1 lg:col-span-4 ${flip ? "lg:col-start-1" : "lg:col-start-8"}`}
      >
        {children}
      </div>
    </m.li>
  );
}
