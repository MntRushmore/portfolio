import Image from "next/image";
import Link from "next/link";
import type { Lab } from "@/content/labs";
import { formatLabDate } from "@/lib/labs";

/**
 * One lab on the index: its cover, and what it is. Hover or focus paints the
 * stripe's three bands round the cover, like a frame on the stairwell wall.
 */
export function LabCard({ lab, number, featured }: { lab: Lab; number: string; featured?: boolean }) {
  return (
    <li className={featured ? "lg:col-span-2" : undefined}>
      <Link
        href={`/${lab.slug}`}
        className={`lab-card group grid gap-y-7 ${featured ? "lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-center lg:gap-x-16" : ""}`}
      >
        <div className="lab-cover relative aspect-[16/10] overflow-hidden rounded-[4px] bg-persimmon">
          {lab.cover ? (
            <Image
              src={lab.cover}
              alt=""
              fill
              sizes={featured ? "(min-width: 1024px) 52vw, 92vw" : "(min-width: 1024px) 40vw, 92vw"}
              className="object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.035]"
            />
          ) : (
            <span
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center font-display text-[8rem] font-black leading-none tracking-[-0.04em] [font-variation-settings:'wdth'_150]"
            >
              {number}
            </span>
          )}
          <span className="type-meta absolute left-3 top-3 rounded-full bg-umber px-3 py-1.5 text-plaster">
            Lab {number}
          </span>
          {lab.draft && (
            <span className="type-meta absolute right-3 top-3 rounded-full bg-plaster px-3 py-1.5 text-umber">
              Draft
            </span>
          )}
        </div>

        <div>
          <h3
            className={`type-h3 transition-colors duration-150 group-hover:text-brick ${featured ? "lg:text-[clamp(2.2rem,1.4rem+1.8vw,3.4rem)]" : ""}`}
          >
            {lab.title}
          </h3>
          <p className={`prose-body mt-4 ${featured ? "lg:mt-5 lg:text-[length:var(--t-lead)] lg:leading-[1.4]" : ""}`}>{lab.summary}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t-2 border-umber pt-5">
            <span className="inline-flex items-center gap-2 font-bold">
              Open the lab
              <span aria-hidden="true" className="transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1">
                →
              </span>
            </span>
            <span className="ml-auto text-[length:var(--t-small)] text-ink-2">
              <time dateTime={lab.date}>{formatLabDate(lab.date)}</time>
              {lab.tags.length > 0 && <> · {lab.tags.join(", ")}</>}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
