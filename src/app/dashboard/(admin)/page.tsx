import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { SubmissionsTable } from "@/components/dashboard/SubmissionsTable";
import { CreateFormButton } from "@/components/dashboard/DashboardHeader";
import { computeDashboardStats, mapSubmissionsToRows } from "@/lib/dashboard-stats";
import { getPlanLimits } from "@/lib/plan-limits";
import { FileText, Inbox, Crown, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: forms } = await supabase
    .from("forms")
    .select("id, title")
    .eq("user_id", user.id);

  const formIds = (forms ?? []).map((f) => f.id);
  const formIdFilter = formIds.length > 0 ? formIds : ["none"];

  let submissions: ReturnType<typeof mapSubmissionsToRows> = [];
  let subscription: { plan?: string; status?: string } | null = null;
  let monthSubmissions = 0;

  if (formIds.length > 0) {
    const [submissionsResult, fieldsResult, subResult, monthResult] = await Promise.all([
      supabase
        .from("submissions")
        .select("*, forms(title)")
        .in("form_id", formIds)
        .order("submitted_at", { ascending: false })
        .limit(50),
      supabase
        .from("form_fields")
        .select("id, label, type, form_id")
        .in("form_id", formIds),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).single(),
      supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .in("form_id", formIdFilter)
        .gte("submitted_at", firstDayOfMonth),
    ]);

    submissions = mapSubmissionsToRows(
      submissionsResult.data ?? [],
      forms ?? [],
      fieldsResult.data ?? []
    );
    subscription = subResult.data;
    monthSubmissions = monthResult.count ?? 0;
  } else {
    const [subResult, monthResult] = await Promise.all([
      supabase.from("subscriptions").select("*").eq("user_id", user.id).single(),
      supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .in("form_id", formIdFilter)
        .gte("submitted_at", firstDayOfMonth),
    ]);
    subscription = subResult.data;
    monthSubmissions = monthResult.count ?? 0;
  }

  const stats = computeDashboardStats(
    forms ?? [],
    submissions.map((s) => ({
      id: s.id,
      form_id: "",
      data: {},
      submitted_at: s.date,
      ip_hash: null,
    }))
  );

  const plan = subscription?.plan ?? "free";
  const limits = getPlanLimits(plan);
  const formsCount = (forms ?? []).length;
  const status = subscription?.status ?? "active";
  const submissionsThisMonth = monthSubmissions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-fg">Welcome back</p>
          <h2 className="text-lg font-semibold text-fg">Overview</h2>
        </div>
        <CreateFormButton />
      </div>

      {/* Plan Status */}
      {status === "pending" && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2.5">
          <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Your <span className="font-semibold">{plan}</span> plan is pending approval.
          </p>
        </div>
      )}

      {plan === "free" && (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-whatsapp" />
            <div>
              <p className="text-sm font-medium text-fg">Free plan</p>
              <p className="font-mono text-[11px] text-muted-fg">
                {formsCount}/{limits.maxForms === Infinity ? "∞" : limits.maxForms} forms ·{" "}
                {submissionsThisMonth}/
                {limits.maxSubmissionsPerMonth === Infinity
                  ? "∞"
                  : limits.maxSubmissionsPerMonth}{" "}
                submissions this month
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-fg px-3 py-1.5 text-xs font-medium text-bg transition-colors hover:bg-gray-600 dark:hover:bg-gray-200"
          >
            Upgrade to Pro
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Forms" value={stats.totalForms} icon={FileText} />
        <StatCard title="Total Submissions" value={stats.totalSubmissions} icon={Inbox} />
      </div>

      {/* Latest submissions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">Latest Submissions</h3>
          <Link
            href="/dashboard/submissions"
            className="text-xs font-medium text-whatsapp-deep transition-colors hover:text-whatsapp dark:text-whatsapp"
          >
            View all →
          </Link>
        </div>
        <SubmissionsTable submissions={submissions} compact />
      </div>
    </div>
  );
}
