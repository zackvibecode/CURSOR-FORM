/**
 * Meta Pixel tracking — fires Lead event on successful form submit.
 */

export function fireLeadEvent(
  pixelId: string | undefined,
  formTitle: string,
  formId: string
): string {
  const eventId = `${formId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  if (!pixelId || typeof window === "undefined") return eventId;

  const payload = {
    content_name: formTitle,
    content_category: "form_submission",
    form_id: formId,
  };

  const fire = () => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead", payload, { eventID: eventId });
      if (process.env.NODE_ENV === "development") {
        console.log("[meta-pixel] Lead fired", { eventId, pixelId, formTitle });
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

  return eventId;
}

export function sendCAPIEvent(body: {
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
}) {
  void fetch("/api/meta/conversions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}
