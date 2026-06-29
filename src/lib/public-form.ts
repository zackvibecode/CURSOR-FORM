import { createClient } from "@/lib/supabase/server";
import type { DbForm, DbFormField } from "@/lib/database.types";

export interface PublishedFormData {
  form: DbForm;
  fields: DbFormField[];
  pixelId?: string;
}

export async function getPublishedFormBySlug(slug: string): Promise<PublishedFormData | null> {
  const supabase = await createClient();

  const { data: form, error } = await supabase
    .from("forms")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !form) return null;

  const [{ data: fields }, { data: ownerSettings }] = await Promise.all([
    supabase
      .from("form_fields")
      .select("*")
      .eq("form_id", form.id)
      .order("order_index"),
    supabase
      .from("user_settings")
      .select("meta_pixel_id, meta_pixel_enabled")
      .eq("user_id", form.user_id)
      .single(),
  ]);

  const pixelId = ownerSettings?.meta_pixel_enabled ? ownerSettings.meta_pixel_id : undefined;

  return { form, fields: fields ?? [], pixelId };
}
