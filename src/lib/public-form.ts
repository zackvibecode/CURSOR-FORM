import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DbForm, DbFormField } from "@/lib/database.types";
import type { TeamRoutingSnapshot } from "@/lib/team-routing-client";

export interface PublishedFormData {
  form: DbForm;
  fields: DbFormField[];
  pixelId: string | null;
  usesTeamRouting: boolean;
  teamRoutingSnapshot: TeamRoutingSnapshot | null;
}

const FORM_COLUMNS =
  "id, user_id, title, slug, description, whatsapp_number, cta_text, status, settings, created_at, updated_at";

const FIELD_COLUMNS =
  "id, form_id, type, label, placeholder, required, options, order_index, settings, created_at";

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

async function fetchPublishedFormBundle(slug: string): Promise<{
  form: DbForm;
  fields: DbFormField[];
  pixelId: string | null;
} | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: form, error } = await admin
    .from("forms")
    .select(FORM_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !form) return null;

  const [{ data: fields }, { data: ownerSettings }] = await Promise.all([
    admin
      .from("form_fields")
      .select(FIELD_COLUMNS)
      .eq("form_id", form.id)
      .order("order_index"),
    admin
      .from("user_settings")
      .select("meta_pixel_id, meta_pixel_enabled")
      .eq("user_id", form.user_id)
      .maybeSingle(),
  ]);

  const pixelId = ownerSettings?.meta_pixel_enabled ? ownerSettings.meta_pixel_id : null;

  return {
    form: form as DbForm,
    fields: (fields ?? []) as DbFormField[],
    pixelId: pixelId ?? null,
  };
}

const getCachedPublishedFormBundle = unstable_cache(
  fetchPublishedFormBundle,
  ["published-form-bundle"],
  { revalidate: 120, tags: ["published-forms"] }
);

async function fetchTeamRoutingSnapshot(
  formId: string
): Promise<TeamRoutingSnapshot | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("form_team_settings")
    .select("distribution_mode, team_members, last_assigned_index")
    .eq("form_id", formId)
    .maybeSingle();

  if (!data || !formUsesTeamRouting(data)) return null;

  return {
    distribution_mode: data.distribution_mode,
    team_members: (Array.isArray(data.team_members)
      ? data.team_members
      : []) as TeamRoutingSnapshot["team_members"],
    last_assigned_index: data.last_assigned_index ?? 0,
  };
}

export async function getPublishedFormBySlug(slug: string): Promise<PublishedFormData | null> {
  const bundle = await getCachedPublishedFormBundle(slug);
  if (!bundle) return null;

  const teamRoutingSnapshot = await fetchTeamRoutingSnapshot(bundle.form.id);
  const usesTeamRouting = teamRoutingSnapshot !== null;

  return {
    form: bundle.form,
    fields: bundle.fields,
    pixelId: bundle.pixelId,
    usesTeamRouting,
    teamRoutingSnapshot,
  };
}
