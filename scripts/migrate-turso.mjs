#!/usr/bin/env node
/**
 * Applies drizzle/*.sql to the Turso database named by TURSO_DATABASE_URL.
 *
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/migrate-turso.mjs
 *
 * Each file is applied once; applied names are recorded in _migrations.
 */
import { readFileSync, readdirSync } from "node:fs";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("TURSO_DATABASE_URL is not set.");
  process.exit(1);
}
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

await db.execute(
  "CREATE TABLE IF NOT EXISTS _migrations (name text primary key, applied_at text default CURRENT_TIMESTAMP)",
);
const done = new Set((await db.execute("SELECT name FROM _migrations")).rows.map((r) => r.name));
const files = readdirSync("drizzle").filter((f) => f.endsWith(".sql")).sort();

let applied = 0;
for (const file of files) {
  if (done.has(file)) {
    console.log(`skip ${file} (already applied)`);
    continue;
  }
  const statements = readFileSync(`drizzle/${file}`, "utf8")
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) await db.execute(statement);
  await db.execute({ sql: "INSERT INTO _migrations (name) VALUES (?)", args: [file] });
  console.log(`applied ${file} (${statements.length} statements)`);
  applied++;
}
console.log(applied ? `Done — ${applied} migration(s) applied.` : "Database already up to date.");
