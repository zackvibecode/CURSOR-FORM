#!/usr/bin/env node
/**
 * Full Supabase setup for FORM.ZAQONE.COM
 * - Fetch API keys
 * - Update .env.local
 * - Apply all migrations
 *
 * Usage:
 *   npm run setup:supabase
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx npm run setup:supabase
 */

import { execSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PROJECT_REF = "svnwvkiahtlhahkobtcd";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ENV_PATH = join(ROOT, ".env.local");
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const API = "https://api.supabase.com/v1";

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    const val = trimmed.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotEnv(join(ROOT, ".env.supabase"));

function run(cmd, silent = false) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: silent ? ["pipe", "pipe", "pipe"] : "inherit",
    shell: true,
  });
}

function getToken() {
  return process.env.SUPABASE_ACCESS_TOKEN || "";
}

function getKeysFromEnv() {
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (anonKey && serviceKey) return { anonKey, serviceKey };
  return null;
}

async function api(path, token, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) throw new Error(typeof body === "string" ? body : JSON.stringify(body));
  return body;
}

function cliOk() {
  try {
    run("npx supabase projects list", true);
    return true;
  } catch {
    return false;
  }
}

function ensureAuth() {
  if (getToken()) {
    console.log("✓ Using SUPABASE_ACCESS_TOKEN");
    return "token";
  }
  if (cliOk()) {
    console.log("✓ Supabase CLI authenticated");
    return "cli";
  }
  console.log("\n→ Buka browser untuk login Supabase CLI...");
  console.log("  Login: zackvibecode / zarulzaqwan5678@gmail.com\n");
  const r = spawnSync("npx supabase login --yes", { cwd: ROOT, stdio: "inherit", shell: true });
  if (r.status === 0 && cliOk()) return "cli";
  console.error("\n✗ Login gagal. Buat token di:");
  console.error("  https://supabase.com/dashboard/account/tokens");
  console.error("  SUPABASE_ACCESS_TOKEN=sbp_xxx npm run setup:supabase");
  process.exit(1);
}

async function fetchKeysViaApi(token) {
  const keys = await api(`/projects/${PROJECT_REF}/api-keys`, token);
  let anonKey = "";
  let serviceKey = "";

  for (const k of keys) {
    const key = k.api_key || "";
    const name = `${k.name || ""} ${k.type || ""}`.toLowerCase();
    if (!key) continue;
    if (name.includes("service") || name.includes("secret")) serviceKey = key;
    else if (name.includes("anon") || name.includes("publishable")) anonKey = key;
  }

  if (!anonKey || !serviceKey) {
    try {
      const legacy = await api(`/projects/${PROJECT_REF}/api-keys/legacy`, token);
      if (legacy?.enabled !== false) {
        const legacyKeys = await api(`/projects/${PROJECT_REF}/api-keys?reveal=true`, token);
        for (const k of legacyKeys) {
          const name = (k.name || "").toLowerCase();
          if (name === "anon") anonKey = k.api_key;
          if (name === "service_role") serviceKey = k.api_key;
        }
      }
    } catch {
      /* legacy endpoint optional */
    }
  }

  if (!anonKey || !serviceKey) throw new Error("API keys not found");
  return { anonKey, serviceKey };
}

function fetchKeysViaCli() {
  const raw = run(`npx supabase projects api-keys --project-ref ${PROJECT_REF} --output json`, true);
  const keys = JSON.parse(raw);
  let anonKey = "";
  let serviceKey = "";
  for (const k of keys) {
    const key = k.api_key || k.key || "";
    const name = `${k.name || ""} ${k.type || ""}`.toLowerCase();
    if (!key) continue;
    if (name.includes("service") || name.includes("secret")) serviceKey = key;
    else if (name.includes("anon") || name.includes("publishable")) anonKey = key;
  }
  if (!anonKey || !serviceKey) throw new Error("API keys not found via CLI");
  return { anonKey, serviceKey };
}

