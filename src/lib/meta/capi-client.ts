/**
 * Client helper to send Meta Conversions API events via our secure API route.
 * Never exposes the CAPI access token. Failures are swallowed.
 */

import type { MetaCapiLeadPayload, MetaEventName, MetaEventParams } from "@/lib/meta/types";
import {
  getClientUserAgent,
  getEventSourceUrl,
  getMetaAttributionCookies,
} from "@/lib/meta/attribution";

const DEBUG = process.env.NODE_ENV === "development";

export async function sendMetaCapiEvent(input: {
  pixelId: string;
  eventId: string;
  eventName?: MetaEventName;
  formId?: string;
  formTitle?: string;
  email?: string;
  phone?: string;
  customData?: MetaEventParams;
  eventSourceUrl?: string;
}): Promise<void> {
  if (!input.pixelId || !input.eventId) return;
  if (typeof window === "undefined") return;

  const { fbp, fbc } = getMetaAttributionCookies();

  const body: MetaCapiLeadPayload = {
    pixelId: input.pixelId,
    eventId: input.eventId,
    eventName: input.eventName || "Lead",
    formId: input.formId,
    formTitle: input.formTitle,
    eventSourceUrl: input.eventSourceUrl || getEventSourceUrl(),
    email: input.email,
    phone: input.phone,
    fbp,
    fbc,
    userAgent: getClientUserAgent(),
    customData: input.customData,
  };

  try {
    const res = await fetch("/api/meta/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });

    if (DEBUG) {
      const result = await res.json().catch(() => ({}));
      if (result?.success) {
        console.log(`[Meta CAPI] ${body.eventName} sent successfully`, {
          eventId: input.eventId,
        });
      } else {
        console.log(`[Meta CAPI] ${body.eventName} skipped/failed`, {
          eventId: input.eventId,
          reason: result?.reason || result?.error || res.status,
        });
      }
    }
  } catch {
    if (DEBUG) {
      console.log(`[Meta CAPI] ${input.eventName || "Lead"} network error`, {
        eventId: input.eventId,
      });
    }
  }
}
