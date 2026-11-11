import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { labs } from "@/content/labs";

/**
 * First-party analytics for labs.rushilchopra.com.
 *
 * Labs send small events to POST /api/labs/track (see public/lab-files/track.js);
 * the owner reads them at labs.rushilchopra.com/stats. Nothing here identifies a
 * person: no cookies, no raw IPs. A "visitor" is a hash of IP + browser + the
 * UTC date + a secret salt, so the same person is a new visitor every day.
 */

// ─── What a lab may send ────────────────────────────────────────────────────

/** The labs index page reports under this name. */
export const INDEX_LAB = "index";

/** Labs that exist as files but aren't listed in content/labs.ts yet. */
const UNLISTED_LABS = ["say-the-room"];

const NAME = /^[a-z0-9][a-z0-9_-]{0,39}$/;
const PROP_KEY = /^[a-z][a-z0-9_]{0,23}$/i;
const SESSION = /^[a-z0-9]{8,32}$/i;
const MAX_PROPS_BYTES = 1024;
const MAX_PROP_KEYS = 12;
const MAX_STRING = 80;

export type Props = Record<string, string | number | boolean>;
export type TrackEvent = {
  lab: string;
  event: string;
  props: Props;
  session: string | null;
  ref: string | null;
  path: string | null;
};

export function knownLab(slug: string): boolean {
  return slug === INDEX_LAB || UNLISTED_LABS.includes(slug) || labs.some((l) => l.slug === slug);
}

/** Strict: anything that isn't exactly the expected shape is dropped whole. */
export function parseEvent(input: unknown): TrackEvent | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const { lab, event, props, session, ref, path } = input as Record<string, unknown>;
  if (typeof lab !== "string" || !NAME.test(lab) || !knownLab(lab)) return null;
  if (typeof event !== "string" || !NAME.test(event)) return null;

  const clean: Props = {};
  if (props != null) {
    if (typeof props !== "object" || Array.isArray(props)) return null;
    const entries = Object.entries(props as Record<string, unknown>);
    if (entries.length > MAX_PROP_KEYS) return null;
    for (const [key, value] of entries) {
      if (!PROP_KEY.test(key)) return null;
      if (typeof value === "string") {
        if (value.length > MAX_STRING) return null;
        clean[key] = value;
      } else if (typeof value === "number") {
        if (!Number.isFinite(value)) return null;
        clean[key] = value;
      } else if (typeof value === "boolean") {
        clean[key] = value;
      } else return null;
    }
    if (Buffer.byteLength(JSON.stringify(clean)) > MAX_PROPS_BYTES) return null;
  }

  return {
    lab,
    event,
    props: clean,
    session: typeof session === "string" && SESSION.test(session) ? session : null,
    ref: typeof ref === "string" && ref.length <= 500 ? ref : null,
    path: typeof path === "string" && /^\/[\w\-./]{0,119}$/.test(path) ? path : null,
  };
}

// ─── Who sent it (without knowing who) ──────────────────────────────────────

const salt = () => process.env.ANALYTICS_SALT || "dev-only-analytics-salt";

