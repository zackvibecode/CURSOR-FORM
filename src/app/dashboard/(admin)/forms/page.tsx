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

  const { data: forms } = await supabase
    .from("forms")
    .select("*, submissions(count)")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  return <FormList forms={forms ?? []} />;
}
