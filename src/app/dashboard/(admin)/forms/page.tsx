import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/paginate";
import { FormList } from "@/components/dashboard/FormList";
import { CreateFormRedirect } from "@/components/dashboard/CreateFormRedirect";
import { FormsRail, type RailDirectLink } from "@/components/dashboard/FormsRail";
import { buildMonthlySeries, percentChange } from "@/lib/overview-stats";

export const dynamic = "force-dynamic";

export default async function FormsPage({
  searchParams,
}: {
  searchParams: { template?: string };
}) {
  const params = searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/forms");
  }

  if (params.template) {
    return <CreateFormRedirect templateId={params.template} />;
  }

  const [{ data: forms, error: formsError }, { data: profile }] = await Promise.all([
    supabase
      .from("forms")
      .select("*, submissions(count)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
  ]);

  if (formsError) {
    console.error("[forms page] forms query failed:", formsError.message);
  }

  const formList = forms ?? [];
  const formIds = formList.map((f) => f.id);

  const now = new Date();
  const trendSince = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)
  ).toISOString();

  // Soft-fail side queries so a missing direct_links table / empty UUID list
  // never takes down the whole Forms dashboard.
  const [directLinks, trendDates] = await Promise.all([
    (async (): Promise<RailDirectLink[]> => {
      try {
        const { data, error } = await supabase
          .from("direct_links")
          .select("id, name, slug, status, total_clicks, distribution_mode, created_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(2);
        if (error) {
          console.error("[forms page] direct_links query failed:", error.message);
          return [];
        }
        return (data ?? []) as RailDirectLink[];
      } catch (err) {
        console.error("[forms page] direct_links threw:", err);
        return [];
      }
    })(),
    (async (): Promise<string[]> => {
      if (formIds.length === 0) return [];
      try {
        const rows = await fetchAllRows<{ submitted_at: string }>((from, to) =>
          supabase
            .from("submissions")
            .select("submitted_at")
            .in("form_id", formIds)
            .gte("submitted_at", trendSince)
            .order("submitted_at", { ascending: false })
            .range(from, to)
        );
        return rows.map((s) => s.submitted_at);
      } catch (err) {
        console.error("[forms page] submissions trend failed:", err);
        return [];
      }
    })(),
  ]);

  const monthly = buildMonthlySeries(trendDates, 4, now);

  const totalSubmissions = formList.reduce(
    (sum, f) => sum + (f.submissions?.[0]?.count ?? 0),
    0
  );
  const currentMonth = monthly[monthly.length - 1]?.value ?? 0;
  const previousMonth = monthly[monthly.length - 2]?.value ?? 0;
  const submissionsChange = percentChange(currentMonth, previousMonth);

  const monthKey = now.toISOString().slice(0, 7);
  const prevMonthKey = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
  )
    .toISOString()
    .slice(0, 7);
  const formsThisMonth = formList.filter(
    (f) => (f.created_at as string)?.slice(0, 7) === monthKey
  ).length;
  const formsLastMonth = formList.filter(
    (f) => (f.created_at as string)?.slice(0, 7) === prevMonthKey
  ).length;
  const formsChange = percentChange(formsThisMonth, formsLastMonth);

  const userName = profile?.name ?? user.email ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="min-w-0 lg:col-span-2">
        <FormList forms={formList} userName={userName} />
      </div>
      <div className="space-y-4">
        <FormsRail
          totalForms={formList.length}
          totalSubmissions={totalSubmissions}
          formsChange={formsChange}
          submissionsChange={submissionsChange}
          monthly={monthly}
          directLinks={directLinks}
        />
      </div>
    </div>
  );
}
