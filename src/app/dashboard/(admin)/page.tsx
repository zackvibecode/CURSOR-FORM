import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { SubmissionsTable } from "@/components/dashboard/SubmissionsTable";
import { CreateFormButton } from "@/components/dashboard/DashboardHeader";
import { computeDashboardStats, mapSubmissionsToRows } from "@/lib/dashboard-stats";
import { getPlanLimits } from "@/lib/plan-limits";
import type { Subscription } from "@/lib/database.types";
import { FileText, Inbox, Crown, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch forms first
  const { data: forms } = await supabase
    .from("forms")
    .select("id, title")
    .eq("user_id", user.id);

  const formIds = (forms ?? []).map((f) => f.id);
  let submissions: ReturnType<typeof mapSubmissionsToRows> = [];

  if (formIds.length > 0) {
    const [submissionsResult, fieldsResult] = await Promise.all([
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
    ]);

    submissions = mapSubmissionsToRows(
      submissionsResult.data ?? [],
      forms ?? [],
      fieldsResult.data ?? []
    );
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

  // Fetch subscription
  let subscription: Subscription | null = null;
  const { data: subData } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  subscription = subData;
  const plan = subscription?.plan ?? "free";
  const limits = getPlanLimits(plan);
  const formsCount = (forms ?? []).length;
  const status = subscription?.status ?? "active";

  // Count this month's submissions
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: monthSubmissions } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .in("form_id", formIds.length > 0 ? formIds : ["none"])
    .gte("submitted_at", firstDayOfMonth);

  const submissionsThisMonth = monthSubmissions ?? 0;

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
          <h2 className="text-2xl font-bold text-brand-text">Dashboard Overview</h2>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-whatsapp/10">
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
              className="inline-flex items-center gap-2 rounded-xl bg-whatsapp px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0DB849] active:scale-[0.98]"
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
          <h3 className="text-lg font-semibold text-brand-text">Latest Submissions</h3>
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