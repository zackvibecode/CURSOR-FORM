export interface TeamMember {
  name?: string;
  phone: string;
}

export interface TeamSettingsRow {
  distribution_mode: "single" | "distribute" | "conditional";
  team_members: TeamMember[];
  last_assigned_index: number;
}

function normalizeMembers(members: TeamMember[]): TeamMember[] {
  return members.filter((member) => member.phone?.trim());
}

/** Pick the WhatsApp number for this submission based on team settings. */
export function resolveWhatsAppNumber(
  formWhatsappNumber: string,
  teamSettings: TeamSettingsRow | null
): { phone: string; nextIndex?: number } {
  const fallback = formWhatsappNumber.trim();

  if (!teamSettings) {
    return { phone: fallback };
  }

  const members = normalizeMembers(teamSettings.team_members);

  if (teamSettings.distribution_mode === "distribute" && members.length > 0) {
    const index =
      ((teamSettings.last_assigned_index % members.length) + members.length) %
      members.length;
    const nextIndex = (index + 1) % members.length;
    return { phone: members[index].phone.trim(), nextIndex };
  }

  if (teamSettings.distribution_mode === "single" && members.length === 1) {
    return { phone: members[0].phone.trim() };
  }

  return { phone: fallback };
}
