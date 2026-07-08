import { createClient } from "@/lib/supabase/server";
import { SubmissionsExplorer } from "@/components/dashboard/SubmissionsExplorer";
import { MarkFormSubmissionsSeen } from "@/components/dashboard/MarkFormSubmissionsSeen";
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
    .select("id, title, submissions(count)")
    .eq("user_id", user.id);

  const formIds = (forms ?? []).map((f) => f.id);
  let submissions: ReturnType<typeof mapSubmissionsToRows> = [];

  if (formIds.length > 0) {
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

  const seenForms = (forms ?? []).map((f) => ({
    id: f.id,
    count: Array.isArray(f.submissions)
      ? ((f.submissions[0] as { count?: number } | undefined)?.count ?? 0)
      : 0,
  }));

  return (
    <div className="space-y-6">
      <MarkFormSubmissionsSeen forms={seenForms} />
      <div>
        <h2 className="text-lg font-semibold text-fg">Submissions</h2>
        <p className="text-sm text-muted-fg">
          Track and manage all form submissions across your WhatsApp forms
        </p>
      </div>
      <SubmissionsExplorer submissions={submissions} />
    </div>
  );
}