function updateEnvLocal(anonKey, serviceKey) {
  let content = existsSync(ENV_PATH)
    ? readFileSync(ENV_PATH, "utf8")
    : readFileSync(join(ROOT, ".env.example"), "utf8");

  const set = (key, val) => {
    const re = new RegExp(`^${key}=.*$`, "m");
    content = re.test(content) ? content.replace(re, `${key}=${val}`) : `${content.trim()}\n${key}=${val}`;
  };

  set("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  set("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey);
  set("SUPABASE_SERVICE_ROLE_KEY", serviceKey);
  if (!/^NEXT_PUBLIC_APP_URL=/m.test(content)) set("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  if (!/^ADMIN_EMAILS=/m.test(content)) content += "\nADMIN_EMAILS=zarulzaqwan5678@gmail.com";

  writeFileSync(ENV_PATH, content.trim() + "\n");
  console.log("✓ .env.local updated");
}

async function applyMigrationsViaApi(token) {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  console.log(`\n→ Applying ${files.length} migrations via Management API...`);
  for (const file of files) {
    const query = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    process.stdout.write(`  ${file} ... `);
    try {
      await api(`/projects/${PROJECT_REF}/database/query`, token, {
        method: "POST",
        body: JSON.stringify({ query }),
      });
      console.log("✓");
    } catch (e) {
      console.log("⚠");
      console.warn(`    ${String(e.message).slice(0, 120)}`);
    }
  }
}

function applyMigrationsViaDbPassword(password) {
  const encoded = encodeURIComponent(password);
  const dbUrl = `postgresql://postgres.${PROJECT_REF}:${encoded}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
  console.log("\n→ Applying migrations via database connection...");
  try {
    run(`npx supabase db push --db-url "${dbUrl}" --yes`);
    console.log("✓ db push complete");
    return;
  } catch {
    console.warn("⚠ pooler failed, trying direct connection...");
  }
  const directUrl = `postgresql://postgres:${encoded}@db.${PROJECT_REF}.supabase.co:5432/postgres`;
  run(`npx supabase db push --db-url "${directUrl}" --yes`);
  console.log("✓ db push complete");
}

function applyMigrationsViaCli() {
  try {
    run(`npx supabase link --project-ref ${PROJECT_REF} --yes`, true);
  } catch {
    /* already linked */
  }
  try {
    run("npx supabase db push --linked --yes");
    console.log("✓ db push complete");
    return;
  } catch {
    console.warn("⚠ db push failed, trying db query per file...");
  }
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    process.stdout.write(`  ${file} ... `);
    try {
      run(`npx supabase db query --linked --file supabase/migrations/${file}`, true);
      console.log("✓");
    } catch {
      console.log("⚠");
    }
  }
}

async function verify(anonKey) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=count`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (res.status === 401) throw new Error("API key invalid after update");
  console.log(`✓ Connection OK (profiles endpoint: ${res.status})`);

  const expected = [
    "profiles", "forms", "form_fields", "submissions",
    "user_settings", "form_team_settings", "subscriptions",
  ];
  console.log("\nExpected tables:", expected.join(", "));
  console.log("Verify in dashboard → Table Editor if needed.");
}

async function main() {
  console.log("=== Setup Supabase: FORM.ZAQONE.COM ===\n");

  const envKeys = getKeysFromEnv();
  const token = getToken();
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || "";

  let anonKey;
  let serviceKey;
  let migrationMode = "none";

  if (envKeys) {
    console.log("✓ Using API keys from .env.supabase / env vars");
    ({ anonKey, serviceKey } = envKeys);
    migrationMode = token ? "token" : dbPassword ? "db" : "manual";
  } else if (token) {
    console.log("✓ Using SUPABASE_ACCESS_TOKEN");
    ({ anonKey, serviceKey } = await fetchKeysViaApi(token));
    migrationMode = "token";
  } else {
    const mode = ensureAuth();
    ({ anonKey, serviceKey } = mode === "token" ? await fetchKeysViaApi(token) : fetchKeysViaCli());
    migrationMode = mode;
  }

  updateEnvLocal(anonKey, serviceKey);

  if (migrationMode === "token") await applyMigrationsViaApi(token || getToken());
  else if (migrationMode === "db") applyMigrationsViaDbPassword(dbPassword);
  else if (migrationMode === "cli") applyMigrationsViaCli();
  else {
    console.log("\n⚠ Keys updated but migrations not applied automatically.");
    console.log("  Add SUPABASE_ACCESS_TOKEN or SUPABASE_DB_PASSWORD to .env.supabase");
    console.log("  Or run SQL manually:");
    console.log(`  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
    console.log("  Paste: supabase/setup_complete.sql");
  }

  await verify(anonKey);

  console.log("\n=== SIAP! ===");
  console.log("1. npm run dev");
  console.log("2. Auth redirect URL: http://localhost:3000/auth/callback");
  console.log("3. Enable Google OAuth in Supabase → Authentication → Providers");
}

main().catch((err) => {
  console.error("\n✗ Setup gagal:", err.message);
  process.exit(1);
});
