import { createClient } from "@/lib/supabase/server";
import { SubmissionsExplorer } from "@/components/dashboard/SubmissionsExplorer";
import { mapSubmissionsToRows } from "@/lib/dashboard-stats";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: forms } = await supabase
    .from("forms")
    .select("id, title")
    .eq("user_id", user.id);

  const formIds = (forms ?? []).map((f) => f.id);
  let submissions: ReturnType<typeof mapSubmissionsToRows> = [];

  if (formIds.length > 0) {
    // Parallel queries for speed
    const [submissionsResult, fieldsResult] = await Promise.all([
      supabase
        .from("submissions")
        .select("*, forms(title)")
        .in("form_id", formIds)
        .order("submitted_at", { ascending: false }),
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-text">Submissions</h2>
        <p className="text-brand-muted">
          Track and manage all form submissions across your WhatsApp forms
        </p>
      </div>
      <SubmissionsExplorer submissions={submissions} />
    </div>
  );
}
