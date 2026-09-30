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
const TARGET_EMAIL = "zarulzaqwan5678@gmail.com";

// Resolve exact user by email (case-insensitive) — avoid matching wrong account.
const usersRes = await fetch(`${url}/auth/v1/admin/users?per_page=100`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
const { users } = await usersRes.json();
const target = users.find(
  (u) => (u.email ?? "").toLowerCase() === TARGET_EMAIL.toLowerCase()
);
if (!target) {
  console.error("User not found:", TARGET_EMAIL);
  process.exit(1);
}
const userId = target.id;
console.log("Targeting:", TARGET_EMAIL, userId);

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
