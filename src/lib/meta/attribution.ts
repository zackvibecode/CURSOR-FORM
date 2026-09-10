/**
 * Meta attribution helpers — _fbp, _fbc, fbclid.
 * Client-safe. Never fabricates fbc without a real fbclid.
 */

import type { MetaAttributionCookies } from "@/lib/meta/types";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function writeCookie(name: string, value: string, maxAgeDays = 90): void {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Meta fbc format: fb.1.<creation_unix_ms>.<fbclid>
 * Only create when a real fbclid is present and _fbc is missing/stale.
 */
export function ensureMetaFbcFromFbclid(): string | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid")?.trim();
    if (!fbclid) return readCookie("_fbc");

    const existing = readCookie("_fbc");
    // Reuse existing cookie if it already ends with this fbclid.
    if (existing && existing.endsWith(`.${fbclid}`)) {
      return existing;
    }

    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    writeCookie("_fbc", fbc);
    return fbc;
  } catch {
    return readCookie("_fbc");
  }
}

export function getMetaAttributionCookies(): MetaAttributionCookies {
  ensureMetaFbcFromFbclid();
  return {
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
  };
}

export function getClientUserAgent(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  return navigator.userAgent || undefined;
}

export function getEventSourceUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

export function getPagePath(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname + window.location.search;
}
