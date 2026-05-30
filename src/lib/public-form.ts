import { createClient } from "@/lib/supabase/server";
import type { DbForm, DbFormField } from "@/lib/database.types";

export async function getPublishedFormBySlug(slug: string): Promise<{
  form: DbForm;
  fields: DbFormField[];
} | null> {
  const supabase = await createClient();

  const { data: form, error } = await supabase
    .from("forms")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !form) return null;

  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", form.id)
    .order("order_index");

  return { form, fields: fields ?? [] };
}
