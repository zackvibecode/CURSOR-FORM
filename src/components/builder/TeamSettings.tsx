"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, Users, GitBranch, Split } from "lucide-react";
import { toast } from "@/components/ui/Toast";

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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-whatsapp border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-brand-text">Team Distribution</h3>
        <p className="mt-1 text-sm text-brand-muted">
          Choose how form submissions are distributed to your team.
        </p>
        {distributionMode === "distribute" && (
          <p className="mt-2 rounded-lg border border-whatsapp/20 bg-whatsapp/5 px-3 py-2 text-xs text-whatsapp-deep">
            <strong>Distribute mode:</strong> Leads rotate through the team numbers below only
            (Member 1 → 2 → 3 → … → back to 1). The main WhatsApp number in General settings is
            not used unless you add it as a team member here.
          </p>
        )}
      </div>

      {/* Distribution Mode Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
              className={`flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                isActive
                  ? "border-whatsapp bg-whatsapp/5"
                  : "border-brand-border bg-white hover:border-gray-300"
              } ${isDisabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isActive ? "bg-whatsapp/10 text-whatsapp-deep" : "bg-gray-100 text-gray-400"
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-brand-text">{mode.label}</p>
                <p className="text-xs text-brand-muted">{mode.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Team Members */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-brand-text">Team Members</h4>
          <span className="text-xs text-brand-muted">{teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}</span>
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
                  <button
                    type="button"
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-border bg-gray-50 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                  >
                    🇲🇾 +60
                  </button>
                  <Input
                    value={member.phone.replace(/^(\+60|0)/, "")}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      if (val.startsWith("6")) val = val.slice(1);
                      updateMember(index, "phone", `+60${val}`);
                    }}
                    placeholder="12-345-6789"
                    className="text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="p-2 text-gray-300 hover:text-red-500 transition-opacity opacity-60 group-hover:opacity-100"
                title="Remove member"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={addMember}
          className="mt-3 text-brand-muted hover:text-brand-text"
        >
          <Plus className="h-4 w-4" />
          Add member
        </Button>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button variant="whatsapp" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
