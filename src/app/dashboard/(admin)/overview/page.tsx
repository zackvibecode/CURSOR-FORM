import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { SubmissionsTable } from "@/components/dashboard/SubmissionsTable";
import { CreateFormButton } from "@/components/dashboard/DashboardHeader";
import { OverviewKpiCard } from "@/components/dashboard/OverviewKpiCard";
import { OverviewCharts } from "@/components/dashboard/OverviewCharts";
import { OverviewRangeSelect } from "@/components/dashboard/OverviewRange";
import { OverviewTopList, type OverviewTopItem } from "@/components/dashboard/OverviewTopList";
import { extractCustomers, mapSubmissionsToRows } from "@/lib/dashboard-stats";
import type { SubmissionRow } from "@/components/dashboard/SubmissionsTable";
import { getPlanLimits } from "@/lib/plan-limits";
import {
  buildSeries,
  countBy,
  isRealClick,
  parseOverviewRange,
  percentChange,
  previousRangeStart,
  rangeStart,
  topItems,
} from "@/lib/overview-stats";
import { FileText, Inbox, Link2, MousePointerClick, Users } from "lucide-react";

export const dynamic = "force-dynamic";

interface RawClick {
  direct_link_id: string;
  clicked_at: string;
  is_bot: boolean;
  redirect_status: string;
}

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams?: { range?: string | string[] };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const days = parseOverviewRange(searchParams?.range);
  const now = new Date();
  const since = rangeStart(days, now);
  const prevSince = previousRangeStart(days, now);
  const sinceIso = since.toISOString();
  const prevSinceIso = prevSince.toISOString();
  const firstDayOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();

  // ── Round 1: workspace-wide collections ─────────────────────────────────
  const [formsResult, linksResult, subResult] = await Promise.all([
    supabase
      .from("forms")
      .select("id, title, slug, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("direct_links")
      .select("id, name, slug, total_clicks, created_at")
      .eq("user_id", user.id),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const forms = (formsResult.data ?? []) as {
    id: string;
    title: string;
    slug: string;
    created_at: string;
  }[];
  const links = (linksResult.data ?? []) as {
    id: string;
    name: string;
    slug: string;
    total_clicks: number;
    created_at: string;
  }[];
  const subscription = subResult.data as { plan?: string; status?: string } | null;

  const formIds = forms.map((f) => f.id);
  const linkIds = links.map((l) => l.id);
  const allFormIds = formIds.length > 0 ? formIds : ["none"];
  const allLinkIds = linkIds.length > 0 ? linkIds : ["none"];

  // ── Round 2: scoped fields + windowed rows + exact period counts ────────
  const [
    fieldsResult,
    windowSubs,
    windowClicks,
    allTimeSubsResult,
    prevSubsCountResult,
    currentSubsCountResult,
    currentClicksCountResult,
    prevClicksCountResult,
    monthResult,
  ] = await Promise.all([
    supabase
      .from("form_fields")
      .select("id, label, type, form_id")
      .in("form_id", allFormIds),
    fetchAllRows<any>((from, to) =>
      supabase
        .from("submissions")
        .select("id, form_id, data, submitted_at, forms(title)")
        .in("form_id", allFormIds)
        .gte("submitted_at", prevSinceIso)
        .order("submitted_at", { ascending: false })
        .range(from, to)
    ),
    fetchAllRows<RawClick>((from, to) =>
      supabase
        .from("direct_link_clicks")
        .select("direct_link_id, clicked_at, is_bot, redirect_status")
        .in("direct_link_id", allLinkIds)
        .gte("clicked_at", prevSinceIso)
        .order("clicked_at", { ascending: false })
        .range(from, to)
    ),
    supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .in("form_id", allFormIds),
    supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .in("form_id", allFormIds)
      .gte("submitted_at", prevSinceIso)
      .lt("submitted_at", sinceIso),
    supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .in("form_id", allFormIds)
      .gte("submitted_at", sinceIso),
    supabase
      .from("direct_link_clicks")
      .select("*", { count: "exact", head: true })
      .in("direct_link_id", allLinkIds)
      .gte("clicked_at", sinceIso)
      .eq("is_bot", false)
      .eq("redirect_status", "ok"),
    supabase
      .from("direct_link_clicks")
      .select("*", { count: "exact", head: true })
      .in("direct_link_id", allLinkIds)
      .gte("clicked_at", prevSinceIso)
      .lt("clicked_at", sinceIso)
      .eq("is_bot", false)
      .eq("redirect_status", "ok"),
    supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .in("form_id", allFormIds)
      .gte("submitted_at", firstDayOfMonth),
  ]);

  const fields = (fieldsResult.data ?? []) as {
    id: string;
    label: string;
    type: string;
    form_id: string;
  }[];
  const totalSubmissions = allTimeSubsResult.count ?? 0;
  const currentSubmissions = currentSubsCountResult.count ?? 0;
  const previousSubmissions = prevSubsCountResult.count ?? 0;
  const currentClickCount = currentClicksCountResult.count ?? 0;
  const previousClickCount = prevClicksCountResult.count ?? 0;

  const currentSubs = windowSubs.filter((s) => s.submitted_at >= sinceIso);
  const currentClicks = windowClicks.filter(
    (c) => c.clicked_at >= sinceIso && isRealClick(c)
  );

  // ── Derived metrics ─────────────────────────────────────────────────────
  const mapped = mapSubmissionsToRows(windowSubs as never, forms, fields);
  const isCurrent = (row: SubmissionRow) => new Date(row.date) >= since;

  // Rows without a resolvable name/phone both collapse to "—"; exclude them so
  // they don't merge into a single fake "customer".
  const resolved = mapped.filter((row) => row.name !== "—" || row.phone !== "—");

  const latestSubmissions = mapped.slice(0, 5);
  const currentCustomers = extractCustomers(resolved.filter(isCurrent)).length;
  const previousCustomers = extractCustomers(resolved.filter((r) => !isCurrent(r))).length;

  const submissionsSeries = buildSeries(
    currentSubs.map((s) => s.submitted_at),
    days,
    now
  );
  const clicksSeries = buildSeries(
    currentClicks.map((c) => c.clicked_at),
    days,
    now
  );

  const formsCreatedNow = forms.filter((f) => f.created_at >= sinceIso).length;
  const formsCreatedPrev = forms.filter(
    (f) => f.created_at >= prevSinceIso && f.created_at < sinceIso
  ).length;

  // ── Top lists (current period) ──────────────────────────────────────────
  const formTitles = new Map(forms.map((f) => [f.id, f]));
  const formCounts = countBy(currentSubs, (s) => s.form_id);
  const totalSubsInPeriod = currentSubs.length;
  const topForms: OverviewTopItem[] = topItems(formCounts, 5).map(({ key, count }) => {
    const form = formTitles.get(key);
    return {
      id: key,
      label: form?.title ?? "Untitled form",
      count,
      percent: totalSubsInPeriod > 0 ? Math.round((count / totalSubsInPeriod) * 100) : 0,
      href: `/dashboard/forms/${key}/edit`,
    };
  });

  const linkMap = new Map(links.map((l) => [l.id, l]));
  const linkCounts = countBy(currentClicks, (c) => c.direct_link_id);
  const totalClicksInPeriod = currentClicks.length;
  const topLinks: OverviewTopItem[] = topItems(linkCounts, 5).map(({ key, count }) => {
    const link = linkMap.get(key);
    return {
      id: key,
      label: link?.name ?? "Direct link",
      count,
      percent: totalClicksInPeriod > 0 ? Math.round((count / totalClicksInPeriod) * 100) : 0,
      href: `/dashboard/direct-links/${key}/edit`,
    };
  });

  const totalLinkClicks = links.reduce((sum, l) => sum + (l.total_clicks ?? 0), 0);

  const plan = subscription?.plan ?? "free";
  const limits = getPlanLimits(plan);
  const submissionsThisMonth = monthResult.count ?? 0;
  const isFree = plan === "free";

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-fg">Welcome back,</p>
          <h2 className="text-lg font-semibold text-fg sm:text-xl">
            Here&apos;s what&apos;s happening
          </h2>
          <p className="mt-1 text-sm text-muted-fg">
            Real-time insights from your forms and direct links
          </p>
          {isFree && (
            <p className="mt-1.5 break-words font-mono text-[11px] leading-relaxed text-muted-fg">
              Free plan · {forms.length}/
              {limits.maxForms === Infinity ? "∞" : limits.maxForms} forms ·{" "}
              {submissionsThisMonth}/
              {limits.maxSubmissionsPerMonth === Infinity
                ? "∞"
                : limits.maxSubmissionsPerMonth}{" "}
              submissions this month ·{" "}
              <Link
                href="/pricing"
                className="font-medium text-whatsapp-deep hover:text-whatsapp dark:text-whatsapp"
              >
                Upgrade
              </Link>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <OverviewRangeSelect value={days} />
          <CreateFormButton className="w-full sm:w-auto" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <OverviewKpiCard
          label="Total Forms"
          value={forms.length}
          icon={FileText}
          change={percentChange(formsCreatedNow, formsCreatedPrev)}
        />
        <OverviewKpiCard
          label="Total Submissions"
          value={totalSubmissions}
          icon={Inbox}
          change={percentChange(currentSubmissions, previousSubmissions)}
        />
        <OverviewKpiCard
          label="Total Link Clicks"
          value={totalLinkClicks}
          icon={MousePointerClick}
          change={percentChange(currentClickCount, previousClickCount)}
        />
        <OverviewKpiCard
          label="Unique Customers"
          value={currentCustomers}
          icon={Users}
          change={percentChange(currentCustomers, previousCustomers)}
        />
      </div>

      <OverviewCharts submissions={submissionsSeries} clicks={clicksSeries} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-fg">Latest Submissions</h3>
            <Link
              href="/dashboard/submissions"
              className="shrink-0 text-xs font-medium text-whatsapp-deep transition-colors hover:text-whatsapp dark:text-whatsapp"
            >
              View all →
            </Link>
          </div>
          <SubmissionsTable submissions={latestSubmissions} compact />
        </div>

        <div className="space-y-4">
          <OverviewTopList
            title="Top Forms"
            icon={FileText}
            viewAllHref="/dashboard/analytics"
            items={topForms}
            emptyLabel="No submissions in this period."
          />
          <OverviewTopList
            title="Top Direct Links"
            icon={Link2}
            viewAllHref="/dashboard/direct-links"
            items={topLinks}
            emptyLabel="No clicks in this period."
          />
        </div>
      </div>
    </div>
  );
}
