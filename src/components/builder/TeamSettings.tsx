"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, Users, GitBranch, Split } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface TeamMember {
  name?: string;
  phone: string;
}

interface TeamSettingsProps {
  formId: string;
}

export function TeamSettings({ formId }: TeamSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [distributionMode, setDistributionMode] = useState<"single" | "distribute" | "conditional">("single");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/forms/${formId}/team-settings`);
        const data = await res.json();
        if (res.ok) {
          setDistributionMode(data.distribution_mode ?? "single");
          setTeamMembers(data.team_members ?? []);
          setFetched(true);
        }
      } catch {
        toast("Failed to load team settings", "error");
      }
      setLoading(false);
    };
    loadSettings();
  }, [formId]);

  const handleSave = async () => {
    if (distributionMode === "distribute") {
      const validMembers = teamMembers.filter((member) => member.phone?.trim());
      if (validMembers.length === 0) {
        toast("Add at least one team member for round-robin", "error");
        return;
      }
    }

    if (distributionMode === "conditional") {
      toast("Conditional routing is coming soon", "error");
      return;
    }

    setSaving(true);
    try {
      const url = `/api/forms/${formId}/team-settings`;

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distribution_mode: distributionMode, team_members: teamMembers }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error ?? "Failed to save", "error");
        return;
      }
      await res.json();
      toast("Team settings saved!", "success");
      setFetched(true);
    } catch {
      toast("Network error", "error");
    }
    setSaving(false);
  };

  const addMember = () => {
    setTeamMembers((prev) => [...prev, { name: "", phone: "+60" }]);
  };

  const removeMember = (index: number) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    setTeamMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const modes = [
    { key: "single" as const, icon: Users, label: "Single", desc: "Send to one number" },
    { key: "distribute" as const, icon: GitBranch, label: "Distribute", desc: "Round-robin across team" },
    {
      key: "conditional" as const,
      icon: Split,
      label: "Conditional",
      desc: "Coming soon",
      disabled: true,
    },
  ];

  if (loading && !fetched) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-whatsapp border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-fg">Team distribution</h3>
        <p className="mt-0.5 text-xs text-muted-fg">
          Choose how form submissions are distributed to your team.
        </p>
        {distributionMode === "distribute" && (
          <p className="mt-3 rounded-md border border-whatsapp/20 bg-whatsapp/5 px-3 py-2 text-[11px] text-whatsapp-deep dark:text-whatsapp">
            <strong>Distribute mode:</strong> Leads rotate through the team numbers below only
            (Member 1 → 2 → 3 → … → back to 1). The main WhatsApp number in General settings is
            not used unless you add it as a team member here.
          </p>
        )}
      </div>

      {/* Distribution Mode */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = distributionMode === mode.key;
          const isDisabled = "disabled" in mode && mode.disabled;
          return (
            <button
              key={mode.key}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (isDisabled) {
                  toast("Conditional routing is coming soon", "error");
                  return;
                }
                setDistributionMode(mode.key);
              }}
              className={cn(
                "flex flex-col items-start gap-2.5 rounded-md border p-3 text-left transition-colors",
                isActive
                  ? "border-whatsapp bg-whatsapp/5"
                  : "border-border bg-card hover:border-fg/30",
                isDisabled && "cursor-not-allowed opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md border",
                  isActive
                    ? "border-whatsapp/30 bg-whatsapp/10 text-whatsapp-deep dark:text-whatsapp"
                    : "border-border text-muted-fg"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-fg">{mode.label}</p>
                <p className="text-[11px] text-muted-fg">{mode.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Team Members */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-fg">
            Team members
          </h4>
          <span className="font-mono text-[11px] text-muted-fg">
            {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="space-y-2">
          {teamMembers.map((member, index) => (
            <div key={index} className="flex items-center gap-2 group">
              <div className="flex-1">
                <Input
                  value={member.name ?? ""}
                  onChange={(e) => updateMember(index, "name", e.target.value)}
                  placeholder="Name (optional)"
                  className="text-sm"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex shrink-0 items-center rounded-md border border-border bg-muted px-2.5 py-2 font-mono text-xs text-muted-fg">
                    +60
                  </span>
                  <Input
                    value={member.phone.replace(/^(\+60|0)/, "")}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.startsWith("6")) val = val.slice(1);
                      updateMember(index, "phone", `+60${val}`);
                    }}
                    placeholder="12-345-6789"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="p-1.5 text-muted-fg/40 opacity-60 transition-opacity hover:text-red-600 group-hover:opacity-100"
                title="Remove member"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={addMember}
          className="mt-3"
        >
          <Plus className="h-3.5 w-3.5" />
          Add member
        </Button>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
