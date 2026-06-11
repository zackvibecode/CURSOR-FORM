#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REF = "svnwvkiahtlhahkobtcd";
const MIGRATIONS = join(ROOT, "supabase", "migrations");

function loadEnv() {
  for (const f of [".env.supabase", ".env.local"]) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim();
    }
  }
}

loadEnv();

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("Need SUPABASE_DB_PASSWORD in .env.local or .env.supabase");
  console.error("Dashboard → Project Settings → Database → Database password");
  process.exit(1);
}

const enc = encodeURIComponent(password);
const urls = [
  `postgresql://postgres.${REF}:${enc}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${enc}@db.${REF}.supabase.co:5432/postgres`,
];

const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort();

async function main() {
  let sql = null;
  for (const url of urls) {
    try {
      const test = postgres(url, { ssl: "require", max: 1, connect_timeout: 15 });
      await test`SELECT 1`;
      sql = test;
      console.log("✓ Connected to database");
      break;
    } catch (e) {
      console.warn("Connection failed:", e.message?.slice(0, 80));
    }
  }
  if (!sql) throw new Error("Could not connect to database");

  for (const file of files) {
    process.stdout.write(`${file} ... `);
    const query = readFileSync(join(MIGRATIONS, file), "utf8");
    try {
      await sql.unsafe(query);
      console.log("✓");
    } catch (e) {
      console.log("⚠", e.message?.slice(0, 100));
    }
  }
  await sql.end();
  console.log("\n✓ Done");
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
