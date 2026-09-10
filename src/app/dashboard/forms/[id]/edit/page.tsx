import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormBuilder } from "@/components/builder/FormBuilder";
import { mapDbFieldToFormField } from "@/lib/forms";
import { getTiktokModeFromForm, getWhatsappTemplateFromForm, getFormModeFromForm, getDirectMessageFromForm, getFormSeoFromForm } from "@/lib/form-settings";

export const dynamic = "force-dynamic";

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

  const seo = getFormSeoFromForm(form);

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
        whatsappTemplate: getWhatsappTemplateFromForm(form),
        tiktokMode: getTiktokModeFromForm(form),
        formMode: getFormModeFromForm(form),
        directMessage: getDirectMessageFromForm(form),
        seo_title: seo.seo_title,
        seo_description: seo.seo_description,
        seo_og_title: seo.seo_og_title,
        seo_og_description: seo.seo_og_description,
        seo_og_image: seo.seo_og_image,
        seo_indexing: seo.seo_indexing,
        canonical_url: seo.canonical_url,
        updated_at: form.updated_at,
      }}
    />
  );
}
