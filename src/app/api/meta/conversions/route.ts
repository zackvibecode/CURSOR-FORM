import { createHash } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { META_FORM_SUBMIT_EVENT } from "@/lib/meta-pixel";

/**
 * Meta Conversions API — server-side zaqoneformSubmit event.
 *
 * Receives the same event_id that the browser Pixel used so Meta can
 * deduplicate the browser + server events into a single conversion.
 */

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE;

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
  eventId: string;
  formId: string;
  formTitle: string;
  eventSourceUrl: string;
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

  const { pixelId, eventId, formTitle, eventSourceUrl, email, phone, fbp, fbc, userAgent } = body;

  if (!pixelId || !eventId) {
    return NextResponse.json({ error: "pixelId and eventId are required" }, { status: 400 });
  }

  if (!CAPI_ACCESS_TOKEN) {
    if (process.env.NODE_ENV === "development") {
      console.log("[meta-capi] skip — META_CAPI_ACCESS_TOKEN not configured", { pixelId, eventId });
    }
    // Don't block the user — just skip silently.
    return NextResponse.json({ success: false, reason: "capi_not_configured" });
  }

  const clientIP = getClientIP();
  const ua = userAgent || headers().get("user-agent") || undefined;

  // Build user_data — all PII fields must be SHA-256 hashed.
  const userData: Record<string, string> = {};

  if (email && email.trim()) {
    userData.em = sha256(email);
  }
  if (phone && phone.trim()) {
    userData.ph = sha256(normalizePhone(phone));
  }
  if (fbp) {
    userData.fbp = fbp;
  }
  if (fbc) {
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
        event_name: META_FORM_SUBMIT_EVENT,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: eventSourceUrl,
        custom_data: {
          content_name: formTitle,
          content_category: "form_submission",
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

    const result = await res.json();

    if (process.env.NODE_ENV === "development") {
      console.log("[meta-capi] response", {
        status: res.status,
        eventId,
        pixelId,
        fbtraceId: result?.error?.fbtrace_id,
        success: Boolean(result?.events_received),
      });
    }

    if (!res.ok) {
      console.error("[meta-capi] Meta API error", { status: res.status, result });
      // Don't throw — form submission must still work.
      return NextResponse.json({ success: false, error: "meta_api_error" }, { status: 200 });
    }

    return NextResponse.json({ success: true, eventId });
  } catch (err) {
    console.error("[meta-capi] fetch failed", err);
    // Never block form submission due to CAPI failure.
    return NextResponse.json({ success: false, error: "capi_fetch_failed" }, { status: 200 });
  }
}