/** Changes every UTC day, so visits can't be joined up across days. */
export function visitorHash(ip: string, userAgent: string, now = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${userAgent}|${day}|${salt()}`).digest("hex").slice(0, 32);
}

export function ipKey(ip: string): string {
  return createHash("sha256").update(`track:${ip}:${salt()}`).digest("hex").slice(0, 24);
}

export type Device = "phone" | "tablet" | "desktop" | "bot";

export function deviceClass(userAgent: string): Device {
  const ua = userAgent.toLowerCase();
  if (!ua || /bot|crawl|spider|slurp|preview|headless|lighthouse|curl|wget|python|monitor|scan/.test(ua)) return "bot";
  if (/ipad|tablet|kindle|silk|playbook/.test(ua) || (ua.includes("android") && !ua.includes("mobile"))) return "tablet";
  if (/mobi|iphone|ipod|android|windows phone/.test(ua)) return "phone";
  return "desktop";
}

/** Just the site a visit came from: "news.ycombinator.com". Our own pages don't count. */
export function referrerHost(ref: string | null, ownHost: string | null): string | null {
  if (!ref) return null;
  try {
    const url = new URL(ref);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const own = (ownHost ?? "").toLowerCase().split(":")[0];
    if (!host || host === own || host.endsWith("rushilchopra.com") || host.endsWith("localhost")) return null;
    return host.slice(0, 80);
  } catch {
    return null;
  }
}

/** Rows written anywhere but production are marked, and kept off the dashboard. */
export const isTestEnv = () =>
  process.env.VERCEL_ENV ? process.env.VERCEL_ENV !== "production" : process.env.NODE_ENV !== "production";

// Enough for real play, too little to fill the table. Per server instance, like the Jev lab's.
const hits = new Map<string, number[]>();
export function allowHit(key: string, perWindow = 60, perHour = 1500): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 3_600_000);
  const inWindow = recent.filter((t) => now - t < 10_000).length;
  if (inWindow >= perWindow || recent.length >= perHour) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) hits.clear(); // keep memory bounded
  return true;
}

const db = () => neon(process.env.DATABASE_URL!);

export async function saveEvent(row: {
  lab: string;
  event: string;
  props: Props;
  visitor: string;
  session: string | null;
  country: string | null;
  device: Device;
  referrer: string | null;
  path: string | null;
}) {
  const sql = db();
  await sql`
    insert into lab_events (lab, event, props, visitor, session, country, device, referrer, path)
    values (${row.lab}, ${row.event}, ${JSON.stringify(row.props)}::jsonb, ${row.visitor}, ${row.session},
            ${row.country}, ${row.device}, ${row.referrer}, ${row.path})
  `;
}

// ─── The dashboard's lock ───────────────────────────────────────────────────

export const STATS_COOKIE = "labs_stats";
const STATS_DAYS = 30;

const sign = (expires: number, key: string) => createHmac("sha256", key).update(`labs-stats:${expires}`).digest("hex");

/** Compares in constant time, whatever the lengths. */
function same(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function keyMatches(given: string): boolean {
  const key = process.env.ANALYTICS_KEY;
  return !!key && same(given, key);
}

export function newStatsToken(): { value: string; maxAge: number } {
  const maxAge = STATS_DAYS * 86_400;
  const expires = Math.floor(Date.now() / 1000) + maxAge;
  return { value: `${expires}.${sign(expires, process.env.ANALYTICS_KEY!)}`, maxAge };
}

export function validStatsToken(token: string | undefined): boolean {
  const key = process.env.ANALYTICS_KEY;
  if (!key || !token) return false;
  const [exp, mac] = token.split(".");
  const expires = Number(exp);
  if (!Number.isInteger(expires) || !mac || expires * 1000 < Date.now()) return false;
  return same(mac, sign(expires, key));
}

// ─── The dashboard's numbers ────────────────────────────────────────────────

export const RANGES = {
  "24h": { label: "24 hours", hours: 24 },
  "7d": { label: "7 days", hours: 24 * 7 },
  "30d": { label: "30 days", hours: 24 * 30 },
  all: { label: "All time", hours: null },
} as const;
export type RangeKey = keyof typeof RANGES;

/** The one event per lab that says "they actually played". */
export const KEY_EVENTS: Record<string, { event: string; label: string }> = {
  "marble-run": { event: "play", label: "pressed play" },
  "sand-world": { event: "draw", label: "drew something" },
  "heavy-type": { event: "custom_text", label: "set their own words" },
  "say-the-room": { event: "item", label: "furnished a room" },
};

export function labTitle(slug: string): string {
  if (slug === INDEX_LAB) return "Labs index";
  return labs.find((l) => l.slug === slug)?.title ?? slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export type Bucket = { t: string; visitors: number; sessions: number; views: number };
export type LabRow = {
  lab: string;
  views: number;
  visitors: number;
  sessions: number;
  avgEngaged: number;
  medianEngaged: number;
  keyRate: number | null;
};
export type Count = { name: string; count: number };
export type Stats = {
  totals: { visitors: number; sessions: number; views: number; events: number; avgEngaged: number };
  unit: "hour" | "day";
  series: Bucket[];
  labs: LabRow[];
  events: { lab: string; event: string; count: number; sessions: number }[];
  props: { event: string; key: string; value: string; count: number; sessions: number }[];
  countries: Count[];
  devices: Count[];
  referrers: Count[];
  live: { visitors: number; byLab: Count[] };
};

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/**
 * Everything the dashboard shows, for one range. `detailLab` picks the lab whose
 * prop values are broken down. A "session" is one browser tab; when a browser
 * gives us no session id we fall back to the day's visitor hash.
 */
export async function getStats(range: RangeKey, detailLab: string | null, test: boolean): Promise<Stats> {
  const sql = db();
  const hours = RANGES[range].hours;
  const unit: "hour" | "day" = range === "24h" ? "hour" : "day";
  const now = Date.now();
  // Whole buckets, so the chart's first column isn't a partial one.
  const since = hours == null ? new Date(0) : new Date(Math.floor((now - hours * HOUR) / (unit === "hour" ? HOUR : DAY) + 1) * (unit === "hour" ? HOUR : DAY));
  const from = since.toISOString();

  // $1 = from, $2 = test rows instead of real ones
  const scope = `created_at >= $1::timestamptz and device <> 'bot' and coalesce((props->>'test')::boolean, false) = $2`;
  const sk = `coalesce(session, 'v:' || visitor)`;
  const bucket = `date_trunc('${unit}', created_at at time zone 'UTC')`;
  const engaged = `case when event = 'engaged' and jsonb_typeof(props->'s') = 'number' then least((props->>'s')::numeric, 3600) end`;
  const q = <T>(text: string, params: unknown[] = [from, test]) => sql.query(text, params) as Promise<T[]>;

  const [totals, perBucket, visitorSum, labRows, labVisitors, events, props, countries, devices, referrers, live] = await Promise.all([
    q<{ sessions: number; views: number; events: number }>(
      `select count(distinct ${sk})::int as sessions, (count(*) filter (where event = 'view'))::int as views, count(*)::int as events
       from lab_events where ${scope}`,
    ),
    q<{ t: string; visitors: number; sessions: number; views: number }>(
      `select to_char(${bucket}, 'YYYY-MM-DD"T"HH24:00:00"Z"') as t, count(distinct visitor)::int as visitors,
              count(distinct ${sk})::int as sessions, (count(*) filter (where event = 'view'))::int as views
       from lab_events where ${scope} group by 1 order by 1`,
    ),
    // Visitors are only distinct within a day, so a range's total is the sum of its days.
    q<{ visitors: number }>(
      `select coalesce(sum(c), 0)::int as visitors from (
         select count(distinct visitor) as c from lab_events where ${scope}
         group by date_trunc('day', created_at at time zone 'UTC')) d`,
    ),
    q<{ lab: string; views: number; sessions: number; avg: number; median: number; }>(
      `with per as (
         select lab, ${sk} as sk, count(*) filter (where event = 'view') as views, coalesce(sum(${engaged}), 0) as secs
         from lab_events where ${scope} group by 1, 2)
       select lab, sum(views)::int as views, count(*)::int as sessions, avg(secs)::float as avg,
              (percentile_cont(0.5) within group (order by secs))::float as median
       from per group by lab order by sessions desc, lab`,
    ),
    q<{ lab: string; visitors: number }>(
      `select lab, sum(c)::int as visitors from (
         select lab, count(distinct visitor) as c from lab_events where ${scope}
         group by lab, date_trunc('day', created_at at time zone 'UTC')) d group by lab`,
    ),
    q<{ lab: string; event: string; count: number; sessions: number }>(
      `select lab, event, count(*)::int as count, count(distinct ${sk})::int as sessions
       from lab_events where ${scope} group by 1, 2 order by count desc`,
    ),
    detailLab
      ? q<{ event: string; key: string; value: string; count: number; sessions: number }>(
          `select event, p.key, p.value #>> '{}' as value, count(*)::int as count, count(distinct ${sk})::int as sessions
           from lab_events, jsonb_each(props) p
           where ${scope} and lab = $3 and event not in ('view', 'engaged') and p.key <> 'test'
             and jsonb_typeof(p.value) in ('string', 'boolean')
           group by 1, 2, 3 order by count desc limit 400`,
          [from, test, detailLab],
        )
      : Promise.resolve([]),
    q<Count>(
      `select coalesce(country, 'Unknown') as name, count(distinct ${sk})::int as count
       from lab_events where ${scope} group by 1 order by count desc, name limit 12`,
    ),
    q<Count>(
      `select coalesce(device, 'unknown') as name, count(distinct ${sk})::int as count
       from lab_events where ${scope} group by 1 order by count desc, name`,
    ),
    q<Count>(
      `select coalesce(referrer, 'Direct or unknown') as name, count(distinct ${sk})::int as count
       from lab_events where ${scope} group by 1 order by count desc, name limit 12`,
    ),
    q<Count>(
      `select lab as name, count(distinct visitor)::int as count
       from lab_events where created_at >= now() - interval '30 minutes' and device <> 'bot'
         and coalesce((props->>'test')::boolean, false) = $1
       group by rollup (lab) order by count desc`,
      [test],
    ),
  ]);

  // Average time per session, across every lab it opened.
  const [{ avg_engaged }] = await q<{ avg_engaged: number | null }>(
    `select avg(secs)::float as avg_engaged from (
       select coalesce(sum(${engaged}), 0) as secs from lab_events where ${scope} group by ${sk}) s`,
  );

  // Fill the gaps, so quiet hours and days still take up their place on the axis.
  const step = unit === "hour" ? HOUR : DAY;
  const found = new Map(perBucket.map((b) => [Date.parse(b.t), b]));
  const first = hours == null ? (perBucket.length ? Date.parse(perBucket[0].t) : Math.floor(now / step) * step) : since.getTime();
  const series: Bucket[] = [];
  for (let t = Math.floor(first / step) * step; t <= now; t += step) {
    const b = found.get(t);
    series.push({ t: new Date(t).toISOString(), visitors: b?.visitors ?? 0, sessions: b?.sessions ?? 0, views: b?.views ?? 0 });
  }

  const visitorsBy = new Map(labVisitors.map((v) => [v.lab, v.visitors]));
  const labsOut: LabRow[] = labRows.map((r) => {
    const key = KEY_EVENTS[r.lab];
    const hit = key ? (events.find((e) => e.lab === r.lab && e.event === key.event)?.sessions ?? 0) : 0;
    return {
      lab: r.lab,
      views: r.views,
      visitors: visitorsBy.get(r.lab) ?? 0,
      sessions: r.sessions,
      avgEngaged: r.avg ?? 0,
      medianEngaged: r.median ?? 0,
      keyRate: key && r.sessions > 0 ? hit / r.sessions : null,
    };
  });

  const total = live.find((l) => l.name == null);
  return {
    totals: {
      visitors: visitorSum[0]?.visitors ?? 0,
      sessions: totals[0]?.sessions ?? 0,
      views: totals[0]?.views ?? 0,
      events: totals[0]?.events ?? 0,
      avgEngaged: avg_engaged ?? 0,
    },
    unit,
    series,
    labs: labsOut,
    events,
    props,
    countries,
    devices,
    referrers,
    live: { visitors: total?.count ?? 0, byLab: live.filter((l) => l.name != null) },
  };
}
