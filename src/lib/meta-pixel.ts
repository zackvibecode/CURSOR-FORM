/**
 * Meta Pixel client-side tracking with Conversions API deduplication.
 *
 * The same `event_id` is used for the browser `fbq('track','Lead')` call and
 * the server-side CAPI request so Meta can deduplicate the two sources.
 */

export interface LeadTrackingResult {
  eventId: string;
  fired: boolean;
}

export interface LeadTrackingContext {
  title: string;
  formId: string;
  /** Email collected by the form, if any (will NOT be hashed client-side). */
  email?: string;
  /** Phone collected by the form, if any (will NOT be hashed client-side). */
  phone?: string;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Fire the browser Pixel Lead event with a unique event_id.
 * Returns the event_id so it can be sent to the CAPI route.
 */
export function fireBrowserLeadEvent(
  pixelId: string | undefined,
  ctx: LeadTrackingContext
): LeadTrackingResult {
  const eventId = `${ctx.formId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  if (!pixelId || typeof window === "undefined") {
    if (process.env.NODE_ENV === "development") {
      console.log("[meta-pixel] skip browser Lead — no pixelId or SSR", { pixelId, eventId });
    }
    return { eventId, fired: false };
  }

  const payload = {
    content_name: ctx.title,
    content_category: "form_submission",
    form_id: ctx.formId,
  };

  const fire = () => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead", payload, { eventID: eventId });
      if (process.env.NODE_ENV === "development") {
        console.log("[meta-pixel] browser Lead fired", { eventId, pixelId });
      }
      return true;
    }
    if (window._fbq) {
      window._fbq.push(["track", "Lead", payload, { eventID: eventId }]);
      return true;
    }
    return false;
  };

  if (!fire()) {
    let attempts = 0;
    const retry = window.setInterval(() => {
      attempts += 1;
      if (fire() || attempts >= 10) {
        window.clearInterval(retry);
      }
    }, 150);
  }

  return { eventId, fired: true };
}

/**
 * Collect browser-side user_data that cannot be inferred server-side:
 * fbp cookie, fbc cookie, and user agent. Email/phone are passed raw
 * and hashed server-side.
 */
export function collectBrowserUserData(ctx: LeadTrackingContext) {
  return {
    email: ctx.email || undefined,
    phone: ctx.phone || undefined,
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    eventId: "",
  };
}

/**
 * Send the same event_id + user_data to the CAPI route for server-side
 * deduplication. Uses keepalive so the request survives the WhatsApp redirect.
 */
export function sendLeadToCAPI(
  endpoint: string,
  body: {
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
) {
  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // keepalive helps the request finish during navigation to WhatsApp
  });
}
