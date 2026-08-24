import { createHash } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Meta Conversions API — server-side conversion events.
 *
 * The browser Pixel fires the same event with the SAME event_id (see
 * src/lib/meta-pixel.ts). Meta deduplicates browser + server events that
 * share event_name + event_id into a single conversion.
 *
 * The CAPI access token never leaves the server. The pixel ID comes from the
 * client because this is a multi-tenant app (each form owner has their own
 * pixel) — it is strictly validated below.
 */

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE =
  process.env.META_TEST_EVENT_CODE || process.env.META_CAPI_TEST_EVENT_CODE;

/**
 * Optional single-tenant lock: when META_PIXEL_ID is set, the endpoint only
 * forwards events to that pixel. Leave empty for multi-tenant use.
 */
const RESTRICTED_PIXEL_ID = process.env.META_PIXEL_ID;

const PIXEL_ID_PATTERN = /^\d{10,20}$/;
const ALLOWED_EVENTS = new Set(["Lead", "Contact", "ViewContent", "PageView", "Search"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FBP_PATTERN = /^fb\.1\.\d+\.\d+$/;
const FBC_PATTERN = /^fb\.1\.\d+\.[A-Za-z0-9_-]+$/;

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(phone: string): string {
  // Strip all non-digits except leading +; Meta wants E.164 without +.
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.replace(/^\+/, "");
}

function getClientIP(): string | undefined {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") || undefined;
}

interface CAPIRequestBody {
  pixelId: string;
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  formId?: string;
  formTitle?: string;
  source?: string;
  leadId?: string;
  email?: string;
  phone?: string;
  fbp?: string;
  fbc?: string;
  userAgent?: string;
}

export async function POST(request: Request) {
  let body: CAPIRequestBody;
  try {
    body = (await request.json()) as CAPIRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    pixelId,
    eventName,
    eventId,
    eventSourceUrl,
    formId,
    formTitle,
    source,
    leadId,
    email,
    phone,
    fbp,
    fbc,
  } = body;

  if (!pixelId || !PIXEL_ID_PATTERN.test(pixelId)) {
    return NextResponse.json({ error: "Invalid pixelId" }, { status: 400 });
  }

  if (RESTRICTED_PIXEL_ID && pixelId !== RESTRICTED_PIXEL_ID) {
    return NextResponse.json({ error: "Invalid pixelId" }, { status: 400 });
  }

  if (!eventId || typeof eventId !== "string") {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const finalEventName = ALLOWED_EVENTS.has(eventName) ? eventName : "Lead";

  if (!CAPI_ACCESS_TOKEN) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Meta CAPI] skip — META_CAPI_ACCESS_TOKEN not configured", {
        pixelId,
        eventId,
      });
    }
    // Don't block the user — just skip silently.
    return NextResponse.json({ success: false, reason: "capi_not_configured" });
  }

  const clientIP = getClientIP();
  const ua = body.userAgent || headers().get("user-agent") || undefined;

  // Build user_data — PII fields must be SHA-256 hashed. Only use data the
  // visitor genuinely provided in the form; never invent identifiers.
  const userData: Record<string, string> = {};

  if (email && typeof email === "string" && EMAIL_PATTERN.test(email)) {
    userData.em = sha256(email);
  }
  if (phone && typeof phone === "string" && phone.replace(/\D/g, "").length >= 7) {
    userData.ph = sha256(normalizePhone(phone));
  }
  if (leadId && typeof leadId === "string") {
    userData.external_id = sha256(leadId);
  }
  if (fbp && typeof fbp === "string" && FBP_PATTERN.test(fbp)) {
    userData.fbp = fbp;
  }
  if (fbc && typeof fbc === "string" && FBC_PATTERN.test(fbc)) {
    userData.fbc = fbc;
  }
  if (clientIP) {
    userData.client_ip_address = clientIP;
  }
  if (ua) {
    userData.client_user_agent = ua;
  }

  const payload = {
    data: [
      {
        event_name: finalEventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: eventSourceUrl,
        custom_data: {
          content_name: formTitle,
          content_category: "lead_form",
          form_name: formTitle,
          form_id: formId,
          source,
        },
        user_data: userData,
      },
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  };

  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${CAPI_ACCESS_TOKEN}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await res.json().catch(() => null)) as
      | { events_received?: number; error?: { fbtrace_id?: string } }
      | null;

    if (process.env.NODE_ENV === "development") {
      console.log("[Meta CAPI] response", {
        status: res.status,
        eventName: finalEventName,
        eventId,
        pixelId,
        fbtraceId: result?.error?.fbtrace_id,
        success: Boolean(result?.events_received),
      });
    }

    if (!res.ok) {
      // Log a safe, PII-free error. Never expose Meta errors to the customer.
      console.error("[Meta CAPI] Meta API error", {
        status: res.status,
        eventId,
        fbtraceId: result?.error?.fbtrace_id,
      });
      // Don't throw — form submission must still work.
      return NextResponse.json({ success: false, error: "meta_api_error" }, { status: 200 });
    }

    return NextResponse.json({ success: true, eventId });
  } catch (err) {
    console.error("[Meta CAPI] fetch failed", err instanceof Error ? err.message : err);
    // Never block form submission due to CAPI failure.
    return NextResponse.json({ success: false, error: "capi_fetch_failed" }, { status: 200 });
  }
}
