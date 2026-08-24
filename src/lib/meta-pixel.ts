/**
 * Central Meta Pixel tracking utility (client-side).
 *
 * All browser-side Meta events go through this module so that:
 * - `window.fbq` is always checked safely (ad blockers / failed loads never crash the app)
 * - event IDs are generated in one place and can be shared with the
 *   Conversions API endpoint for browser/server deduplication
 * - attribution identifiers (_fbp / _fbc / fbclid) are handled consistently
 */

export const META_EVENTS = {
  pageView: "PageView",
  viewContent: "ViewContent",
  lead: "Lead",
  contact: "Contact",
  search: "Search",
} as const;

export type MetaStandardEvent = (typeof META_EVENTS)[keyof typeof META_EVENTS];

export interface MetaEventParams {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  form_name?: string;
  form_id?: string;
  source?: string;
  search_string?: string;
  contact_method?: string;
  page_path?: string;
  [key: string]: unknown;
}

const DEV = process.env.NODE_ENV === "development";
const MAX_FIRE_ATTEMPTS = 12;
const FIRE_RETRY_MS = 150;
const FBCLID_STORAGE_KEY = "oneform_fbclid";
const FBP_PATTERN = /^fb\.1\.\d+\.\d+$/;
const FBC_PATTERN = /^fb\.1\.\d+\.[A-Za-z0-9_-]+$/;

function devLog(scope: string, message: string, data?: Record<string, unknown>) {
  if (DEV) {
    console.log(`[${scope}] ${message}`, data ?? "");
  }
}

/**
 * Generate a unique event ID.
 * For conversions tracked by BOTH browser Pixel and server CAPI, generate the
 * ID once and pass the same value to both — that is what deduplicates them.
 */
