import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateId(): string {
  return crypto.randomUUID();
}

// Deterministic date formatting.
// Intl / toLocale* output differs between Node (server) and browsers for some
// locales (e.g. en-MY gives "Sept" in Node but "Sep" in Chrome), which causes
// React hydration mismatches. These helpers never depend on ICU.
export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function formatDateOnly(date: string | Date): string {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  const hours = d.getHours();
  const suffix = hours < 12 ? "am" : "pm";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${pad2(d.getMinutes())} ${suffix}`;
}

export function formatDate(date: string | Date): string {
  return `${formatDateOnly(date)}, ${formatTime(date)}`;
}

/** Format a `YYYY-MM` key as e.g. "Oct 2026". */
export function formatMonthKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${MONTHS_SHORT[(month ?? 1) - 1] ?? ""} ${year}`;
}
