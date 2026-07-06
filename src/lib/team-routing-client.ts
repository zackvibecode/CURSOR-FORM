export interface TeamMember {
  name?: string;
  phone: string;
}

export interface TeamRoutingSnapshot {
  distribution_mode: string;
  team_members: TeamMember[];
  last_assigned_index: number;
}

function normalizeMembers(members: TeamMember[] | null | undefined): TeamMember[] {
  return (members ?? []).filter((member) => member.phone?.trim());
}

/** Read-only peek at the next rotator recipient (matches server index before increment). */
export function peekNextTeamRecipient(
  snapshot: TeamRoutingSnapshot
): { phone: string; name: string | null } | null {
  const members = normalizeMembers(snapshot.team_members);
  if (members.length === 0) return null;

  if (snapshot.distribution_mode === "single") {
    return {
      phone: members[0].phone.trim(),
      name: members[0].name?.trim() || null,
    };
  }

  if (snapshot.distribution_mode === "distribute") {
    const count = members.length;
    const idx = ((snapshot.last_assigned_index % count) + count) % count;
    const member = members[idx];
    return {
      phone: member.phone.trim(),
      name: member.name?.trim() || null,
    };
  }

  return null;
}

export function advanceTeamRoutingSnapshot(snapshot: TeamRoutingSnapshot): TeamRoutingSnapshot {
  const members = normalizeMembers(snapshot.team_members);
  if (snapshot.distribution_mode !== "distribute" || members.length === 0) {
    return snapshot;
  }

  const count = members.length;
  return {
    ...snapshot,
    last_assigned_index: (snapshot.last_assigned_index + 1) % count,
  };
}

const SESSION_PREFIX = "oneform_team_rotator:";

export function readTeamRoutingSnapshot(
  formId: string,
  initial: TeamRoutingSnapshot | null
): TeamRoutingSnapshot | null {
  if (!initial || typeof window === "undefined") return initial;

  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${formId}`);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as TeamRoutingSnapshot;
    if (parsed?.distribution_mode && Array.isArray(parsed.team_members)) {
      return parsed;
    }
  } catch {
    // ignore
  }

  return initial;
}

export function writeTeamRoutingSnapshot(formId: string, snapshot: TeamRoutingSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${SESSION_PREFIX}${formId}`, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}
