/**
 * Compatibility facade for Meta Pixel helpers.
 * Prefer importing from `@/lib/meta/*` in new code.
 */

import { generateEventId, trackLead, trackMetaEvent } from "@/lib/meta/track";
import { sendMetaCapiEvent } from "@/lib/meta/capi-client";
import {
  getClientUserAgent,
  getEventSourceUrl,
  getMetaAttributionCookies,
} from "@/lib/meta/attribution";

// ── Standard Meta Pixel event name constants ──────────────────────────────
export const META_EVENTS = {
  pageView:         "PageView",
  viewContent:      "ViewContent",
  lead:             "Lead",
  contact:          "Contact",
  search:           "Search",
  initiateCheckout: "InitiateCheckout",
  purchase:         "Purchase",
} as const;

/** @deprecated Use standard Lead event via trackLead() */
export const META_FORM_SUBMIT_EVENT = "Lead";

export function fireLeadEvent(
  pixelId: string | undefined,
  formTitle: string,
  formId: string,
  eventId?: string
): string {
  const id = eventId || generateEventId("lead");
  if (!pixelId) return id;

  trackLead(
    {
      content_name: formTitle,
      content_category: "form_submission",
      content_ids: [formId],
      content_type: "form",
      form_name: formTitle,
      source: "oneform",
    },
    id
  );

  return id;
}

export function sendCAPIEvent(body: {
  pixelId: string;
  eventId: string;
  formId?: string;
  formTitle?: string;
  eventName?: string;
  eventSourceUrl?: string;
  email?: string;
  phone?: string;
  fbp?: string;
  fbc?: string;
  userAgent?: string;
  customData?: Record<string, string | number | string[] | boolean | undefined>;
}) {
  const attribution = getMetaAttributionCookies();

  void sendMetaCapiEvent({
    pixelId: body.pixelId,
    eventId: body.eventId,
    eventName: body.eventName || "Lead",
    formId: body.formId,
    formTitle: body.formTitle,
    eventSourceUrl: body.eventSourceUrl || getEventSourceUrl(),
    email: body.email,
    phone: body.phone,
    customData: {
      content_name: body.formTitle,
      content_category: "form_submission",
      ...(body.formId ? { content_ids: [body.formId] } : {}),
      content_type: "form",
      form_name: body.formTitle,
      source: "oneform",
      ...body.customData,
    },
  });

  // Keep signature compatibility — unused overrides still accepted.
  void body.fbp;
  void body.fbc;
  void body.userAgent;
  void attribution;
  void getClientUserAgent;
}

export { generateEventId, trackLead, trackMetaEvent };
export { sendMetaCapiEvent };

/** Alias with lowercase "api" casing — matches existing import sites. */
export const sendCapiEvent = sendCAPIEvent;
