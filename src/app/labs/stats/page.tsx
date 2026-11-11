import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  getStats,
  INDEX_LAB,
  KEY_EVENTS,
  labTitle,
  RANGES,
  STATS_COOKIE,
  validStatsToken,
  type Count,
  type RangeKey,
  type Stats,
} from "@/lib/analytics";
import { lockStats } from "./actions";
import { StatsLogin } from "./StatsLogin";
import { VisitorsChart } from "./VisitorsChart";

/**
 * labs.rushilchopra.com/stats: the owner's private dashboard. Locked with
 * ANALYTICS_KEY, never cached, never indexed, and not linked from anywhere.
 */

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Stats",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: null },
};

const num = new Intl.NumberFormat("en-GB");
const regions = new Intl.DisplayNames(["en"], { type: "region" });

function compact(n: number): string {
  return n < 10_000 ? num.format(n) : new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
function duration(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
}
const percent = (share: number) => `${Math.round(share * 100)}%`;
const words = (name: string) => name.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
function country(code: string): string {
  try {
    return /^[A-Z]{2}$/.test(code) ? (regions.of(code) ?? code) : code;
  } catch {
    return code;
  }
}

export default async function StatsPage({ searchParams }: PageProps<"/labs/stats">) {
  const open = validStatsToken((await cookies()).get(STATS_COOKIE)?.value);
  if (!open) return <Locked configured={!!process.env.ANALYTICS_KEY} />;

  const query = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const range: RangeKey = (one(query.range) ?? "") in RANGES ? (one(query.range) as RangeKey) : "7d";
  const test = one(query.test) === "1";
  const wanted = one(query.lab);
  const picked = wanted && /^[a-z0-9-]{1,40}$/.test(wanted) ? wanted : null;

  let stats: Stats;
  try {
    stats = await getStats(range, picked, test);
    // No lab picked: break down the busiest one.
    if (!picked) {
      const busiest = stats.labs.find((l) => l.lab !== INDEX_LAB)?.lab;
      if (busiest) stats = await getStats(range, busiest, test);
    }
  } catch (error) {
    console.error("Labs stats: query failed", error);
    return (
      <Frame>
        <p className="type-lead mt-10 max-w-[30ch]">The numbers didn’t load. Check the database and try again.</p>
      </Frame>
    );
  }

  const detail = picked ?? stats.labs.find((l) => l.lab !== INDEX_LAB)?.lab ?? null;
  const href = (next: { range?: RangeKey; lab?: string | null; test?: boolean }) => {
    const p = new URLSearchParams();
    const r = next.range ?? range;
    const l = next.lab === undefined ? picked : next.lab;
    if (r !== "7d") p.set("range", r);
    if (l) p.set("lab", l);
    if (next.test ?? test) p.set("test", "1");
    const s = p.toString();
    return s ? `?${s}` : "?";
  };

  const { totals } = stats;
  const unitWord = stats.unit === "hour" ? "hour" : "day";
  const detailRow = stats.labs.find((l) => l.lab === detail);
  const detailEvents = stats.events.filter((e) => e.lab === detail && e.event !== "engaged");

  // "element → name": the values each event was sent with, most common first.
  const groups = new Map<string, { title: string; hint: string; total: number; items: Count[] }>();
  for (const p of stats.props) {
    const id = `${p.event}.${p.key}`;
    const g = groups.get(id) ?? { title: words(p.event), hint: p.key, total: 0, items: [] };
    g.total += p.count;
    g.items.push({ name: p.value, count: p.count });
    groups.set(id, g);
  }
  const propGroups = [...groups.values()].sort((a, b) => b.total - a.total).slice(0, 9);

  return (
    <Frame
      live={
        <span
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-plaster px-3.5 text-[0.9375rem] font-bold text-umber"
          title={stats.live.byLab.map((l) => `${labTitle(l.name)}: ${l.count}`).join(", ") || undefined}
        >
          <i className={`size-2.5 rounded-full ${stats.live.visitors > 0 ? "bg-brick" : "bg-ink-2/40"}`} aria-hidden="true" />
          <span className="tabular-nums">{num.format(stats.live.visitors)}</span>
          <span className="font-semibold">
            <span className="sm:hidden">now</span>
            <span className="hidden sm:inline">in the last 30 minutes</span>
          </span>
        </span>
      }
      signOut
    >
      {/* One row of filters; everything below is cut to the same range. */}
      <nav aria-label="Time range" className="mt-8 flex flex-wrap items-center gap-2 sm:mt-10">
        {(Object.keys(RANGES) as RangeKey[]).map((key) => (
          <Link
            key={key}
            href={href({ range: key })}
            scroll={false}
            aria-current={key === range ? "true" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border-2 border-umber px-4 text-[0.9375rem] font-bold transition-colors duration-150 ${
              key === range ? "bg-umber text-plaster" : "hover:bg-plaster-2"
            }`}
          >
            {RANGES[key].label}
          </Link>
        ))}
        {test && (
          <span className="type-meta ml-1 rounded-full bg-brick px-3 py-1.5 text-plaster">Test data</span>
        )}
      </nav>

      {totals.events === 0 ? (
        <p className="type-lead mt-12 max-w-[32ch] text-ink-2">
          Nothing recorded in this range yet. Open a lab and it will show up here.
        </p>
      ) : (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Tile label="Visitors" value={compact(totals.visitors)} note="Each person counts once a day" />
            <Tile label="Sessions" value={compact(totals.sessions)} note="One browser tab, start to finish" />
            <Tile label="Views" value={compact(totals.views)} note="Labs and the index opened" />
            <Tile label="Average time" value={duration(totals.avgEngaged)} note="Active time per session" />
          </dl>

          <Card className="mt-3 sm:mt-4">
            <h2 className="type-sub">Visitors per {unitWord}</h2>
            <p className="mt-1 text-[length:var(--t-small)] text-ink-2">
              {stats.unit === "hour" ? "Each hour of the last 24, in UTC." : "Days run midnight to midnight, UTC."}
            </p>
            <div className="mt-2">
              <VisitorsChart series={stats.series} unit={stats.unit} />
            </div>
          </Card>

          {/* ─── Every lab, side by side ─── */}
          <section aria-labelledby="labs-h" className="mt-14 sm:mt-20">
            <h2 id="labs-h" className="type-h3">
              Each lab
            </h2>
            <p className="mt-3 max-w-[60ch] text-[length:var(--t-small)] text-ink-2">
              Time is active time: the lab on screen and touched in the last 30 seconds. Pick a lab to see what people did in it.
            </p>

            {/* Wide screens: a table. */}
            <div className="mt-6 hidden rounded-[6px] border-2 border-umber md:block">
              <table className="w-full border-collapse text-left text-[length:var(--t-small)]">
                <thead>
                  <tr className="border-b-2 border-umber">
                    <th className="type-meta px-4 py-3">Lab</th>
                    {["Views", "Visitors", "Sessions", "Avg time", "Median time"].map((h) => (
                      <th key={h} className="type-meta px-4 py-3 text-right">
                        {h}
                      </th>
                    ))}
                    <th className="type-meta px-4 py-3">Played</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.labs.map((l) => (
                    <tr
                      key={l.lab}
                      className={`border-b border-plaster-2 last:border-0 ${l.lab === detail ? "bg-plaster-2/60" : ""}`}
                    >
                      <th scope="row" className="px-4 py-3 text-[length:var(--t-ui)] font-bold">
                        {l.lab === INDEX_LAB ? (
                          labTitle(l.lab)
                        ) : (
                          <Link href={`${href({ lab: l.lab })}#detail`} className="link" aria-current={l.lab === detail ? "true" : undefined}>
                            {labTitle(l.lab)}
                          </Link>
                        )}
                      </th>
                      <td className="px-4 py-3 text-right tabular-nums">{num.format(l.views)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{num.format(l.visitors)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{num.format(l.sessions)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{duration(l.avgEngaged)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{duration(l.medianEngaged)}</td>
                      <td className="px-4 py-3">
                        {l.keyRate == null ? (
                          <span className="text-ink-2">–</span>
                        ) : (
                          <Rate share={l.keyRate} label={KEY_EVENTS[l.lab].label} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phones: one card per lab. */}
            <ul className="mt-6 grid gap-3 md:hidden">
              {stats.labs.map((l) => (
                <li key={l.lab} className={`rounded-[6px] border-2 border-umber p-4 ${l.lab === detail ? "bg-plaster-2/60" : ""}`}>
                  <h3 className="text-[length:var(--t-ui)] font-bold">
                    {l.lab === INDEX_LAB ? (
                      labTitle(l.lab)
                    ) : (
                      <Link href={`${href({ lab: l.lab })}#detail`} className="link inline-flex min-h-11 items-center">
                        {labTitle(l.lab)}
                      </Link>
                    )}
                  </h3>
                  <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-3 text-[length:var(--t-small)]">
                    {[
                      ["Views", num.format(l.views)],
                      ["Visitors", num.format(l.visitors)],
                      ["Sessions", num.format(l.sessions)],
                      ["Avg time", duration(l.avgEngaged)],
                      ["Median", duration(l.medianEngaged)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-ink-2">{k}</dt>
                        <dd className="font-bold tabular-nums">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {l.keyRate != null && (
                    <div className="mt-3">
                      <Rate share={l.keyRate} label={KEY_EVENTS[l.lab].label} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* ─── One lab, close up ─── */}
          {detail && (
            <section id="detail" aria-labelledby="detail-h" className="mt-14 sm:mt-20">
              <p className="type-meta text-ink-2">Inside one lab</p>
              <h2 id="detail-h" className="type-h3 mt-2">
                {labTitle(detail)}
              </h2>
              <nav aria-label="Lab" className="mt-5 flex flex-wrap gap-2">
                {stats.labs
                  .filter((l) => l.lab !== INDEX_LAB)
                  .map((l) => (
                    <Link
                      key={l.lab}
                      href={`${href({ lab: l.lab })}#detail`}
                      aria-current={l.lab === detail ? "true" : undefined}
                      className={`inline-flex min-h-11 items-center rounded-full border-2 border-umber px-4 text-[0.9375rem] font-bold transition-colors duration-150 ${
                        l.lab === detail ? "bg-umber text-plaster" : "hover:bg-plaster-2"
                      }`}
                    >
                      {labTitle(l.lab)}
                    </Link>
                  ))}
              </nav>

              <div className="mt-6 grid gap-3 sm:gap-4 lg:grid-cols-3">
                <Card>
                  <h3 className="type-sub">Events</h3>
                  <p className="mt-1 text-[length:var(--t-small)] text-ink-2">
                    How often each happened, and the share of {num.format(detailRow?.sessions ?? 0)} sessions it happened in.
                  </p>
                  <Bars
                    className="mt-5"
                    items={detailEvents.map((e) => ({
                      name: words(e.event),
                      count: e.count,
                      note: detailRow?.sessions ? `${percent(e.sessions / detailRow.sessions)} of sessions` : undefined,
                    }))}
                    empty="No events yet."
                  />
                </Card>
                {propGroups.length === 0 ? (
                  <Card className="lg:col-span-2">
                    <h3 className="type-sub">What people picked</h3>
                    <p className="mt-3 text-[length:var(--t-small)] text-ink-2">
                      Nothing with details yet. Tunes, elements and room items show up here once people use them.
                    </p>
                  </Card>
                ) : (
                  propGroups.map((g) => (
                    <Card key={`${g.title}.${g.hint}`}>
                      <h3 className="type-sub">{g.title}</h3>
                      <p className="mt-1 text-[length:var(--t-small)] text-ink-2">By {words(g.hint).toLowerCase()}</p>
                      <Bars className="mt-5" items={g.items.slice(0, 8)} />
                      {g.items.length > 8 && (
                        <p className="mt-3 text-[length:var(--t-small)] text-ink-2">and {g.items.length - 8} more</p>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </section>
          )}

          {/* ─── Who and where from ─── */}
          <section aria-labelledby="who-h" className="mt-14 sm:mt-20">
            <h2 id="who-h" className="type-h3">
              Who came
            </h2>
            <p className="mt-3 text-[length:var(--t-small)] text-ink-2">Counted in sessions, across every lab.</p>
            <div className="mt-6 grid gap-3 sm:gap-4 lg:grid-cols-3">
              <Card>
                <h3 className="type-sub">Countries</h3>
                <Bars className="mt-5" items={stats.countries.map((c) => ({ ...c, name: country(c.name) }))} />
              </Card>
              <Card>
                <h3 className="type-sub">Devices</h3>
                <Bars className="mt-5" items={stats.devices.map((d) => ({ ...d, name: words(d.name) }))} />
              </Card>
              <Card>
                <h3 className="type-sub">Came from</h3>
                <Bars className="mt-5" items={stats.referrers} />
              </Card>
            </div>
          </section>
        </>
      )}

      <footer className="mt-14 max-w-[70ch] border-t-2 border-umber pt-5 text-[length:var(--t-small)] leading-[1.55] text-ink-2 sm:mt-20">
        <p>
          No cookies and no stored IP addresses. A visitor is a hash of IP, browser and the date, so the same person is new each
          day: over a longer range, “visitors” is each day’s count added up, not unique people. Browsers that ask not to be
          tracked aren’t, and bots are left out.
        </p>
        <p className="mt-3">
          <Link href={href({ test: !test })} className="link font-semibold text-umber">
            {test ? "Back to real data" : "Show test data"}
          </Link>{" "}
          (events from local and preview builds are kept apart).
        </p>
      </footer>
    </Frame>
  );
}

// ─── Pieces ─────────────────────────────────────────────────────────────────

function Frame({ children, live, signOut }: { children: ReactNode; live?: ReactNode; signOut?: boolean }) {
  return (
    <div className="min-h-svh bg-plaster">
      <header className="on-umber bg-umber text-plaster">
        <div className="wrap flex min-h-[60px] items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="inline-grid size-10 shrink-0 place-items-center rounded-full border-2 border-plaster text-[1.125rem] font-bold transition-colors duration-150 hover:bg-plaster hover:text-umber"
              aria-label="All labs"
              title="All labs"
            >
              <span aria-hidden="true">←</span>
            </Link>
            <h1 className="truncate font-display text-[1.1875rem] font-black tracking-[-0.015em] [font-variation-settings:'wdth'_125] sm:text-[1.375rem]">
              Stats
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {live}
            {signOut && (
              <form action={lockStats}>
                <button
                  type="submit"
                  className="inline-flex min-h-10 cursor-pointer items-center rounded-full border-2 border-plaster px-3.5 text-[0.9375rem] font-bold transition-colors duration-150 hover:bg-plaster hover:text-umber"
                >
                  Lock
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="wrap pb-20 sm:pb-28">{children}</main>
    </div>
  );
}

function Locked({ configured }: { configured: boolean }) {
  return (
    <Frame>
      <div className="pt-14 sm:pt-20">
        <h2 className="type-h3">Private</h2>
        {configured ? (
          <StatsLogin />
        ) : (
          <p className="mt-4 max-w-[40ch] text-ink-2">This page isn’t set up here.</p>
        )}
      </div>
    </Frame>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[6px] border-2 border-umber p-4 sm:p-6 ${className}`}>{children}</div>;
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[6px] border-2 border-umber p-4 sm:p-5">
      <dt className="text-[length:var(--t-small)] font-semibold text-ink-2">{label}</dt>
      <dd className="mt-1 text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[2.5rem]">{value}</dd>
      <dd className="mt-1.5 text-[0.8125rem] leading-snug text-ink-2">{note}</dd>
    </div>
  );
}

/** Ranked thin bars, one colour: name and number on a line, the bar under them. */
function Bars({
  items,
  className = "",
  empty = "Nothing yet.",
}: {
  items: (Count & { note?: string })[];
  className?: string;
  empty?: string;
}) {
  if (items.length === 0) return <p className={`text-[length:var(--t-small)] text-ink-2 ${className}`}>{empty}</p>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ol className={`grid gap-3.5 ${className}`}>
      {items.map((item) => (
        <li key={item.name}>
          <div className="flex items-baseline justify-between gap-3 text-[length:var(--t-small)] leading-tight">
            <span className="min-w-0 break-words font-semibold">{item.name}</span>
            <span className="shrink-0 text-right tabular-nums">
              {item.note && <span className="mr-2 text-ink-2">{item.note}</span>}
              <strong>{num.format(item.count)}</strong>
            </span>
          </div>
          <div className="mt-1.5 h-2" aria-hidden="true">
            <i className="block h-full min-w-[3px] rounded-r-[4px] bg-brick" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** "62% pressed play", with a thin meter: brick on a lighter track. */
function Rate({ share, label }: { share: number; label: string }) {
  return (
    <div className="min-w-[9rem]">
      <p className="text-[length:var(--t-small)] leading-tight">
        <strong className="tabular-nums">{percent(share)}</strong> <span className="text-ink-2">{label}</span>
      </p>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-plaster-2" aria-hidden="true">
        <i className="block h-full rounded-full bg-brick" style={{ width: `${Math.min(100, share * 100)}%` }} />
      </div>
    </div>
  );
}
