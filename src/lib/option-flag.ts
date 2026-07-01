/** Parse options like "ID Makassar" → country code + display label. */
export function parseOptionFlag(
  option: string
): { code: string; label: string } | null {
  const match = option.match(/^([A-Za-z]{2})\s+(.+)$/);
  if (!match) return null;
  return { code: match[1].toUpperCase(), label: match[2] };
}

/** Emoji flag for native <select> options (images not supported inside <option>). */
export function countryCodeToFlagEmoji(code: string): string {
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return "";
  return String.fromCodePoint(
    ...[...upper].map((char) => 0x1f1e6 - 65 + char.charCodeAt(0))
  );
}

export function formatOptionDisplay(option: string): string {
  const parsed = parseOptionFlag(option);
  if (!parsed) return option;
  const flag = countryCodeToFlagEmoji(parsed.code);
  return flag ? `${flag} ${parsed.label}` : parsed.label;
}
