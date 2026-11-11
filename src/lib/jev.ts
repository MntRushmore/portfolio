import { experimental_decide as decide } from "ai";
import { JEV_QUESTIONS } from "./jev-questions";

/**
 * The Jev lab's engine (labs.rushilchopra.com). The page sends only what was
 * said so far; the questions are fixed here on the server (jev-questions.ts),
 * so this can't be used as a general-purpose model API.
 * Jev (TypeSafe AI, via AI Gateway) answers typed questions in ~130 ms warm.
 */

export const MAX_TRANSCRIPT = 800;

/**
 * Generous: speech and typing send up to ~8 updates a second, and Jev costs
 * a fraction of a cent per thousand calls. Per server instance.
 */
const WINDOW_MS = 10_000;
const PER_WINDOW = 100;
const PER_HOUR = 6_000;
const hits = new Map<string, number[]>();

export function allow(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 3_600_000);
  const inWindow = recent.filter((t) => now - t < WINDOW_MS).length;
  if (inWindow >= PER_WINDOW || recent.length >= PER_HOUR) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) hits.clear(); // keep memory bounded
  return true;
}

export async function decideRoom(transcript: string, signal?: AbortSignal) {
  const started = performance.now();
  const result = await decide({
    model: "typesafe-ai/jev",
    state: { transcript },
    questions: JEV_QUESTIONS,
    maxRetries: 0,
    abortSignal: signal,
  });
  return { answers: result.answers, ms: Math.round(performance.now() - started) };
}
