"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Bucket } from "@/lib/analytics";

/**
 * Visitors per day (or per hour, for the last 24 hours) as thin columns.
 * One series, so one colour: brick on plaster. Hover, touch or the arrow keys
 * show a bucket's numbers; the table underneath holds the same values.
 */

const PLOT = 200; // px, the plot's height

/** A round number at or above the peak, and the ticks up to it. */
function scale(max: number): { top: number; ticks: number[] } {
  if (max <= 4) return { top: 4, ticks: [0, 2, 4] };
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].map((m) => (m * pow) / 2).find((s) => max / s <= 4) ?? pow * 5;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(Math.round(v));
  return { top, ticks };
}

const fmt = new Intl.NumberFormat("en-GB");
const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const hourFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export function VisitorsChart({ series, unit }: { series: Bucket[]; unit: "hour" | "day" }) {
  const [active, setActive] = useState<number | null>(null);
  const n = series.length;
  const peak = Math.max(0, ...series.map((b) => b.visitors));
  const peakAt = series.findIndex((b) => b.visitors === peak);
  const { top, ticks } = scale(peak);

  const short = (b: Bucket) => (unit === "hour" ? hourFmt.format(new Date(b.t)) : dayFmt.format(new Date(b.t)));
  const long = (b: Bucket) =>
    unit === "hour" ? `${dayFmt.format(new Date(b.t))}, ${hourFmt.format(new Date(b.t))} UTC` : dayFmt.format(new Date(b.t));

  // About six date labels, whatever the range.
  const every = Math.max(1, Math.ceil(n / 6));
  const labelled = series.map((_, i) => i).filter((i) => (n - 1 - i) % every === 0);

  function point(e: PointerEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    setActive(Math.max(0, Math.min(n - 1, Math.floor(((e.clientX - box.left) / box.width) * n))));
  }
  function key(e: KeyboardEvent<HTMLDivElement>) {
    const move = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (e.key === "Escape") return setActive(null);
    if (e.key === "Home") return setActive(0);
    if (e.key === "End") return setActive(n - 1);
    if (!move) return;
    e.preventDefault();
    setActive((i) => Math.max(0, Math.min(n - 1, (i ?? (move > 0 ? -1 : n)) + move)));
  }

  const shown = active != null ? series[active] : null;
  const at = active != null ? ((active + 0.5) / n) * 100 : 0;

  return (
    <div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        {/* y axis */}
        <div className="relative mt-6 w-7 text-right text-[0.8125rem] tabular-nums text-ink-2" style={{ height: PLOT }} aria-hidden="true">
          {ticks.map((v) => (
            <span key={v} className="absolute right-0 translate-y-1/2 leading-none" style={{ bottom: `${(v / top) * 100}%` }}>
              {fmt.format(v)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 pt-6">
          <div
            className="relative cursor-crosshair touch-pan-y rounded-[2px] outline-offset-4"
            style={{ height: PLOT }}
            tabIndex={0}
            role="group"
            aria-label={`Visitors per ${unit}. Use the left and right arrow keys to read each ${unit}.`}
            onPointerMove={point}
            onPointerDown={point}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
            onKeyDown={key}
            onBlur={() => setActive(null)}
          >
            {ticks.map((v) => (
              <i
                key={v}
                className={`absolute inset-x-0 h-px ${v === 0 ? "bg-umber" : "bg-plaster-2"}`}
                style={{ bottom: `${(v / top) * 100}%` }}
                aria-hidden="true"
              />
            ))}
            {shown && <i className="absolute inset-y-0 w-px bg-umber/40" style={{ left: `${at}%` }} aria-hidden="true" />}

            <div className="absolute inset-0 flex items-end" aria-hidden="true">
              {series.map((b, i) => (
                <div key={b.t} className="relative flex h-full min-w-0 flex-1 items-end justify-center">
                  {b.visitors > 0 && (
                    <i
                      className={`block w-[calc(100%-2px)] max-w-[24px] ${n > 90 ? "rounded-t-[1px]" : "rounded-t-[4px]"} ${
                        active === i ? "bg-umber" : "bg-brick"
                      }`}
                      style={{ height: `max(3px, ${(b.visitors / top) * 100}%)` }}
                    />
                  )}
                  {/* One direct label: the peak. The rest are on the axis, the tooltip and the table. */}
                  {i === peakAt && peak > 0 && active == null && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 pb-1 text-[0.8125rem] font-bold leading-none tabular-nums"
                      style={{ bottom: `${(b.visitors / top) * 100}%` }}
                    >
                      {fmt.format(b.visitors)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {shown && (
              <div
                className="pointer-events-none absolute bottom-[calc(100%-8px)] z-10 w-max min-w-[9.5rem] rounded-[4px] border-2 border-umber bg-plaster px-3 py-2 text-[0.875rem] leading-snug shadow-[3px_3px_0_var(--color-umber)]"
                style={{ left: `${at}%`, transform: `translateX(-${Math.max(8, Math.min(92, at))}%)` }}
                role="status"
              >
                <p className="font-semibold text-ink-2">{long(shown)}</p>
                <p className="mt-1 flex items-center gap-2">
                  <i className="h-[3px] w-3 rounded-full bg-brick" aria-hidden="true" />
                  <strong className="text-[1.0625rem] tabular-nums">{fmt.format(shown.visitors)}</strong>
                  <span className="text-ink-2">{shown.visitors === 1 ? "visitor" : "visitors"}</span>
                </p>
                <p className="mt-0.5 text-ink-2">
                  <strong className="tabular-nums text-umber">{fmt.format(shown.sessions)}</strong> sessions ·{" "}
                  <strong className="tabular-nums text-umber">{fmt.format(shown.views)}</strong> views
                </p>
              </div>
            )}
          </div>

          {/* x axis */}
          <div className="relative mt-2 h-5 text-[0.8125rem] tabular-nums text-ink-2" aria-hidden="true">
            {labelled.map((i) => (
              <span
                key={i}
                className="absolute top-0 whitespace-nowrap leading-none"
                style={{
                  left: `${((i + 0.5) / n) * 100}%`,
                  transform: `translateX(-${i === n - 1 ? 100 : i === 0 ? 0 : 50}%)`,
                  marginLeft: i === n - 1 ? `${50 / n}%` : i === 0 ? `-${50 / n}%` : 0,
                }}
              >
                {short(series[i])}
              </span>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-4 text-[length:var(--t-small)]">
        <summary className="link inline-flex min-h-11 cursor-pointer items-center font-semibold">Show as a table</summary>
        <div className="mt-2 max-h-[22rem] overflow-auto rounded-[4px] border-2 border-umber">
          <table className="w-full border-collapse text-left tabular-nums">
            <thead className="sticky top-0 bg-plaster">
              <tr className="border-b-2 border-umber">
                <th className="px-3 py-2 font-bold">{unit === "hour" ? "Hour (UTC)" : "Day (UTC)"}</th>
                <th className="px-3 py-2 text-right font-bold">Visitors</th>
                <th className="px-3 py-2 text-right font-bold">Sessions</th>
                <th className="px-3 py-2 text-right font-bold">Views</th>
              </tr>
            </thead>
            <tbody>
              {[...series].reverse().map((b) => (
                <tr key={b.t} className="border-b border-plaster-2 last:border-0">
                  <td className="px-3 py-1.5">{long(b)}</td>
                  <td className="px-3 py-1.5 text-right">{fmt.format(b.visitors)}</td>
                  <td className="px-3 py-1.5 text-right">{fmt.format(b.sessions)}</td>
                  <td className="px-3 py-1.5 text-right">{fmt.format(b.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
