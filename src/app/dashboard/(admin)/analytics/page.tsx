import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { computeDashboardStats } from "@/lib/dashboard-stats";
import { Inbox, LayoutList } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: forms } = await supabase
    .from("forms")
    .select("id")
    .eq("user_id", user!.id);

  const formIds = (forms ?? []).map((f) => f.id);
  let submissions: { submitted_at: string }[] = [];

  if (formIds.length > 0) {
    const { data } = await supabase
      .from("submissions")
      .select("submitted_at")
      .in("form_id", formIds)
      .order("submitted_at", { ascending: true });
    submissions = data ?? [];
  }

  const stats = computeDashboardStats(forms ?? [], submissions as any);

  // Build submissions-per-day array from real data
  const submissionsPerDay = buildSubmissionsPerDay(submissions.map((s) => s.submitted_at));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-text">Analytics</h2>
        <p className="text-brand-muted">
          Monitor your form performance and submission trends
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Forms" value={stats.totalForms} icon={LayoutList} />
        <StatCard title="Total Submissions" value={stats.totalSubmissions} icon={Inbox} />
      </div>

      <AnalyticsCharts submissionsPerDay={submissionsPerDay} />
    </div>
  );
}

function buildSubmissionsPerDay(dates: string[]): number[] {
  if (dates.length === 0) return [];

  // Group by day and return the last 30 days
  const counts = new Map<string, number>();
  for (const d of dates) {
    const day = d.slice(0, 10); // "YYYY-MM-DD"
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const today = new Date();
  const result: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    result.push(counts.get(key) ?? 0);
  }

  return result;
}
