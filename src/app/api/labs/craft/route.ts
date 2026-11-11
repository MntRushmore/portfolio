import { combine, CraftError, dailyTarget, hashIp, starters } from "@/lib/craft";

/**
 * The crafting game's API (labs.rushilchopra.com/craft).
 * GET  → the starting elements and today's target.
 * POST { a, b } → what the two make together.
 */

const ALLOWED_ORIGIN = /^https:\/\/(labs\.)?(www\.)?rushilchopra\.com$|^http:\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/;

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET() {
  const [elements, daily] = await Promise.all([starters(), dailyTarget()]);
  return Response.json(
    { starters: elements, daily },
    // Today's target changes once a day; let the CDN hold it a few minutes.
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}

export async function POST(request: Request) {
  // Only this site's pages may use it: it's a game, not a free model API.
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGIN.test(origin)) {
    return Response.json({ error: "Not allowed." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON: { a, b }." }, { status: 400 });
  }
  const { a, b } = (body ?? {}) as { a?: unknown; b?: unknown };
  if (typeof a !== "string" || typeof b !== "string" || a.length > 60 || b.length > 60) {
    return Response.json({ error: "Pick two things to combine." }, { status: 400 });
  }

  try {
    const result = await combine(a, b, hashIp(clientIp(request)));
    return Response.json(result);
  } catch (error) {
    if (error instanceof CraftError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Craft: combine failed", error);
    return Response.json({ error: "Something fizzled. Try again." }, { status: 500 });
  }
}
