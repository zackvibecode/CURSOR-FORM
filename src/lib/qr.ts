export const QR_PRESET_COLORS = [
  { label: "Black", value: "000000" },
  { label: "WhatsApp Green", value: "10D050" },
  { label: "Blue", value: "2563EB" },
  { label: "Purple", value: "7C3AED" },
  { label: "Red", value: "DC2626" },
  { label: "Orange", value: "EA580C" },
];

const MIN_SIZE = 128;
const MAX_SIZE = 512;

export function buildQrImageUrl({
  data,
  size,
  fgColor,
  bgColor = "ffffff",
}: {
  data: string;
  size: number;
  fgColor: string;
  bgColor?: string;
}) {
  if (!data) return "";
  const clamped = Math.min(Math.max(Math.round(size), MIN_SIZE), MAX_SIZE);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${clamped}x${clamped}&data=${encodeURIComponent(
    data
  )}&color=${fgColor}&bgcolor=${bgColor}`;
}

const PLACEHOLDER_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

/**
 * QR codes must encode an absolute, publicly reachable URL. Env-var based
 * helpers fall back to a relative path or `http://localhost:3000`, both of
 * which produce unscannable codes in production. Resolve the target against
 * the runtime origin and drop placeholder hosts.
 */
export function toPublicQrUrl(url: string) {
  if (!url) return "";
  if (typeof window === "undefined") return url;

  try {
    const parsed = new URL(url, window.location.origin);
    if (PLACEHOLDER_HOSTS.has(parsed.hostname)) {
      if (PLACEHOLDER_HOSTS.has(window.location.hostname)) return parsed.toString();
      return new URL(parsed.pathname + parsed.search + parsed.hash, window.location.origin)
        .toString();
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

export function getSafeDownloadName(base: string) {
  const safe = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return safe || "qr-code";
}

export async function downloadQrImage(imageUrl: string, filenameBase: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`QR image request failed: ${response.status}`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.download = `${getSafeDownloadName(filenameBase)}.png`;
    link.href = objectUrl;
    link.click();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
