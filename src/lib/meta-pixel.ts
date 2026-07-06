export const META_FORM_SUBMIT_EVENT = "zaqoneformSubmit";

export function trackFormSubmit(
  pixelId: string | undefined,
  title: string,
  formId: string
) {
  if (!pixelId || typeof window === "undefined") return;

  const payload = {
    content_name: title,
    content_category: "form_submission",
    form_id: formId,
  };

  const fire = () => {
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead", payload);
      window.fbq("trackCustom", META_FORM_SUBMIT_EVENT, payload);
      return true;
    }
    if (window._fbq) {
      window._fbq.push(["track", "Lead", payload]);
      window._fbq.push(["trackCustom", META_FORM_SUBMIT_EVENT, payload]);
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
}
