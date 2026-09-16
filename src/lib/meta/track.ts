/**
 * Client-side Meta Pixel tracking utilities.
 * Never throws — Meta failures must not break the app.
 */

import type { MetaEventName, MetaEventParams, MetaTrackOptions } from "@/lib/meta/types";

const DEBUG = process.env.NODE_ENV === "development";

function logDev(message: string, data?: Record<string, unknown>) {
  if (!DEBUG) return;
  if (data) {
    console.log(`[Meta Pixel] ${message}`, data);
  } else {
    console.log(`[Meta Pixel] ${message}`);
  }
}

/** Unique event ID shared between browser Pixel and server CAPI. */
export function generateEventId(prefix = "meta"): string {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${Date.now()}_${rand}`;
}

function getFbq(): ((...args: unknown[]) => void) | null {
  if (typeof window === "undefined") return null;
  if (typeof window.fbq === "function") return window.fbq;
  return null;
}

/**
 * Send one command to fbq.
 *
 * When `pixelId` is set we use `trackSingle` / `trackSingleCustom`, which
 * scopes the event to a single pixel ID. Without it a plain `track` reaches
 * every initialised pixel on the page (site pixel + form owner pixel), which
 * duplicates PageView and leaks one tenant's Lead into another data source.
 */
function fireFbq(
  custom: boolean,
  eventName: MetaEventName,
  params: MetaEventParams | undefined,
  eventID: string,
  pixelId: string | undefined
): boolean {
  const fn = getFbq();
  if (!fn) return false;

  const safeParams = params && Object.keys(params).length > 0 ? params : {};
  const args: unknown[] = pixelId
    ? [pixelId, eventName, safeParams, { eventID }]
    : [eventName, safeParams, { eventID }];

  let command: string;
  if (custom) {
    command = pixelId ? "trackSingleCustom" : "trackCustom";
  } else {
    command = pixelId ? "trackSingle" : "track";
  }

  try {
    fn(command, ...args);
    return true;
  } catch {
    return false;
  }
}

function fireWhenReady(
  custom: boolean,
  eventName: MetaEventName,
  params: MetaEventParams | undefined,
  eventID: string,
  pixelId: string | undefined
): void {
  if (fireFbq(custom, eventName, params, eventID, pixelId)) return;
  if (typeof window === "undefined") return;

  // Pixel may still be loading — retry briefly without blocking UX.
  let attempts = 0;
  const retry = window.setInterval(() => {
    attempts += 1;
    if (fireFbq(custom, eventName, params, eventID, pixelId) || attempts >= 10) {
      window.clearInterval(retry);
    }
  }, 150);
}

/**
 * Fire a standard Meta Pixel event (`fbq('track', ...)`).
 * Pass `options.pixelId` to scope the event to ONE pixel.
 * Returns the eventID used (generated when not provided).
 */
export function trackMetaEvent(
  eventName: MetaEventName,
  params?: MetaEventParams,
  options?: MetaTrackOptions
): string {
  const eventID = options?.eventID || generateEventId(eventName.toLowerCase());
  fireWhenReady(false, eventName, params, eventID, options?.pixelId);
  logDev(`${eventName}`, { eventID, pixelId: options?.pixelId, ...params });
  return eventID;
}

/** Fire a custom Meta Pixel event (`fbq('trackCustom', ...)`). */
export function trackMetaCustomEvent(
  eventName: string,
  params?: MetaEventParams,
  options?: MetaTrackOptions
): string {
  const eventID = options?.eventID || generateEventId("custom");
  fireWhenReady(true, eventName, params, eventID, options?.pixelId);
  logDev(`Custom:${eventName}`, { eventID, pixelId: options?.pixelId, ...params });
  return eventID;
}

/** Convenience: PageView with optional shared eventID and target pixel. */
export function trackPageView(eventID?: string, pixelId?: string): string {
  return trackMetaEvent("PageView", undefined, { eventID, pixelId });
}

/** Convenience: ViewContent — call once per content view (guard in caller). */
export function trackViewContent(
  params: MetaEventParams,
  eventID?: string,
  pixelId?: string
): string {
  return trackMetaEvent("ViewContent", params, { eventID, pixelId });
}

/** Convenience: Contact (WhatsApp / phone / contact CTA). */
export function trackContact(
  params: MetaEventParams,
  eventID?: string,
  pixelId?: string
): string {
  return trackMetaEvent("Contact", params, { eventID, pixelId });
}

/**
 * Convenience: Lead — ONLY after confirmed successful form submission.
 * Returns eventID for CAPI deduplication.
 */
export function trackLead(
  params: MetaEventParams,
  eventID?: string,
  pixelId?: string
): string {
  return trackMetaEvent("Lead", params, { eventID, pixelId });
}
