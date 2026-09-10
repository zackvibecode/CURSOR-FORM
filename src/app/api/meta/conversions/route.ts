import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { sendServerCapiEvent } from "@/lib/meta/capi-server";
import type { MetaEventName, MetaEventParams } from "@/lib/meta/types";

/**
 * Meta Conversions API proxy.
 *
 * Receives the same event_id the browser Pixel used so Meta can
 * deduplicate browser + server events into a single conversion.
 *
 * Never exposes META_CAPI_ACCESS_TOKEN to the client.
 */

const META_PIXEL_ID_PATTERN = /^\d{10,20}$/;
const ALLOWED_EVENTS = new Set([
  "Lead",
  "Contact",
  "ViewContent",
  "PageView",
  "Search",
  "InitiateCheckout",
  "Purchase",
]);

interface CAPIRequestBody {
  pixelId: string;
  eventId: string;
  eventName?: MetaEventName;
  formId?: string;
  formTitle?: string;
  eventSourceUrl: string;
  email?: string;
  phone?: string;
  fbp?: string;
  fbc?: string;
  userAgent?: string;
  customData?: MetaEventParams;
}

function getClientIP(): string | undefined {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") || undefined;
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
    eventId,
    eventName = "Lead",
    formTitle,
    formId,
    eventSourceUrl,
    email,
    phone,
    fbp,
    fbc,
    userAgent,
    customData,
  } = body;

  if (!pixelId || !eventId) {
    return NextResponse.json({ error: "pixelId and eventId are required" }, { status: 400 });
  }

  if (!META_PIXEL_ID_PATTERN.test(String(pixelId).trim())) {
    return NextResponse.json({ error: "Invalid pixelId" }, { status: 400 });
  }

  if (!ALLOWED_EVENTS.has(String(eventName))) {
    return NextResponse.json({ error: "Unsupported eventName" }, { status: 400 });
  }

  const clientIP = getClientIP();
  const ua = userAgent || headers().get("user-agent") || undefined;

  const mergedCustom: MetaEventParams = {
    ...(formTitle ? { content_name: formTitle, form_name: formTitle } : {}),
    ...(formId ? { content_ids: [formId], content_type: "form" } : {}),
    content_category: "form_submission",
    source: "oneform",
    ...customData,
  };

  const result = await sendServerCapiEvent({
    pixelId: String(pixelId).trim(),
    eventName: eventName as MetaEventName,
    eventId: String(eventId),
    eventSourceUrl,
    email,
    phone,
    fbp,
    fbc,
    clientIpAddress: clientIP,
    clientUserAgent: ua,
    customData: mergedCustom,
    externalId: formId,
  });

  // Always 200 for configured/skip cases so client form UX is never blocked.
  return NextResponse.json({
    success: result.success,
    eventId,
    reason: result.reason,
  });
}
