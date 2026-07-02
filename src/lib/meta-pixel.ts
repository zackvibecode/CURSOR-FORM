export const META_FORM_SUBMIT_EVENT = "zaqoneformSubmit";

export function trackFormSubmit(
  pixelId: string | undefined,
  title: string,
  formId: string
) {
  if (!pixelId || typeof window === "undefined" || !window.fbq) return;

  const payload = {
    content_name: title,
    content_category: "form_submission",
    form_id: formId,
  };

  window.fbq("track", "Lead", payload);
  window.fbq("trackCustom", META_FORM_SUBMIT_EVENT, payload);
}
