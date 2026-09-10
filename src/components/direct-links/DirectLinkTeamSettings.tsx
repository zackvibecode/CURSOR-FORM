"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, Users, GitBranch, Split, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface TeamMemberRow {
  id?: string;          // present for existing members
  name: string;
  country_code: string;
  phone_number: string;
  weight: number;
  active: boolean;
}

interface DirectLinkTeamSettingsProps {
  directLinkId: string;
}

const MODES = [
  {
    key: "single" as const,
    icon: Users,
    label: "Single",
    desc: "Send all visitors to one number",
  },
  {
    key: "distribute" as const,
    icon: GitBranch,
    label: "Distribute",
    desc: "Weighted round-robin across team",
  },
  {
    key: "conditional" as const,
    icon: Split,
    label: "Conditional",
    desc: "Coming soon",
    disabled: true,
  },
];

function calcPercentages(members: TeamMemberRow[]): number[] {
  const activeWeights = members.map((m) => (m.active ? m.weight : 0));
  const total = activeWeights.reduce((s, w) => s + w, 0);
  if (total === 0) return members.map(() => 0);
  return activeWeights.map((w) => (w / total) * 100);
}

export function DirectLinkTeamSettings({ directLinkId }: DirectLinkTeamSettingsProps) {
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [mode, setMode]             = useState<"single" | "distribute" | "conditional">("single");
  const [members, setMembers]       = useState<TeamMemberRow[]>([]);
  const [fetched, setFetched]       = useState(false);

  // Load existing team settings
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/direct-links/${directLinkId}/team`);
        const data = await res.json() as {
          distribution_mode?: "single" | "distribute" | "conditional";
          team_members?: Array<{
            id?: string;
            name: string;
            country_code: string;
            phone_number: string;
            weight: number;
            active: boolean;
          }>;
        };
        if (res.ok) {
          setMode(data.distribution_mode ?? "single");
          setMembers(
            (data.team_members ?? []).map((m) => ({
              id: m.id,
              name: m.name ?? "",
              country_code: m.country_code ?? "60",
              phone_number: m.phone_number ?? "",
              weight: m.weight ?? 1,
              active: m.active !== false,
            }))
          );
          setFetched(true);
        }
      } catch {
        toast("Failed to load team settings", "error");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [directLinkId]);

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      { name: "", country_code: "60", phone_number: "", weight: 1, active: true },
    ]);
  };

  const removeMember = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMember = useCallback(
    (index: number, field: keyof TeamMemberRow, value: string | number | boolean) => {
      setMembers((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value } as TeamMemberRow;
        return next;
      });
    },
    []
  );

  const moveUp = (index: number) => {
    if (index === 0) return;
    setMembers((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    setMembers((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    if (mode === "conditional") {
      toast("Conditional routing is coming soon", "error");
      return;
    }

    // Validation
    const valid = members.filter((m) => m.phone_number.trim());
    if (mode === "distribute" && valid.length === 0) {
      toast("Add at least one team member for distribute mode", "error");
      return;
    }
    if (mode === "single" && members.length > 0 && !members[0]?.phone_number.trim()) {
      toast("Enter a WhatsApp number", "error");
      return;
    }

    // Phone validation
    for (const m of members) {
      if (m.phone_number.trim() && !/^\d{7,15}$/.test(m.phone_number.replace(/\D/g, ""))) {
        toast(`Invalid phone number for ${m.name || "a member"}`, "error");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/direct-links/${directLinkId}/team`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distribution_mode: mode, team_members: members }),
      });
      const data = await res.json() as { error?: string; team_members?: TeamMemberRow[] };
      if (!res.ok) {
        toast(data.error ?? "Failed to save", "error");
        return;
      }
      if (Array.isArray(data.team_members)) {
        setMembers(data.team_members);
      }
      toast("Team settings saved!", "success");
      setFetched(true);
    } catch {
      toast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const percentages = calcPercentages(members);
  const totalWeight = members.filter((m) => m.active).reduce((s, m) => s + m.weight, 0);

  if (loading && !fetched) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#25D366] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-fg">Team distribution</h3>
        <p className="mt-0.5 text-xs text-muted-fg">
          Choose how WhatsApp visitors are distributed to your team.
        </p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive   = mode === m.key;
          const isDisabled = "disabled" in m && m.disabled;
          return (
            <button
              key={m.key}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (isDisabled) {
                  toast("Conditional routing is coming soon", "error");
                  return;
                }
                setMode(m.key);
              }}
              className={cn(
                "flex flex-col items-start gap-2.5 rounded-md border p-3 text-left transition-colors",
                isActive
                  ? "border-[#25D366] bg-[#25D366]/5"
                  : "border-border bg-card hover:border-fg/30",
                isDisabled && "cursor-not-allowed opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md border",
                  isActive
                    ? "border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366]"
                    : "border-border text-muted-fg"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-fg">{m.label}</p>
                <p className="text-[11px] text-muted-fg">{m.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Distribute mode info banner */}
      {mode === "distribute" && (
        <div className="rounded-md border border-[#25D366]/20 bg-[#25D366]/5 px-3 py-2 text-[11px] text-[#128C7E] dark:text-[#25D366]">
          <strong>Weighted round-robin:</strong> Visitors are distributed across members according to their weight.
          Higher weight = more visitors. Cycle repeats automatically.
          {totalWeight > 0 && (
            <span className="ml-1">Total weight: <strong>{totalWeight}</strong></span>
          )}
        </div>
      )}

      {/* Team members list */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-fg">
            {mode === "single" ? "WhatsApp recipient" : "Team members"}
          </h4>
          {mode === "distribute" && (
            <span className="font-mono text-[11px] text-muted-fg">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {members.map((member, index) => (
            <div
              key={index}
              className={cn(
                "group rounded-lg border border-border bg-card p-3 transition-colors",
                !member.active && "opacity-60"
              )}
            >
              {/* Row 1: Name + controls */}
              <div className="flex items-center gap-2">
                <Input
                  value={member.name}
                  onChange={(e) => updateMember(index, "name", e.target.value)}
                  placeholder="Name (optional)"
                  className="flex-1 text-sm"
                />
                {/* Active toggle */}
                <button
                  type="button"
                  onClick={() => updateMember(index, "active", !member.active)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    member.active
                      ? "bg-[#25D366]/10 text-[#128C7E] dark:text-[#25D366]"
                      : "bg-muted text-muted-fg"
                  )}
                  title={member.active ? "Click to disable" : "Click to enable"}
                >
                  {member.active ? "Active" : "Off"}
                </button>
                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="rounded-md p-1 text-muted-fg/40 transition-colors hover:text-red-500"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Row 2: Phone */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex shrink-0 items-center rounded-md border border-border bg-muted px-2.5 py-2 font-mono text-xs text-muted-fg">
                  +{member.country_code}
                </div>
                <Input
                  value={member.phone_number}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    updateMember(index, "phone_number", digits);
                  }}
                  placeholder="123456789"
                  className="flex-1 font-mono text-sm"
                />
                {mode === "distribute" && (
                  <div className="flex shrink-0 items-center gap-1">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-0.5 text-muted-fg/40 hover:text-fg disabled:opacity-20"
                        title="Move up"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === members.length - 1}
                        className="p-0.5 text-muted-fg/40 hover:text-fg disabled:opacity-20"
                        title="Move down"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: Weight + percentage (distribute mode only) */}
              {mode === "distribute" && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-muted-fg shrink-0">Weight</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateMember(index, "weight", Math.max(1, member.weight - 1))}
                        className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-fg hover:bg-muted hover:text-fg"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-mono text-sm font-semibold text-fg">
                        {member.weight}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateMember(index, "weight", member.weight + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-border text-muted-fg hover:bg-muted hover:text-fg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {member.active && totalWeight > 0 && (
                    <div className="flex items-center gap-2">
                      {/* Progress bar */}
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-[#25D366] transition-all"
                          style={{ width: `${percentages[index]}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-muted-fg">
                        {percentages[index]!.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {!member.active && (
                    <span className="text-[11px] italic text-muted-fg">Disabled — not receiving visitors</span>
                  )}
                </div>
              )}
            </div>
          ))}

          {members.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-fg">
              No team members yet. Add one below.
            </div>
          )}
        </div>

        {/* Add member / single limit */}
        {(mode === "distribute" || (mode === "single" && members.length === 0)) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={addMember}
            className="mt-3"
          >
            <Plus className="h-3.5 w-3.5" />
            {mode === "single" ? "Set WhatsApp number" : "Add member"}
          </Button>
        )}
      </div>

      {/* Weight summary for distribute mode */}
      {mode === "distribute" && members.length > 1 && (
        <div className="rounded-md border border-border bg-card p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">
            Distribution summary
          </p>
          <div className="space-y-1">
            {members.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className={cn("text-fg", !m.active && "text-muted-fg/50 line-through")}>
                  {m.name || `Member ${i + 1}`}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-fg">w:{m.weight}</span>
                  {m.active && totalWeight > 0 ? (
                    <span className="font-mono font-medium text-[#128C7E] dark:text-[#25D366]">
                      {percentages[i]!.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-fg/50">Off</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Save team settings"}
        </Button>
      </div>
    </div>
  );
}
