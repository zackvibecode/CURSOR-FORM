import type { SupabaseClient } from "@supabase/supabase-js";

export interface ResolvedRecipient {
  phone: string;
  name: string | null;
  fromTeam: boolean;
}

interface TeamMemberRow {
  name?: string;
  phone: string;
}

function normalizeMembers(members: TeamMemberRow[] | null | undefined): TeamMemberRow[] {
  return (members ?? []).filter((member) => member.phone?.trim());
}

/** Resolve which WhatsApp number receives this submission (team rotator or fallback). */
export async function resolveSubmissionRecipient(
  admin: SupabaseClient | null,
  formId: string,
  fallbackPhone: string
): Promise<ResolvedRecipient | null> {
  if (!admin) {
    return fallbackPhone.trim()
      ? { phone: fallbackPhone.trim(), name: null, fromTeam: false }
      : null;
  }

  const { data: recipient, error: recipientError } = await admin.rpc(
    "resolve_form_recipient",
    { p_form_id: formId }
  );

  if (!recipientError && Array.isArray(recipient) && recipient.length > 0) {
    const row = recipient[0] as { member_name: string | null; member_phone: string | null };
    if (row?.member_phone?.trim()) {
      return {
        phone: row.member_phone.trim(),
        name: row.member_name?.trim() || null,
        fromTeam: true,
      };
    }
  }

  if (recipientError) {
    console.warn("[team-rotator] resolve_form_recipient failed:", recipientError.message);
  }

  const { data: settings } = await admin
    .from("form_team_settings")
    .select("distribution_mode, team_members, last_assigned_index")
    .eq("form_id", formId)
    .maybeSingle();

  if (!settings) {
    return fallbackPhone.trim()
      ? { phone: fallbackPhone.trim(), name: null, fromTeam: false }
      : null;
  }

  const members = normalizeMembers(settings.team_members as TeamMemberRow[]);

  if (settings.distribution_mode === "distribute" && members.length > 0) {
    const count = members.length;
    const currentIndex = settings.last_assigned_index ?? 0;
    const idx = ((currentIndex % count) + count) % count;
    const member = members[idx];

    await admin
      .from("form_team_settings")
      .update({ last_assigned_index: (idx + 1) % count })
      .eq("form_id", formId);

    return {
      phone: member.phone.trim(),
      name: member.name?.trim() || null,
      fromTeam: true,
    };
  }

  if (settings.distribution_mode === "single" && members.length > 0) {
    return {
      phone: members[0].phone.trim(),
      name: members[0].name?.trim() || null,
      fromTeam: true,
    };
  }

  // Distribute mode enabled but no team numbers — do not silently use main number
  if (settings.distribution_mode === "distribute") {
    return null;
  }

  return fallbackPhone.trim()
    ? { phone: fallbackPhone.trim(), name: null, fromTeam: false }
    : null;
}
