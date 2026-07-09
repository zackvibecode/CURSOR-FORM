import { createClient } from "@/lib/supabase/server";
import { FormList } from "@/components/dashboard/FormList";
import { CreateFormRedirect } from "@/components/dashboard/CreateFormRedirect";

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

  if (params.template) {
    return <CreateFormRedirect templateId={params.template} />;
  }

  const [{ data: forms }, { data: profile }] = await Promise.all([
    supabase
      .from("forms")
      .select("*, submissions(count)")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false }),
    supabase.from("profiles").select("name").eq("id", user!.id).maybeSingle(),
  ]);

  const userName = profile?.name ?? user?.email ?? null;

  return <FormList forms={forms ?? []} userName={userName} />;
}
