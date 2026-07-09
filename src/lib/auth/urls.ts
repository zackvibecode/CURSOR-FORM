import { safeRedirectPath } from "@/lib/auth/safe-path";

const DEFAULT_APP_URL = "http://localhost:3000";

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || DEFAULT_APP_URL;
}

export function getAuthConfirmUrl(nextPath = "/dashboard/forms") {
  const url = new URL("/auth/confirm", getAppUrl());
  url.searchParams.set("next", safeRedirectPath(nextPath));
  return url.toString();
}

export function getAuthCallbackUrl(nextPath = "/dashboard/forms") {
  const url = new URL("/auth/callback", getAppUrl());
  url.searchParams.set("next", safeRedirectPath(nextPath));
  return url.toString();
}
