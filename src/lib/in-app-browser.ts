/**
 * Detect restrictive in-app browsers that block automatic WhatsApp redirects
 * (TikTok, Instagram, Facebook, etc.).
 */
export function isRestrictiveInAppBrowser(userAgent = ""): boolean {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!ua) return false;

  return (
    /TikTok|musical_ly|BytedanceWebview|TTWebView/i.test(ua) ||
    /Instagram/i.test(ua) ||
    /FBAN|FBAV|FB_IAB|FBAV/i.test(ua) ||
    /Line\//i.test(ua) ||
    /Snapchat/i.test(ua)
  );
}

export function getInAppBrowserName(userAgent = ""): string | null {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (/TikTok|musical_ly|BytedanceWebview|TTWebView/i.test(ua)) return "TikTok";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/FBAN|FBAV|FB_IAB|FBAV/i.test(ua)) return "Facebook";
  if (/Line\//i.test(ua)) return "LINE";
  if (/Snapchat/i.test(ua)) return "Snapchat";
  return null;
}
