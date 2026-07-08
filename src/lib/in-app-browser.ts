/**
 * Detect restrictive in-app browsers that block WhatsApp / external app redirects
 * (TikTok, Instagram, Facebook, etc.).
 *
 * TikTok UA varies by OS/version — match widely (ByteDance, TTWebView, etc.).
 */
export function isRestrictiveInAppBrowser(userAgent = ""): boolean {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!ua) return false;

  return (
    /TikTok/i.test(ua) ||
    /musical_ly/i.test(ua) ||
    /BytedanceWebview|ByteDance|TTWebView|ttwebview/i.test(ua) ||
    /Aweme/i.test(ua) ||
    /Instagram/i.test(ua) ||
    /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua) ||
    /Line\//i.test(ua) ||
    /Snapchat/i.test(ua)
  );
}

export function getInAppBrowserName(userAgent = ""): string | null {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (/TikTok|musical_ly|BytedanceWebview|ByteDance|TTWebView|Aweme/i.test(ua)) return "TikTok";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua)) return "Facebook";
  if (/Line\//i.test(ua)) return "LINE";
  if (/Snapchat/i.test(ua)) return "Snapchat";
  return null;
}

/** Manual WhatsApp screen only for TikTok when form TikTok mode is enabled. */
export function shouldUseTikTokWhatsAppWorkaround(
  tiktokModeEnabled: boolean,
  userAgent = ""
): boolean {
  if (!tiktokModeEnabled) return false;
  return getInAppBrowserName(userAgent) === "TikTok";
}

/** Android WhatsApp intent — sometimes opens the app without TikTok's wa.me block page. */
export function buildWhatsAppAndroidIntent(phone: string, textEncoded: string): string {
  return `intent://send/?phone=${phone}&text=${textEncoded}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
}

export function buildWhatsAppDeepLink(phone: string, textEncoded: string): string {
  return `whatsapp://send?phone=${phone}&text=${textEncoded}`;
}

export function isAndroid(userAgent = ""): boolean {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return /Android/i.test(ua);
}
