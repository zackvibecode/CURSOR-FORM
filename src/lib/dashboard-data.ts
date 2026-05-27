import { createClient } from "@/lib/supabase/server";
import {
  computeDashboardStats,
  mapSubmissionsToRows,
} from "@/lib/dashboard-stats";

export async function getDashboardData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: forms } = await supabase
    .from("forms")
    .select("id, title, slug, status, updated_at, submissions(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const formIds = (forms ?? []).map((f) => f.id);

  let submissions: Awaited<ReturnType<typeof mapSubmissionsToRows>> = [];

  if (formIds.length > 0) {
    const { data: rawSubmissions } = await supabase
      .from("submissions")
      .select("*, forms(title)")
      .in("form_id", formIds)
      .order("submitted_at", { ascending: false })
      .limit(50);

    submissions = mapSubmissionsToRows(rawSubmissions ?? [], forms ?? []);
  }

  const stats = computeDashboardStats(
    forms ?? [],
    submissions.map((s) => ({ id: s.id, form_id: "", data: {}, submitted_at: s.date, ip_hash: null }))
  );

  // Recompute stats from actual submission count
  const actualStats = computeDashboardStats(
    forms ?? [],
    Array.from({ length: submissions.length }, (_, i) => ({
      id: String(i),
      form_id: "",
      data: {},
      submitted_at: new Date().toISOString(),
      ip_hash: null,
    }))
  );

  return {
    user,
    forms: forms ?? [],
    submissions,
    stats: actualStats,
  };
}
