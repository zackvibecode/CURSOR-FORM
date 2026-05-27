import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { SubmissionsTable } from "@/components/dashboard/SubmissionsTable";
import { CreateFormButton } from "@/components/dashboard/DashboardHeader";
import { computeDashboardStats, mapSubmissionsToRows } from "@/lib/dashboard-stats";
import { FileText, Inbox, MousePointerClick, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: forms } = await supabase
    .from("forms")
    .select("id, title")
    .eq("user_id", user!.id);

  const formIds = (forms ?? []).map((f) => f.id);
  let submissions: ReturnType<typeof mapSubmissionsToRows> = [];

  if (formIds.length > 0) {
    const { data: rawSubmissions } = await supabase
      .from("submissions")
      .select("*, forms(title)")
      .in("form_id", formIds)
      .order("submitted_at", { ascending: false })
      .limit(50);

    const { data: fields } = await supabase
      .from("form_fields")
      .select("id, label, type, form_id")
      .in("form_id", formIds);

    submissions = mapSubmissionsToRows(rawSubmissions ?? [], forms ?? [], fields ?? []);
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

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-brand-muted">Welcome back</p>
          <h2 className="text-2xl font-bold text-brand-text">Dashboard Overview</h2>
        </div>
        <CreateFormButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Forms" value={stats.totalForms} icon={FileText} />
        <StatCard title="Total Submissions" value={stats.totalSubmissions} icon={Inbox} />
        <StatCard title="WhatsApp Clicks" value={stats.whatsappClicks} icon={MousePointerClick} />
        <StatCard
          title="Conversion Rate"
          value={stats.conversionRate}
          icon={TrendingUp}
          change="Based on form submissions"
        />
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
