import { MONTHS_SHORT } from "./utils";
import { rangeStart } from "./overview-stats";

export const TEAM_RANGES = ["this_month", "7", "30", "90", "all"] as const;

export type TeamRange = (typeof TEAM_RANGES)[number];

export const DEFAULT_TEAM_RANGE: TeamRange = "this_month";

export function parseTeamRange(value: string | string[] | undefined): TeamRange {
  const raw = Array.isArray(value) ? value[0] : value;
  return (TEAM_RANGES as readonly string[]).includes(raw ?? "")
    ? (raw as TeamRange)
    : DEFAULT_TEAM_RANGE;
}

export interface TeamRangeWindow {
  since: Date | null;
  until: Date;
  label: string;
}

export function teamRangeWindow(range: TeamRange, now: Date = new Date()): TeamRangeWindow {
  const until = now;

  if (range === "all") {
    return { since: null, until, label: "All time" };
  }

  if (range === "this_month") {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const since = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return { since, until, label: `1 – ${lastDay} ${MONTHS_SHORT[month]} ${year}` };
  }

  const days = Number(range);
  return { since: rangeStart(days, now), until, label: `Last ${days} days` };
}

export function sharePercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

interface TeamMemberInput {
  name: string;
  country_code: string;
  phone_number: string;
  active: boolean;
}

interface TeamClickInput {
  assigned_member_id: string | null;
  assigned_name: string | null;
  assigned_phone: string | null;
}

export interface TeamMemberRow {
  key: string;
  name: string;
  phone: string | null;
  clicks: number;
  percent: number;
}

/**
 * Build the leaderboard. Active team members are seeded first (so members with
 * zero redirects still appear), then any historical assignee not in the current
 * roster is merged in.
 */
export function aggregateTeamMembers(
  members: TeamMemberInput[],
  clicks: TeamClickInput[]
): TeamMemberRow[] {
  const map = new Map<string, { key: string; name: string; phone: string | null; clicks: number }>();

  for (const member of members) {
    if (!member.active) continue;
    const phone = member.phone_number ? `${member.country_code}${member.phone_number}` : null;
    const key = phone ?? member.name;
    if (!key || map.has(key)) continue;
    map.set(key, { key, name: member.name || "Unnamed", phone, clicks: 0 });
  }

  for (const click of clicks) {
    const key = click.assigned_phone || click.assigned_name || "unassigned";
    let row = map.get(key);
    if (!row) {
      row = {
        key,
        name: click.assigned_name || "Unassigned",
        phone: click.assigned_phone,
        clicks: 0,
      };
      map.set(key, row);
    }
    row.clicks += 1;
  }

  const total = Array.from(map.values()).reduce((sum, row) => sum + row.clicks, 0);

  return Array.from(map.values())
    .map((row) => ({ ...row, percent: sharePercent(row.clicks, total) }))
    .sort((a, b) => b.clicks - a.clicks || a.name.localeCompare(b.name));
}

export type TeamInsightTone = "top" | "balanced" | "growth" | "people";

export interface TeamInsight {
  id: string;
  tone: TeamInsightTone;
  title: string;
  description: string;
}

function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function buildTeamInsights(rows: TeamMemberRow[]): TeamInsight[] {
  const withClicks = rows.filter((row) => row.clicks > 0);
  const top = withClicks[0];
  const top4 = withClicks.slice(0, 4);

  const insights: TeamInsight[] = [];

  if (top) {
    insights.push({
      id: "top",
      tone: "top",
      title: "Top performer",
      description: `${top.name} received ${top.clicks} redirect${top.clicks === 1 ? "" : "s"} (${top.percent}%).`,
    });
  }

  if (top4.length >= 3) {
    const avgShare = Math.round(
      top4.reduce((sum, row) => sum + row.percent, 0) / top4.length
    );
    const balanced = top4.every((row) => Math.abs(row.percent - top4[0].percent) <= 2.5);
    insights.push({
      id: "balanced",
      tone: "balanced",
      title: "Balanced distribution",
      description: balanced
        ? `Top ${top4.length} members received ~${avgShare}% each.`
        : `Redirects are spread across ${withClicks.length} members.`,
    });
  } else {
    insights.push({
      id: "balanced",
      tone: "balanced",
      title: "Balanced distribution",
      description:
        withClicks.length > 0
          ? `Redirects are spread across ${withClicks.length} member${withClicks.length === 1 ? "" : "s"}.`
          : "No redirects assigned yet in this period.",
    });
  }

  const lowest = withClicks
    .slice(-3)
    .filter((row) => row.clicks > 0 && row.key !== top?.key)
    .map((row) => row.name)
    .filter(Boolean);

  if (lowest.length > 0) {
    insights.push({
      id: "growth",
      tone: "growth",
      title: "Growth opportunity",
      description: `${listNames(lowest)} ${lowest.length === 1 ? "has" : "have"} room to grow.`,
    });
  }

  insights.push({
    id: "people",
    tone: "people",
    title: "People power results",
    description: "Different strengths. A stronger OneForm.",
  });

  return insights;
}
