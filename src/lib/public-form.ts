import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DbForm, DbFormField } from "@/lib/database.types";

export interface PublishedFormData {
  form: DbForm;
  fields: DbFormField[];
  pixelId?: string;
  usesTeamRouting: boolean;
}

function formUsesTeamRouting(
  settings: {
    distribution_mode: string;
    team_members: unknown;
  } | null
): boolean {
  if (!settings) return false;

  const members = Array.isArray(settings.team_members)
    ? settings.team_members.filter(
        (member) =>
          member &&
          typeof member === "object" &&
          "phone" in member &&
          typeof (member as { phone?: string }).phone === "string" &&
          (member as { phone: string }).phone.trim()
      )
    : [];

  if (members.length === 0) return false;

  return settings.distribution_mode === "distribute" || settings.distribution_mode === "single";
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

  const admin = createAdminClient();

  const [{ data: fields }, { data: ownerSettings }, teamSettingsResult] = await Promise.all([
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
    admin
      ? admin
          .from("form_team_settings")
          .select("distribution_mode, team_members")
          .eq("form_id", form.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const pixelId = ownerSettings?.meta_pixel_enabled ? ownerSettings.meta_pixel_id : undefined;

  return {
    form,
    fields: fields ?? [],
    pixelId,
    usesTeamRouting: formUsesTeamRouting(teamSettingsResult.data),
  };
}
