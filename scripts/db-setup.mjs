// Creates the tables the site needs. Safe to run more than once.
// Usage: npm run db:setup  (reads DATABASE_URL from .env.local)
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run `vercel env pull` first.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");

// The HTTP driver runs one statement per query, so run them in order.
const statements = schema
  .split(/;\s*$/m)
  .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
  .filter(Boolean);
for (const statement of statements) await sql.query(statement);
console.log("Database is ready.");
