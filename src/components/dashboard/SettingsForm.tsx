"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { toast } from "@/components/ui/Toast";

export function SettingsForm() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    businessName: "ZAQONE Business",
    whatsappNumber: "+60123456789",
    defaultMessage:
      "Hi, I would like to submit my details:\nName:\nPhone:\nEmail:\nService:\nQuantity:\nPreferred Date:\nMessage:",
    themeColor: "#25D366",
    redirectAfterSubmit: "",
    emailNotifications: true,
    whatsappNotifications: true,
    submissionAlerts: false,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // TODO: Save to Supabase database
    // await supabase.from('form_settings').upsert({ ... })
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      toast("Settings saved successfully", "success");
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  };

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-2xl space-y-8">
      <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-semibold text-brand-text">Business Profile</h2>
        <div className="space-y-5">
          <div>
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={settings.businessName}
              onChange={(e) =>
                setSettings((s) => ({ ...s, businessName: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              value={settings.whatsappNumber}
              onChange={(e) =>
                setSettings((s) => ({ ...s, whatsappNumber: e.target.value }))
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
              value={settings.defaultMessage}
              onChange={(e) =>
                setSettings((s) => ({ ...s, defaultMessage: e.target.value }))
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
                value={settings.themeColor}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, themeColor: e.target.value }))
                }
                className="h-11 w-16 cursor-pointer rounded-xl border border-brand-border"
              />
              <Input
                value={settings.themeColor}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, themeColor: e.target.value }))
                }
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="redirect">Redirect After Submit</Label>
            <Input
              id="redirect"
              value={settings.redirectAfterSubmit}
              onChange={(e) =>
                setSettings((s) => ({ ...s, redirectAfterSubmit: e.target.value }))
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
            checked={settings.emailNotifications}
            onChange={(checked) =>
              setSettings((s) => ({ ...s, emailNotifications: checked }))
            }
          />
          <Toggle
            id="waNotif"
            label="WhatsApp notifications for new submissions"
            checked={settings.whatsappNotifications}
            onChange={(checked) =>
              setSettings((s) => ({ ...s, whatsappNotifications: checked }))
            }
          />
          <Toggle
            id="alerts"
            label="Daily submission summary alerts"
            checked={settings.submissionAlerts}
            onChange={(checked) =>
              setSettings((s) => ({ ...s, submissionAlerts: checked }))
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
