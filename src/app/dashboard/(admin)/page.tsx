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

  const planLabelColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-700 border-gray-200",
    pro: "bg-whatsapp/10 text-whatsapp-deep border-whatsapp/20",
    business: "bg-purple-100 text-purple-700 border-purple-200",
  };

  const planLabels: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    business: "Business",
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-brand-muted">Welcome back</p>
          <h2 className="text-xl font-bold text-brand-text">Dashboard Overview</h2>
        </div>
        <CreateFormButton />
      </div>

      {/* Plan Status Card */}
      {status === "pending" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              Your {planLabels[plan]} plan is pending approval
            </p>
          </div>
          <p className="mt-1 text-xs text-amber-600">
            Your request has been submitted. An admin will review it shortly.
          </p>
        </div>
      )}

      {plan === "free" && (
        <div className="rounded-xl border border-whatsapp/20 bg-gradient-to-r from-whatsapp/5 to-transparent p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-whatsapp/10">
                <Crown className="h-5 w-5 text-whatsapp-deep" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-text">
                  You&apos;re on the Free plan
                </p>
                <p className="text-xs text-brand-muted">
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
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0DB849] active:scale-[0.98]"
            >
              Upgrade to Pro
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Forms" value={stats.totalForms} icon={FileText} />
        <StatCard title="Total Submissions" value={stats.totalSubmissions} icon={Inbox} />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-brand-text">Latest Submissions</h3>
          <Link
            href="/dashboard/submissions"
            className="text-sm font-medium text-whatsapp-deep hover:underline"
          >
            View all
          </Link>
        </div>
        <SubmissionsTable submissions={submissions} compact />
      </div>
    </div>
  );
}