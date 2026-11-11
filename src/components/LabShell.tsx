import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { findLab, formatLabDate, labNumber, nextLab } from "@/lib/labs";

/**
 * The frame round every lab: one umber bar (back to the index, the lab's
 * number and name, what it is, the next one), then the lab itself filling the
 * rest of the screen. Drafts 404 on the live site.
 */
export function LabShell({ slug, children }: { slug: string; children: ReactNode }) {
  const lab = findLab(slug);
  if (!lab) notFound();
  const next = nextLab(slug);

  return (
    <div className="flex h-svh flex-col bg-umber">
      <header className="on-umber relative z-10 shrink-0 bg-umber text-plaster">
        <div className="flex min-h-[60px] items-center justify-between gap-3 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="inline-grid size-10 shrink-0 place-items-center rounded-full border-2 border-plaster text-[1.125rem] font-bold transition-colors duration-150 hover:bg-plaster hover:text-umber"
              aria-label="All labs"
              title="All labs"
            >
              <span aria-hidden="true">←</span>
            </Link>
            <span className="type-meta hidden shrink-0 rounded-full bg-persimmon px-3 py-1.5 text-umber sm:inline-block">
              Lab {labNumber(slug)}
            </span>
            <h1 className="truncate font-display text-[1.1875rem] font-black tracking-[-0.015em] [font-variation-settings:'wdth'_125] sm:text-[1.375rem]">
              {lab.title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <details className="lab-about">
              <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border-2 border-plaster px-4 text-[0.9375rem] font-bold transition-colors duration-150 hover:bg-plaster hover:text-umber [&::-webkit-details-marker]:hidden">
                About
              </summary>
              <div className="absolute inset-x-3 top-[calc(100%+8px)] rounded-[6px] border-2 border-umber bg-plaster p-5 text-umber shadow-[5px_5px_0_var(--color-umber)] sm:left-auto sm:right-4 sm:w-[400px]">
                <p className="type-sub">{lab.summary}</p>
                {lab.about?.map((para) => (
                  <p key={para.slice(0, 24)} className="mt-3 text-[length:var(--t-small)] leading-[1.55]">
                    {para}
                  </p>
                ))}
                <p className="mt-4 border-t-2 border-umber pt-3 text-[length:var(--t-small)] text-ink-2">
                  <time dateTime={lab.date}>{formatLabDate(lab.date)}</time>
                  {lab.tags.length > 0 && <> · {lab.tags.join(", ")}</>}
                  {lab.source && (
                    <>
                      {" · "}
                      <a href={lab.source} className="link font-semibold text-umber">
                        Source
                      </a>
                    </>
                  )}
                </p>
              </div>
            </details>
            {next && (
              <Link
                href={`/${next.slug}`}
                className="hidden min-h-10 items-center gap-1.5 rounded-full bg-plaster px-4 text-[0.9375rem] font-bold text-umber transition-colors duration-150 hover:bg-persimmon md:inline-flex"
              >
                Next: {next.title} <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
