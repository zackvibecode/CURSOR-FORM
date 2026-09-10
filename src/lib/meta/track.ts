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
 * Fire a standard Meta Pixel event (`fbq('track', ...)`).
 * Returns the eventID used (generated when not provided).
 */
export function trackMetaEvent(
  eventName: MetaEventName,
  params?: MetaEventParams,
  options?: MetaTrackOptions
): string {
  const eventID = options?.eventID || generateEventId(eventName.toLowerCase());
  const fbq = getFbq();

  const fire = (): boolean => {
    const fn = getFbq();
    if (!fn) return false;
    try {
      if (params && Object.keys(params).length > 0) {
        fn("track", eventName, params, { eventID });
      } else {
        fn("track", eventName, {}, { eventID });
      }
      logDev(`${eventName}`, { eventID, ...params });
      return true;
    } catch {
      return false;
    }
  };

  if (!fire()) {
    // Pixel may still be loading — retry briefly without blocking UX.
    if (typeof window !== "undefined") {
      let attempts = 0;
      const retry = window.setInterval(() => {
        attempts += 1;
        if (fire() || attempts >= 10) {
          window.clearInterval(retry);
        }
      }, 150);
    }
  }

  // Silence unused when fbq missing on first try — eventID still returned for CAPI.
  void fbq;
  return eventID;
}

/** Fire a custom Meta Pixel event (`fbq('trackCustom', ...)`). */
export function trackMetaCustomEvent(
  eventName: string,
  params?: MetaEventParams,
  options?: MetaTrackOptions
): string {
  const eventID = options?.eventID || generateEventId("custom");

  const fire = (): boolean => {
    const fn = getFbq();
    if (!fn) return false;
    try {
      if (params && Object.keys(params).length > 0) {
        fn("trackCustom", eventName, params, { eventID });
      } else {
        fn("trackCustom", eventName, {}, { eventID });
      }
      logDev(`Custom:${eventName}`, { eventID, ...params });
      return true;
    } catch {
      return false;
    }
  };

  if (!fire() && typeof window !== "undefined") {
    let attempts = 0;
    const retry = window.setInterval(() => {
      attempts += 1;
      if (fire() || attempts >= 10) {
        window.clearInterval(retry);
      }
    }, 150);
  }

  return eventID;
}

/** Convenience: PageView with optional shared eventID. */
export function trackPageView(eventID?: string): string {
  return trackMetaEvent("PageView", undefined, { eventID });
}

/** Convenience: ViewContent — call once per content view (guard in caller). */
export function trackViewContent(params: MetaEventParams, eventID?: string): string {
  return trackMetaEvent("ViewContent", params, { eventID });
}

/** Convenience: Contact (WhatsApp / phone / contact CTA). */
export function trackContact(params: MetaEventParams, eventID?: string): string {
  return trackMetaEvent("Contact", params, { eventID });
}

/**
 * Convenience: Lead — ONLY after confirmed successful form submission.
 * Returns eventID for CAPI deduplication.
 */
export function trackLead(params: MetaEventParams, eventID?: string): string {
  return trackMetaEvent("Lead", params, { eventID });
}
