import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormBuilder } from "@/components/builder/FormBuilder";
import { mapDbFieldToFormField } from "@/lib/forms";

export default async function EditFormPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: form, error } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !form) {
    notFound();
  }

  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", id)
    .order("order_index");

  return (
    <FormBuilder
      formId={form.id}
      initialData={{
        title: form.title,
        slug: form.slug,
        whatsapp_number: form.whatsapp_number,
        cta_text: form.cta_text,
        description: form.description ?? "",
        status: form.status,
        fields: (fields ?? []).map(mapDbFieldToFormField),
        whatsappTemplate:
          (form.settings as { whatsapp_template?: string } | null)?.whatsapp_template,
      }}
    />
  );
}
