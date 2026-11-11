import {
  allowHit,
  deviceClass,
  ipKey,
  isTestEnv,
  parseEvent,
  referrerHost,
  saveEvent,
  visitorHash,
} from "@/lib/analytics";

/**
 * POST { lab, event, props, session, ref, path } → 204. One analytics event from
 * a lab (see public/lab-files/track.js). Sent as JSON, or as text by sendBeacon.
 * Always answers 204 once the request is allowed: the page has nothing to do
 * with the result, and a lab must never break because of its counter.
 */

const ALLOWED_ORIGIN = /^https:\/\/(labs\.)?(www\.)?rushilchopra\.com$|^http:\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/;
const MAX_BODY = 4096;
const done = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

export async function POST(request: Request) {
  const h = request.headers;
  const origin = h.get("origin");
  if (origin && !ALLOWED_ORIGIN.test(origin)) return new Response(null, { status: 403 });
  const site = h.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "same-site" && site !== "none") return new Response(null, { status: 403 });

  // People who ask not to be tracked aren't. Nothing is stored.
  if (h.get("dnt") === "1" || h.get("sec-gpc") === "1") return done();

  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!allowHit(ipKey(ip))) return new Response(null, { status: 429 });

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return new Response(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const event = parseEvent(body);
  if (!event) return new Response(null, { status: 400 });

  const userAgent = h.get("user-agent") ?? "";
  const device = deviceClass(userAgent);
  if (device === "bot") return done();

  // The page the event came from, if the lab didn't say.
  let path = event.path;
  if (!path) {
    try {
      path = new URL(h.get("referer") ?? "").pathname.slice(0, 120);
    } catch {}
  }
  const country = h.get("x-vercel-ip-country");

  try {
    await saveEvent({
      lab: event.lab,
      event: event.event,
      props: isTestEnv() ? { ...event.props, test: true } : event.props,
      visitor: visitorHash(ip, userAgent),
      session: event.session,
      country: country && /^[A-Z]{2}$/.test(country) ? country : null,
      device,
      referrer: referrerHost(event.ref, h.get("host")),
      path,
    });
  } catch (error) {
    console.error("Labs analytics: couldn't save an event", error);
  }
  return done();
}
