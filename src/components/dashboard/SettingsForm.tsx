"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { toast } from "@/components/ui/Toast";

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
      <div className="mx-auto max-w-2xl rounded-2xl border border-brand-border bg-white p-12 text-center shadow-card">
        <p className="text-brand-muted">Loading settings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-2xl space-y-8">
      <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-semibold text-brand-text">Business Profile</h2>
        <div className="space-y-5">
          <div>
            <Label htmlFor="businessName">Business Name</Label>
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
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
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
      </section>

      <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-semibold text-brand-text">WhatsApp Configuration</h2>
        <div className="space-y-5">
          <div>
            <Label htmlFor="defaultMessage">Default WhatsApp Message</Label>
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
            <Label htmlFor="themeColor">Form Theme Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="themeColor"
                type="color"
                value={settings.theme_color ?? "#10D050"}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, theme_color: e.target.value }))
                }
                className="h-11 w-16 cursor-pointer rounded-xl border border-brand-border"
              />
              <Input
                value={settings.theme_color ?? ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, theme_color: e.target.value }))
                }
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="redirect">Redirect After Submit (optional)</Label>
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
      </section>

      <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-semibold text-brand-text">Notification Settings</h2>
        <div className="space-y-5">
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
      </section>

      <div className="flex items-center gap-4">
        <Button type="submit" variant="whatsapp" showWhatsAppIcon disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        {saved && (
          <span className="text-sm font-medium text-whatsapp-deep">Settings saved!</span>
        )}
      </div>
    </form>
  );
}
