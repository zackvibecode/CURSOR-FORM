#!/usr/bin/env node
/**
 * Apply all migrations using service role via direct Postgres (pooler).
 * Requires SUPABASE_DB_PASSWORD in .env.local or .env.supabase
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_REF = "svnwvkiahtlhahkobtcd";
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");

function loadEnv() {
  for (const f of [".env.supabase", ".env.local"]) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

loadEnv();

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("Missing SUPABASE_DB_PASSWORD");
  console.error("Get it from: https://supabase.com/dashboard/project/svnwvkiahtlhahkobtcd/settings/database");
  process.exit(1);
}

const encoded = encodeURIComponent(password);
const dbUrls = [
  `postgresql://postgres.${PROJECT_REF}:${encoded}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encoded}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
];

const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
let ok = false;

for (const dbUrl of dbUrls) {
  console.log("Trying connection...");
  try {
    for (const file of files) {
      process.stdout.write(`${file} ... `);
      execSync(`npx supabase db query --db-url "${dbUrl}" --file supabase/migrations/${file}`, {
        cwd: ROOT,
        stdio: ["pipe", "pipe", "pipe"],
      });
      console.log("✓");
    }
    ok = true;
    break;
  } catch (e) {
    console.log("failed, trying next...");
  }
}

if (!ok) process.exit(1);
console.log("\n✓ All migrations applied");
