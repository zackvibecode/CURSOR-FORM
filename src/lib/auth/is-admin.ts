import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the configured admin emails (lowercased) from the ADMIN_EMAILS env.
 * Format: comma-separated list, e.g. "me@biz.com, partner@biz.com".
 */
export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** True if the given email is in the admin allow-list. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

/**
 * Resolves the currently logged-in user and whether they are an admin.
 * Pass a server-side Supabase client (from `@/lib/supabase/server`).
 */
export async function getAdminContext(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    user,
    isAdmin: isAdminEmail(user?.email),
  };
}