export function generateEventId(prefix = "evt"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

type FbqCommand = "track" | "trackCustom" | "trackSingle" | "trackSingleCustom";

function fireFbq(
  command: FbqCommand,
  eventName: string,
  params: MetaEventParams | undefined,
  eventId: string | undefined,
  pixelId: string | undefined
): boolean {
  if (typeof window === "undefined") return false;

  const isSingle = command === "trackSingle" || command === "trackSingleCustom";
  if (isSingle && !pixelId) return false;

  const args: unknown[] = isSingle
    ? [pixelId, eventName, params ?? {}]
    : [eventName, params ?? {}];
  if (eventId) args.push({ eventID: eventId });

  try {
    if (typeof window.fbq === "function") {
      window.fbq(command, ...args);
      return true;
    }

    if (typeof window._fbq === "function") {
      // Base code ran but fbevents.js is still loading — _fbq IS the fbq stub,
      // which queues the call itself.
      window._fbq(command, ...args);
      return true;
    }
  } catch {
    // Never let tracking break the app.
  }

  return false;
}

/**
 * Retries a fbq call until the pixel loads (fbevents.js is async).
 * Gives up silently after ~1.8s — tracking must never block the UI.
 */
function fireWhenReady(fire: () => boolean): void {
  if (typeof window === "undefined") return;
  if (fire()) return;

  let attempts = 0;
  const retry = window.setInterval(() => {
    attempts += 1;
    if (fire() || attempts >= MAX_FIRE_ATTEMPTS) {
      window.clearInterval(retry);
    }
  }, FIRE_RETRY_MS);
}

/**
 * Fire a Meta standard event (PageView, Lead, Contact, ...). Returns the event ID used.
 *
 * Pass `pixelId` to scope the event to ONE pixel (fbq trackSingle). This is
 * required in multi-pixel setups — on a public form page both the site pixel
 * (NEXT_PUBLIC_META_PIXEL_ID) and the form owner's pixel may be initialised,
 * and a plain `fbq('track')` would send the event to BOTH data sources.
 */
export function trackMetaEvent(
  eventName: MetaStandardEvent,
  params?: MetaEventParams,
  eventId?: string,
  pixelId?: string
): string {
  const id = eventId ?? generateEventId(eventName.toLowerCase().replace(/\s+/g, "_"));
  const command: FbqCommand = pixelId ? "trackSingle" : "track";
  fireWhenReady(() => fireFbq(command, eventName, params, id, pixelId));
  devLog("Meta Pixel", eventName, { ...params, eventID: id });
  return id;
}

/**
 * Fire a Meta custom event (use sparingly — standard events are optimizable).
 * Pass `pixelId` to scope the event to one pixel (fbq trackSingleCustom).
 */
export function trackMetaCustomEvent(
  eventName: string,
  params?: MetaEventParams,
  eventId?: string,
  pixelId?: string
): string {
  const id = eventId ?? generateEventId(eventName.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
  const command: FbqCommand = pixelId ? "trackSingleCustom" : "trackCustom";
  fireWhenReady(() => fireFbq(command, eventName, params, id, pixelId));
  devLog("Meta Pixel", eventName, { ...params, eventID: id });
  return id;
}

/* ------------------------------------------------------------------ */
/* Attribution identifiers (_fbp / _fbc / fbclid)                      */
/* ------------------------------------------------------------------ */

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

interface StoredFbclid {
  fbclid: string;
  ts: number;
}

function readStoredFbclid(): StoredFbclid | null {
  try {
    const raw = window.localStorage.getItem(FBCLID_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredFbclid;
    if (!parsed?.fbclid || typeof parsed.fbclid !== "string") return null;
    return { fbclid: parsed.fbclid, ts: parsed.ts || Date.now() };
  } catch {
    return null;
  }
}

/**
 * Persist the fbclid query parameter on landing so it survives client-side
 * navigation. Meta's pixel normally sets the _fbc cookie from it, but the
 * cookie is only written on pages where a pixel is installed — this storage
 * covers visitors who land on pages without one.
 */
export function captureFbclid(): void {
  if (typeof window === "undefined") return;
  try {
    const fbclid = new URL(window.location.href).searchParams.get("fbclid");
    if (!fbclid) return;
    window.localStorage.setItem(
      FBCLID_STORAGE_KEY,
      JSON.stringify({ fbclid, ts: Date.now() } satisfies StoredFbclid)
    );
  } catch {
    // localStorage unavailable — _fbc cookie path still works.
  }
}

/** Read the Meta browser ID cookie `_fbp` if present and well-formed. */
export function getFbp(): string | undefined {
  const fbp = readCookie("_fbp");
  return fbp && FBP_PATTERN.test(fbp) ? fbp : undefined;
}

/**
 * Read the Meta click ID `_fbc`.
 *
 * Priority:
 * 1. The `_fbc` cookie set by the pixel.
 * 2. A stored `fbclid` (localStorage or current URL) formatted per Meta's
 *    expected `fb.1.<timestamp>.<fbclid>` shape. Never fabricated — a real
 *    Facebook click identifier must exist for this to return a value.
 */
export function getFbc(): string | undefined {
  const cookieFbc = readCookie("_fbc");
  if (cookieFbc && FBC_PATTERN.test(cookieFbc)) return cookieFbc;

  if (typeof window === "undefined") return undefined;

  const stored = readStoredFbclid();
  if (stored) return `fb.1.${stored.ts}.${stored.fbclid}`;

  try {
    const fbclid = new URL(window.location.href).searchParams.get("fbclid");
    if (fbclid) return `fb.1.${Date.now()}.${fbclid}`;
  } catch {
    // URL parsing failed — no fallback available.
  }

  return undefined;
}

/* ------------------------------------------------------------------ */
/* Conversions API (server proxy)                                     */
/* ------------------------------------------------------------------ */

export interface SendCapiEventOptions {
  /** Tenant pixel ID that the browser pixel was initialised with. */
  pixelId: string;
  eventName: MetaStandardEvent;
  /** MUST be the same event ID the browser pixel used for this conversion. */
  eventId: string;
  eventSourceUrl: string;
  formId?: string;
  formTitle?: string;
  source?: string;
  /** Real submission ID from the backend — used as external_id for matching. */
  leadId?: string;
  /** First-party data provided by the visitor in the form (hashed server-side). */
  email?: string;
  phone?: string;
}

/**
 * Forward a confirmed conversion to the server-side Conversions API proxy.
 * Fire-and-forget: CAPI failures must never affect the user flow.
 */
export function sendCapiEvent(options: SendCapiEventOptions): void {
  if (typeof window === "undefined") return;

  void fetch("/api/meta/conversions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...options,
      fbp: getFbp(),
      fbc: getFbc(),
      userAgent: navigator.userAgent,
    }),
    keepalive: true,
  })
    .then((res) => {
      if (res.ok) {
        res
          .json()
          .then((data: { success?: boolean; reason?: string }) => {
            if (data?.success) {
              devLog("Meta CAPI", `${options.eventName} sent`, {
                eventID: options.eventId,
              });
            } else {
              devLog("Meta CAPI", `${options.eventName} skipped`, {
                reason: data?.reason ?? "unknown",
                eventID: options.eventId,
              });
            }
          })
          .catch(() => {
            devLog("Meta CAPI", `${options.eventName} sent`, {
              eventID: options.eventId,
            });
          });
      } else {
        devLog("Meta CAPI", `${options.eventName} failed`, {
          status: res.status,
          eventID: options.eventId,
        });
      }
    })
    .catch(() => {
      // Network error — ignore, never surface to the user.
    });
}
