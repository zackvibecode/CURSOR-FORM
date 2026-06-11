#!/usr/bin/env node
/** Quick check: API keys valid + core tables exist */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(ROOT, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const tables = ["profiles", "forms", "form_fields", "submissions", "user_settings", "form_team_settings", "subscriptions"];

function decodeRef(key) {
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
    return payload.ref || payload.project_ref || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("URL:", url);
  const ref = decodeRef(anon);
  const urlRef = url?.replace("https://", "").split(".")[0];
  if (ref && urlRef && ref !== urlRef) {
    console.error("✗ API key mismatch! Key is for", ref, "but URL is", urlRef);
    console.error("  Run: npm run setup:supabase");
    process.exit(1);
  }

  let ok = 0;
  for (const table of tables) {
    const res = await fetch(`${url}/rest/v1/${table}?select=count&limit=1`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}`, Prefer: "count=exact" },
    });
    const status = res.ok ? "✓" : "✗";
    console.log(`${status} ${table} (${res.status})`);
    if (res.ok) ok++;
  }

  const rpc = await fetch(`${url}/rest/v1/rpc/resolve_form_recipient`, {
    method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_form_id: "00000000-0000-0000-0000-000000000000" }),
  });
  console.log(`${rpc.status === 404 || rpc.ok ? "✓" : "✗"} RPC resolve_form_recipient (${rpc.status})`);

  if (ok < tables.length) {
    console.error("\n✗ Some tables missing. Run migrations:");
    console.error("  npm run setup:supabase");
    console.error("  OR paste supabase/setup_complete.sql in SQL Editor");
    process.exit(1);
  }
  console.log("\n✓ Database looks ready");
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
