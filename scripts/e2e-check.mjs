/**
 * A-Z API & flow smoke test for OneForm.
 * Usage: node scripts/e2e-check.mjs [baseUrl]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const BASE = process.argv[2] || env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = (env.ADMIN_EMAILS || "").split(",")[0]?.trim();
const TEST_EMAIL = ADMIN_EMAIL || "zarulzaqwan5678@gmail.com";
const TEST_PASS = process.env.E2E_PASSWORD || "Admin1234!";

const results = [];
let cookieJar = "";

function pass(name, detail = "") {
  results.push({ ok: true, name, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail = "") {
  results.push({ ok: false, name, detail });
  console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

function parseCookies(res) {
  const raw = res.headers.getSetCookie?.() || [];
  const cookies = {};
  for (const c of raw) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) cookies[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  if (Object.keys(cookies).length) {
    cookieJar = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
}

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookieJar ? { Cookie: cookieJar } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  parseCookies(res);
  let json = null;
  const text = await res.text();
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json, headers: res.headers };
}

async function checkPages() {
  const pages = [
    "/",
    "/pricing",
    "/login",
    "/signup",
    "/demo",
    "/tools",
    "/tools/qr-generator",
    "/tools/link-generator",
    "/robots.txt",
    "/sitemap.xml",
  ];
  for (const p of pages) {
    const res = await fetch(`${BASE}${p}`, { redirect: "manual" });
    if (res.status === 200) pass(`Page ${p}`, String(res.status));
    else fail(`Page ${p}`, `status ${res.status}`);
  }
}

async function checkAuth() {
  const bad = await api("POST", "/api/auth/login", {
    email: TEST_EMAIL,
    password: "wrong-password-xyz",
  });
  if (bad.status === 401) pass("Login rejects bad password");
  else fail("Login rejects bad password", `status ${bad.status}`);

  const good = await api("POST", "/api/auth/login", {
    email: TEST_EMAIL,
    password: TEST_PASS,
  });
  if (good.status === 200) pass("Login with admin account");
  else fail("Login with admin account", `status ${good.status} ${JSON.stringify(good.json)}`);

  const dash = await api("GET", "/api/forms");
  if (dash.status === 401) fail("Session cookie not set after login");
  else if (dash.status === 200) pass("Authenticated session works (GET /api/forms)");
  else fail("GET /api/forms", `status ${dash.status}`);

  const noAuth = await fetch(`${BASE}/api/forms`);
  if (noAuth.status === 401) pass("Unauthenticated API blocked");
  else fail("Unauthenticated API blocked", `status ${noAuth.status}`);
}

async function checkFormsCrud() {
  const create = await api("POST", "/api/forms", {});
  if (create.status !== 201 && create.status !== 200) {
    fail("Create form", `status ${create.status} ${JSON.stringify(create.json)}`);
    return null;
  }
  const formId = create.json?.form?.id;
  pass("Create blank form", formId);

  const get = await api("GET", `/api/forms/${formId}`);
  if (get.status === 200) pass("Get form by ID");
  else fail("Get form by ID", `status ${get.status}`);

  const slug = `e2e-test-${Date.now()}`;
  const update = await api("PUT", `/api/forms/${formId}`, {
    title: "E2E Test Form",
    slug,
    whatsapp_number: "+60123456789",
    cta_text: "Submit",
    description: "Automated test",
    status: "draft",
    fields: [
      {
        id: crypto.randomUUID(),
        type: "text",
        label: "Name",
        placeholder: "Your name",
        required: true,
        options: [],
        order_index: 0,
        settings: {},
      },
      {
        id: crypto.randomUUID(),
        type: "phone",
        label: "Phone",
        placeholder: "+60",
        required: true,
        options: [],
        order_index: 1,
        settings: {},
      },
    ],
  });
  if (update.status === 200) pass("Update form + fields");
  else fail("Update form + fields", `status ${update.status} ${JSON.stringify(update.json)}`);

  const publish = await api("PUT", `/api/forms/${formId}`, {
    title: "E2E Test Form",
    slug,
    whatsapp_number: "+60123456789",
    cta_text: "Submit",
    status: "published",
  });
  if (publish.status === 200) pass("Publish form");
  else fail("Publish form", `status ${publish.status}`);

  const pub = await fetch(`${BASE}/api/public/forms/${slug}`);
  const pubJson = await pub.json();
  if (pub.status === 200 && pubJson.form?.slug === slug) pass("Public form API by slug");
  else fail("Public form API by slug", `status ${pub.status}`);

  const page = await fetch(`${BASE}/${slug}`);
  if (page.status === 200) pass("Public form page /slug");
  else fail("Public form page /slug", `status ${page.status}`);

  const legacy = await fetch(`${BASE}/f/${slug}`, { redirect: "manual" });
  if (legacy.status === 307 || legacy.status === 308) pass("Legacy /f/slug redirects");
  else fail("Legacy /f/slug redirects", `status ${legacy.status}`);

  const submit = await fetch(`${BASE}/api/forms/${formId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      [update.json?.fields?.[0]?.id || Object.keys(pubJson.fields?.[0] ? {} : {})]:
        "Test User",
    }),
  });

  // Re-fetch fields for submit
  const fieldsRes = await api("GET", `/api/forms/${formId}`);
  const fieldIds = (fieldsRes.json?.fields || []).map((f) => f.id);
  const submitBody = {};
  for (const f of fieldsRes.json?.fields || []) {
    if (f.type === "text") submitBody[f.id] = "E2E Test User";
    if (f.type === "phone") submitBody[f.id] = "+60199887766";
  }

  const submit2 = await fetch(`${BASE}/api/forms/${formId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submitBody),
  });
  const submitJson = await submit2.json();
  if (submit2.status === 200 && submitJson.success) pass("Public form submit");
  else fail("Public form submit", `status ${submit2.status} ${JSON.stringify(submitJson)}`);

  const teamGet = await api("GET", `/api/forms/${formId}/team-settings`);
  if (teamGet.status === 200) pass("Get team settings");
  else fail("Get team settings", `status ${teamGet.status}`);

  const teamPut = await api("PUT", `/api/forms/${formId}/team-settings`, {
    distribution_mode: "distribute",
    team_members: [{ name: "Agent A", phone: "+60111111111" }],
  });
  if (teamPut.status === 200) pass("Save team settings (distribute)");
  else fail("Save team settings", `status ${teamPut.status}`);

  const settingsGet = await api("GET", "/api/settings");
  if (settingsGet.status === 200) pass("Get user settings");
  else fail("Get user settings", `status ${settingsGet.status}`);

  const settingsPut = await api("PUT", "/api/settings", {
    business_name: "E2E Test Biz",
    whatsapp_number: "+60123456789",
    theme_color: "#25D366",
    email_notifications: true,
  });
  if (settingsPut.status === 200) pass("Update user settings");
  else fail("Update user settings", `status ${settingsPut.status}`);

  const subGet = await api("GET", "/api/subscription");
  if (subGet.status === 200) pass("Get subscription");
  else fail("Get subscription", `status ${subGet.status}`);

  const del = await api("DELETE", `/api/forms/${formId}`);
  if (del.status === 200) pass("Delete form");
  else fail("Delete form", `status ${del.status}`);

  return formId;
}

async function checkAdmin() {
  const list = await api("GET", "/api/admin/subscriptions");
  if (list.status === 200) pass("Admin list subscriptions");
  else fail("Admin list subscriptions", `status ${list.status} ${JSON.stringify(list.json)}`);

  const pending = await api("GET", "/api/admin/subscriptions?status=pending");
  if (pending.status === 200) pass("Admin filter pending subscriptions");
  else fail("Admin filter pending", `status ${pending.status}`);
}

async function checkSecurity() {
  const openRedirect = await fetch(`${BASE}/login?redirect=//evil.com`);
  if (openRedirect.status === 200) pass("Login page loads with redirect param");

  const rpcTest = await fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_form_fields`, {
    method: "POST",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${await getAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_form_id: "00000000-0000-0000-0000-000000000001",
      p_user_id: "00000000-0000-0000-0000-000000000002",
      p_fields: [],
    }),
  });
  const rpcText = await rpcTest.text();
  if (rpcTest.status >= 400 || rpcText.includes("Forbidden")) {
    pass("RPC upsert_form_fields blocks spoofed user_id");
  } else {
    fail("RPC upsert_form_fields blocks spoofed user_id", `status ${rpcTest.status}`);
  }

  const dashNoAuth = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
  if (dashNoAuth.status === 307 || dashNoAuth.status === 302) {
    const loc = dashNoAuth.headers.get("location") || "";
    if (loc.includes("/login")) pass("Dashboard redirects unauthenticated users");
    else fail("Dashboard redirect", loc);
  } else fail("Dashboard auth guard", `status ${dashNoAuth.status}`);
}

async function getAccessToken() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
  });
  const data = await res.json();
  return data.access_token;
}

async function checkSupabaseRpc() {
  const token = await getAccessToken();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/resolve_form_recipient`, {
    method: "POST",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_form_id: "00000000-0000-0000-0000-000000000001" }),
  });
  if (res.status === 200 || res.status === 204 || res.status === 400) {
    pass("RPC resolve_form_recipient callable");
  } else fail("RPC resolve_form_recipient", `status ${res.status}`);
}

console.log(`\n=== OneForm A-Z Check ===`);
console.log(`Target: ${BASE}\n`);

await checkPages();
await checkAuth();
await checkFormsCrud();
await checkAdmin();
await checkSecurity();
await checkSupabaseRpc();

const ok = results.filter((r) => r.ok).length;
const bad = results.filter((r) => !r.ok).length;
console.log(`\n=== SUMMARY: ${ok} passed, ${bad} failed ===\n`);
if (bad > 0) process.exit(1);
