const BASE = process.argv[2] || "https://form.zaqone.com";
const formId = process.argv[3] || "c68362b2-73a1-41c9-bb04-2e86ff423ef2";
const slug = process.argv[4] || "pakejterbaik";

const pub = await fetch(`${BASE}/api/public/forms/${slug}`).then((r) => r.json());
console.log("Main WA:", pub.form?.whatsapp_number);
console.log(
  "Fields:",
  pub.fields?.map((f) => ({ id: f.id, type: f.type, label: f.label }))
);

const body = {};
for (const f of pub.fields || []) {
  if (f.type === "title" || f.type === "image") continue;
  body[f.id] = f.type === "phone" ? "+60199998877" : `Test ${f.label}`;
}

const phones = [];
for (let i = 1; i <= 5; i++) {
  const r = await fetch(`${BASE}/api/forms/${formId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  phones.push(j.whatsapp_number);
  console.log(`Submit ${i}:`, r.status, "→", j.whatsapp_number);
}

console.log("Unique phones:", [...new Set(phones)]);
