import { createHash } from "node:crypto";
import { allow, decideRoom, MAX_TRANSCRIPT } from "@/lib/jev";

/** POST { transcript } → { answers, ms }: Jev's decisions about what was said. */

const ALLOWED_ORIGIN = /^https:\/\/(labs\.)?(www\.)?rushilchopra\.com$|^http:\/\/([a-z0-9-]+\.)?localhost(:\d+)?$/;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGIN.test(origin)) return Response.json({ error: "Not allowed." }, { status: 403 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const key = createHash("sha256").update(`jev:${ip}`).digest("hex").slice(0, 24);
  if (!allow(key)) return Response.json({ error: "Slow down a little." }, { status: 429 });

  let transcript: unknown;
  try {
    ({ transcript } = (await request.json()) as { transcript?: unknown });
  } catch {
    return Response.json({ error: "Send JSON: { transcript }." }, { status: 400 });
  }
  if (typeof transcript !== "string" || !transcript.trim()) {
    return Response.json({ error: "Say something first." }, { status: 400 });
  }

  try {
    // Only the most recent words matter for "what's on screen now".
    const text = transcript.trim().slice(-MAX_TRANSCRIPT);
    return Response.json(await decideRoom(text, request.signal));
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error("Jev: decide failed", error);
    return Response.json({ error: "Jev didn't answer. Try again." }, { status: 502 });
  }
}
