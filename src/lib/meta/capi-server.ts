/**
 * Server-side Meta Conversions API helpers.
 * Access token never leaves the server.
 */

import { createHash } from "crypto";
import { waitUntil } from "@vercel/functions";
import type { MetaEventName, MetaEventParams } from "@/lib/meta/types";

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE =
  process.env.META_TEST_EVENT_CODE || process.env.META_CAPI_TEST_EVENT_CODE || "";

const DEBUG = process.env.NODE_ENV === "development";

export function sha256Normalize(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/** Meta expects digits only (E.164 without +). */
export function normalizePhoneForMeta(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.replace(/^\+/, "");
}

export interface ServerCapiEventInput {
  pixelId: string;
  eventName: MetaEventName;
  eventId: string;
  eventSourceUrl?: string;
  email?: string;
  phone?: string;
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  customData?: MetaEventParams;
  externalId?: string;
}

export async function sendServerCapiEvent(
  input: ServerCapiEventInput
): Promise<{ success: boolean; reason?: string }> {
  if (!input.pixelId || !input.eventId || !input.eventName) {
    return { success: false, reason: "missing_required_fields" };
  }

  if (!CAPI_ACCESS_TOKEN) {
    if (DEBUG) {
      console.log("[Meta CAPI] skip — META_CAPI_ACCESS_TOKEN not configured", {
        eventName: input.eventName,
        eventId: input.eventId,
      });
    }
    return { success: false, reason: "capi_not_configured" };
  }

  const userData: Record<string, string | string[]> = {};

  if (input.email?.trim()) {
    userData.em = [sha256Normalize(input.email)];
  }
  if (input.phone?.trim()) {
    userData.ph = [sha256Normalize(normalizePhoneForMeta(input.phone))];
  }
  if (input.externalId?.trim()) {
    userData.external_id = [sha256Normalize(input.externalId)];
  }
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;
  if (input.clientIpAddress) userData.client_ip_address = input.clientIpAddress;
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        ...(input.customData && Object.keys(input.customData).length > 0
          ? { custom_data: input.customData }
          : {}),
        user_data: userData,
      },
    ],
  };

  if (TEST_EVENT_CODE) {
    payload.test_event_code = TEST_EVENT_CODE;
  }

  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${input.pixelId}/events`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CAPI_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const result = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      error?: { message?: string; fbtrace_id?: string };
    };

    if (!res.ok) {
      // Never log token or PII.
      console.error("[Meta CAPI] Meta API error", {
        status: res.status,
        eventName: input.eventName,
        eventId: input.eventId,
        fbtraceId: result?.error?.fbtrace_id,
      });
      return { success: false, reason: "meta_api_error" };
    }

    if (DEBUG) {
      console.log(`[Meta CAPI] ${input.eventName} sent successfully`, {
        eventId: input.eventId,
        eventsReceived: result?.events_received,
      });
    }

    return { success: true };
  } catch (err) {
    console.error("[Meta CAPI] fetch failed", {
      eventName: input.eventName,
      eventId: input.eventId,
      error: err instanceof Error ? err.message : "unknown",
    });
    return { success: false, reason: "capi_fetch_failed" };
  }
}

/** Fire-and-forget CAPI on Vercel waitUntil when available. */
export function scheduleServerCapiEvent(input: ServerCapiEventInput): void {
  const task = sendServerCapiEvent(input).catch((error) => {
    console.error("[Meta CAPI] schedule failed", {
      eventName: input.eventName,
      eventId: input.eventId,
      error: error instanceof Error ? error.message : "unknown",
    });
  });

  if (process.env.VERCEL) {
    waitUntil(task);
    return;
  }

  void task;
}
