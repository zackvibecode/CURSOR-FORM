/** App routes that cannot be used as public form slugs. */
export const RESERVED_FORM_SLUGS = new Set([
  "api",
  "auth",
  "d",           // Direct Links public route: /d/[slug]
  "dashboard",
  "demo",
  "f",
  "login",
  "pricing",
  "signup",
  "tools",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_FORM_SLUGS.has(slug.toLowerCase());
}
