"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { toast } from "@/components/ui/Toast";
import { Check } from "lucide-react";

interface UserSettings {
  business_name?: string | null;
  whatsapp_number?: string | null;
  default_message?: string | null;
  theme_color?: string | null;
  redirect_after_submit?: string | null;
  email_notifications?: boolean;
  whatsapp_notifications?: boolean;
  submission_alerts?: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  business_name: "",
  whatsapp_number: "",
  default_message:
    "Hi, I would like to submit my details:\nName:\nPhone:\nEmail:\nService:\nQuantity:\nPreferred Date:\nMessage:",
  theme_color: "#10D050",
  redirect_after_submit: "",
  email_notifications: true,
  whatsapp_notifications: true,
  submission_alerts: false,
};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 border-b border-border pb-3">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-fg">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function SettingsForm({ profileEmail }: { profileEmail: string }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings({
              ...DEFAULT_SETTINGS,
              ...data.settings,
            });
          }
        }
      } catch {
        toast("Failed to load settings", "error");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error ?? "Failed to save settings", "error");
        setSaving(false);
        return;
      }

      toast("Settings saved successfully", "success");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-fg">Loading settings…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-5">
      <SectionCard title="Business Profile" description="Your business identity shown on forms.">
        <div className="space-y-4">
          <div>
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              value={settings.business_name ?? ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, business_name: e.target.value }))
              }
              placeholder="Your business name"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profileEmail} disabled />
          </div>
          <div>
            <Label htmlFor="whatsappNumber">WhatsApp number</Label>
            <Input
              id="whatsappNumber"
              value={settings.whatsapp_number ?? ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, whatsapp_number: e.target.value }))
              }
              placeholder="+60123456789"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="WhatsApp Configuration" description="Defaults applied to new forms.">
        <div className="space-y-4">
          <div>
            <Label htmlFor="defaultMessage">Default WhatsApp message</Label>
            <Textarea
              id="defaultMessage"
              value={settings.default_message ?? ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, default_message: e.target.value }))
              }
              className="min-h-[140px] font-mono text-sm"
            />
          </div>
          <div>
            <Label htmlFor="themeColor">Form theme color</Label>
            <div className="flex items-center gap-2">
              <input
                id="themeColor"
                type="color"
                value={settings.theme_color ?? "#10D050"}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, theme_color: e.target.value }))
                }
                className="h-9 w-12 cursor-pointer rounded-md border border-border bg-card"
              />
              <Input
                value={settings.theme_color ?? ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, theme_color: e.target.value }))
                }
                className="flex-1 font-mono"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="redirect">Redirect after submit (optional)</Label>
            <Input
              id="redirect"
              value={settings.redirect_after_submit ?? ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, redirect_after_submit: e.target.value }))
              }
              placeholder="https://yourwebsite.com/thank-you"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Notifications" description="Choose how you want to be alerted.">
        <div className="space-y-4">
          <Toggle
            id="emailNotif"
            label="Email notifications for new submissions"
            checked={settings.email_notifications ?? true}
            onChange={(checked) =>
              setSettings((s) => ({ ...s, email_notifications: checked }))
            }
          />
          <Toggle
            id="waNotif"
            label="WhatsApp notifications for new submissions"
            checked={settings.whatsapp_notifications ?? true}
            onChange={(checked) =>
              setSettings((s) => ({ ...s, whatsapp_notifications: checked }))
            }
          />
          <Toggle
            id="alerts"
            label="Daily submission summary alerts"
            checked={settings.submission_alerts ?? false}
            onChange={(checked) =>
              setSettings((s) => ({ ...s, submission_alerts: checked }))
            }
          />
        </div>
      </SectionCard>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-whatsapp-deep dark:text-whatsapp">
            <Check className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
