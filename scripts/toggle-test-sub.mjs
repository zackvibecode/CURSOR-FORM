import { readFileSync } from "node:fs";

function loadEnv() {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim();
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = "10758f71-bbc5-4c41-b9ba-8a8cc9814d88";

const mode = process.argv[2] ?? "set";

function buildBody() {
  if (mode === "revert") {
    return { plan: "free", status: "active", billing_cycle: "monthly", expires_at: null, started_at: new Date().toISOString() };
  }
  const expiresAt = new Date();
  if (mode === "expired") {
    expiresAt.setDate(expiresAt.getDate() - 1); // semalam — kad merah "telah tamat"
  } else {
    expiresAt.setDate(expiresAt.getDate() + 5); // 5 hari — kad amber
  }
  return { plan: "pro", status: "active", billing_cycle: "monthly", expires_at: expiresAt.toISOString(), started_at: new Date().toISOString() };
}

const res = await fetch(`${url}/rest/v1/subscriptions?user_id=eq.${userId}`, {
  method: "PATCH",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify(buildBody()),
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));
