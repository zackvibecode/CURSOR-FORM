import { MONTHS_SHORT } from "./utils";

export const OVERVIEW_RANGES = [7, 30, 90] as const;

export type OverviewRange = (typeof OVERVIEW_RANGES)[number];

export const DEFAULT_OVERVIEW_RANGE: OverviewRange = 30;

export function parseOverviewRange(value: string | string[] | undefined): OverviewRange {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return (OVERVIEW_RANGES as readonly number[]).includes(parsed)
    ? (parsed as OverviewRange)
    : DEFAULT_OVERVIEW_RANGE;
}

/** UTC midnight `days - 1` days ago (inclusive start of the current window). */
export function rangeStart(days: number, now: Date = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d;
}

/** UTC midnight start of the window immediately before the current one. */
export function previousRangeStart(days: number, now: Date = new Date()): Date {
  const d = rangeStart(days, now);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

export interface SeriesPoint {
  date: string;
  label: string;
  value: number;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function formatDayLabel(key: string): string {
  const [, month, day] = key.split("-").map(Number);
  return `${MONTHS_SHORT[(month ?? 1) - 1] ?? ""} ${day ?? 1}`;
}

export function formatDayFull(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return `${day ?? 1} ${MONTHS_SHORT[(month ?? 1) - 1] ?? ""} ${year}`;
}

/** Build a zero-filled daily series (oldest → newest) for the given range. */
export function buildSeries(
  dates: string[],
  days: number,
  now: Date = new Date()
): SeriesPoint[] {
  const counts = new Map<string, number>();
  for (const iso of dates) {
    const key = dayKey(iso);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const base = rangeStart(days, now);
  const series: SeriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, label: formatDayLabel(key), value: counts.get(key) ?? 0 });
  }
  return series;
}

export interface MonthPoint {
  key: string;
  label: string;
  value: number;
}

/** Zero-filled monthly series (oldest → newest) ending on the current UTC month. */
export function buildMonthlySeries(
  dates: string[],
  months: number,
  now: Date = new Date()
): MonthPoint[] {
  const counts = new Map<string, number>();
  for (const iso of dates) {
    const key = iso.slice(0, 7);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const result: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(anchor);
    d.setUTCMonth(anchor.getUTCMonth() - i);
    const key = d.toISOString().slice(0, 7);
    result.push({
      key,
      label: MONTHS_SHORT[d.getUTCMonth()] ?? "",
      value: counts.get(key) ?? 0,
    });
  }
  return result;
}

/**
 * Percentage change between two periods.
 * Returns `null` when there is no baseline to compare against (previous = 0, current > 0).
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export interface RankedItem {
  key: string;
  count: number;
}

/** Rank keyed counts, highest first. Ties fall back to the original insertion order. */
export function topItems(counts: Map<string, number>, limit: number): RankedItem[] {
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Canonical "real click" predicate for direct-link analytics.
 * Bots and non-OK redirects are excluded everywhere (Overview + Direct Link Reports).
 */
export interface ClickLike {
  is_bot: boolean;
  redirect_status: string;
}

export function isRealClick(click: ClickLike): boolean {
  return !click.is_bot && click.redirect_status === "ok";
}

export function countBy<T>(items: T[], key: (item: T) => string | null | undefined) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}
