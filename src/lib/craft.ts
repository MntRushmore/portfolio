import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { generateText, Output } from "ai";
import { z } from "zod";

/**
 * The crafting game's engine (labs.rushilchopra.com/craft). Two things go in,
 * one comes out. Each pair is answered by the model once and then remembered
 * forever, so everyone's game agrees and popular combinations cost nothing.
 * Tables: db/schema.sql (lab_craft_*).
 */

/** Any AI Gateway model id. Set CRAFT_MODEL to change it without a deploy. */
const MODEL = process.env.CRAFT_MODEL ?? "anthropic/claude-opus-5.5";

/** Limits on new model calls (cached combinations are never limited by these). */
export const LIMITS = {
  perMinute: 20,
  perDay: 400,
  /** Across everyone: a hard ceiling on spend per day. */
  globalPerDay: 3000,
} as const;

export const STARTERS = ["Water", "Fire", "Earth", "Wind"] as const;

export type Element = { name: string; emoji: string; steps: number };
export type CombineResult = Element & { isNew: boolean };

export class CraftError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const db = () => neon(process.env.DATABASE_URL!);

/** Tidy a name into the game's form: Title Case words, no stray punctuation. */
export function cleanName(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/["“”'‘’.!?,;:]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40)
    .replace(/\b\p{Ll}/gu, (c) => c.toUpperCase());
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(`craft:${ip}`).digest("hex").slice(0, 32);
}

const answer = z.object({
  name: z.string().min(1).max(40).describe("What the two make together: 1–3 words, Title Case."),
  emoji: z.string().min(1).max(16).describe("One emoji that shows it."),
});

const SYSTEM = `You are the rules engine of a crafting game. Players combine two things to make a third.

Given two things, reply with the one thing they make together:
- A noun: an object, material, place, creature, phenomenon, invention, job, idea, story or pop-culture thing. 1–3 words, Title Case, no articles.
- The answer a clever player would expect, with the occasional delightful surprise. Concrete beats abstract.
- Usually something new, different from both inputs. A thing combined with itself grows or intensifies (Water + Water = Lake).
- Family friendly. Nothing sexual or hateful, no real private individuals, no slurs.
- One emoji that best shows the result.`;

async function ask(a: string, b: string) {
  const { output } = await generateText({
    model: MODEL,
    reasoning: "low",
    system: SYSTEM,
    prompt: `${a} + ${b}`,
    output: Output.object({ schema: answer }),
  });
  return output;
}

/** Combine two things the game already knows. */
export async function combine(first: string, second: string, ipHash: string): Promise<CombineResult> {
  const [a, b] = [cleanName(first), cleanName(second)].sort((x, y) => x.localeCompare(y));
  if (!a || !b) throw new CraftError("Pick two things to combine.", 400);
  const sql = db();

  // Already answered? Everyone gets the same result.
  const cached = (await sql`
    select e.name, e.emoji, e.steps
    from lab_craft_combos c join lab_craft_elements e on e.name = c.result
    where c.a = ${a} and c.b = ${b}
  `) as Element[];
  if (cached[0]) return { ...cached[0], isNew: false };

  // Only things that exist can be combined: no free-text prompts.
  const inputs = (await sql`
    select name, steps from lab_craft_elements where name in (${a}, ${b})
  `) as { name: string; steps: number }[];
  const steps = new Map(inputs.map((r) => [r.name, r.steps]));
  if (!steps.has(a) || !steps.has(b)) throw new CraftError("One of those doesn't exist yet.", 400);

  // Rate limits, checked before spending anything.
  const [usage] = (await sql`
    select
      count(*) filter (where ip_hash = ${ipHash} and created_at > now() - interval '1 minute')::int as minute,
      count(*) filter (where ip_hash = ${ipHash})::int as day,
      count(*)::int as global
    from lab_craft_calls
    where created_at > now() - interval '1 day'
  `) as { minute: number; day: number; global: number }[];
  if (usage.global >= LIMITS.globalPerDay) {
    throw new CraftError("The lab's out of ideas for today. Try again tomorrow, or combine things people have tried before.", 503);
  }
  if (usage.minute >= LIMITS.perMinute || usage.day >= LIMITS.perDay) {
    throw new CraftError("You're crafting faster than the lab can think. Give it a minute.", 429);
  }
  await sql`insert into lab_craft_calls (ip_hash) values (${ipHash})`;
  // Now and then, sweep out old rate-limit rows.
  if (Math.random() < 0.02) await sql`delete from lab_craft_calls where created_at < now() - interval '2 days'`;

  const made = await ask(a, b);
  const name = cleanName(made.name);
  if (!name) throw new CraftError("Nothing happened. Try something else.", 422);
  const emoji = made.emoji.trim().slice(0, 16);
  const cost = steps.get(a)! + steps.get(b)! + 1;

  // Save the element (keeping the fewest steps known), then the pair. If two
  // people asked at once, the first answer saved wins for both.
  const [element] = (await sql`
    insert into lab_craft_elements (name, emoji, steps) values (${name}, ${emoji}, ${cost})
    on conflict (name) do update set steps = least(lab_craft_elements.steps, excluded.steps)
    returning name, emoji, steps, (xmax = 0) as inserted
  `) as (Element & { inserted: boolean })[];
  const saved = (await sql`
    insert into lab_craft_combos (a, b, result) values (${a}, ${b}, ${element.name})
    on conflict (a, b) do nothing
    returning result
  `) as { result: string }[];
  if (!saved[0]) {
    const [winner] = (await sql`
      select e.name, e.emoji, e.steps
      from lab_craft_combos c join lab_craft_elements e on e.name = c.result
      where c.a = ${a} and c.b = ${b}
    `) as Element[];
    return { ...winner, isNew: false };
  }
  return { name: element.name, emoji: element.emoji, steps: element.steps, isNew: element.inserted };
}

/**
 * The fewest combinations that make `target`, counting each distinct thing
 * once (a recipe that uses Steam twice only needs to make Steam once). Uses
 * each element's cheapest known recipe, so it's a good par, not a proof.
 */
function parFor(target: string, combos: { a: string; b: string; result: string }[], steps: Map<string, number>): number {
  const best = new Map<string, [string, string]>();
  for (const c of combos) {
    const cost = (steps.get(c.a) ?? 99) + (steps.get(c.b) ?? 99);
    const current = best.get(c.result);
    if (!current || cost < (steps.get(current[0]) ?? 99) + (steps.get(current[1]) ?? 99)) best.set(c.result, [c.a, c.b]);
  }
  const made = new Set<string>();
  const visit = (name: string, depth: number) => {
    if (made.has(name) || (steps.get(name) ?? 0) === 0 || depth > 40) return;
    const recipe = best.get(name);
    if (!recipe) return;
    made.add(name);
    visit(recipe[0], depth + 1);
    visit(recipe[1], depth + 1);
  };
  visit(target, 0);
  return Math.max(1, made.size);
}

/**
 * Today's target: something people have actually made (so it's reachable),
 * picked by the date on the day's first visit and then stored, so it's the
 * same for everyone all day even as new things are discovered.
 */
export async function dailyTarget(date = new Date()): Promise<Element & { date: string }> {
  const day = date.toISOString().slice(0, 10);
  const sql = db();
  const stored = (await sql`
    select e.name, e.emoji, d.par as steps
    from lab_craft_daily d join lab_craft_elements e on e.name = d.name
    where d.day = ${day}::date
  `) as Element[];
  if (stored[0]) return { ...stored[0], date: day };

  // Only things that existed before today, so nobody can move the target.
  const elements = (await sql`
    select name, emoji, steps from lab_craft_elements where created_at < ${day}::date
  `) as Element[];
  const combos = (await sql`
    select a, b, result from lab_craft_combos where created_at < ${day}::date
  `) as { a: string; b: string; result: string }[];
  const steps = new Map(elements.map((e) => [e.name, e.steps]));
  const scored = elements
    .filter((e) => e.steps > 0)
    .map((e) => ({ ...e, steps: parFor(e.name, combos, steps) }))
    .sort((x, y) => x.name.localeCompare(y.name));
  let pool = scored.filter((e) => e.steps >= 4 && e.steps <= 9);
  if (pool.length === 0) pool = [...scored].sort((x, y) => y.steps - x.steps).slice(0, 20);
  if (pool.length === 0) return { name: "Steam", emoji: "💨", steps: 1, date: day };

  const seed = parseInt(createHash("sha256").update(day).digest("hex").slice(0, 8), 16);
  const pick = pool[seed % pool.length];
  await sql`
    insert into lab_craft_daily (day, name, par) values (${day}::date, ${pick.name}, ${pick.steps})
    on conflict (day) do nothing
  `;
  const [chosen] = (await sql`
    select e.name, e.emoji, d.par as steps
    from lab_craft_daily d join lab_craft_elements e on e.name = d.name
    where d.day = ${day}::date
  `) as Element[];
  return { ...chosen, date: day };
}

export async function starters(): Promise<Element[]> {
  return (await db()`
    select name, emoji, steps from lab_craft_elements where steps = 0 order by created_at, name
  `) as Element[];
}
