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
  meta_pixel_id?: string | null;
  meta_pixel_enabled?: boolean;
  n8n_webhook_url?: string | null;
  notification_email?: string | null;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
  telegram_notifications?: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  business_name: "",
  whatsapp_number: "",
  default_message:
    "Hi, I would like to submit my details:\nName:\nPhone:\nEmail:\nService:\nQuantity:\nPreferred Date:\nMessage:",
  theme_color: "#10D050",
  redirect_after_submit: "",
  email_notifications: true,
  whatsapp_notifications: false,
  submission_alerts: true,
  meta_pixel_id: "",
  meta_pixel_enabled: false,
  n8n_webhook_url: "",
  notification_email: "",
  telegram_bot_token: "",
  telegram_chat_id: "",
  telegram_notifications: false,
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
  const [testingTelegram, setTestingTelegram] = useState(false);

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

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      const res = await fetch("/api/settings/test-telegram", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error ?? "Telegram test failed", "error");
        return;
      }
      toast("Telegram test sent — check your bot/chat", "success");
    } catch {
      toast("Network error. Please try again.", "error");
    } finally {
      setTestingTelegram(false);
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

      <SectionCard title="Notifications" description="Alert bila ada submission baru. Setup satu persatu ikut channel kau.">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <Toggle
              id="waNotif"
              label="1. WhatsApp via n8n"
              checked={settings.whatsapp_notifications ?? false}
              onChange={(checked) =>
                setSettings((s) => ({ ...s, whatsapp_notifications: checked }))
              }
            />
            <p className="mt-2 text-xs text-muted-fg">
              OneForm hantar webhook ke n8n. Dalam n8n, guna node WhatsApp untuk hantar mesej ke nombor kau.
            </p>
            {settings.whatsapp_notifications && (
              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="n8nWebhook">n8n Webhook URL</Label>
                  <Input
                    id="n8nWebhook"
                    value={settings.n8n_webhook_url ?? ""}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, n8n_webhook_url: e.target.value }))
                    }
                    placeholder="https://your-n8n.com/webhook/oneform-leads"
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-[11px] leading-relaxed text-muted-fg">
                  Payload termasuk <span className="font-mono">whatsapp_message</span>,{" "}
                  <span className="font-mono">owner.whatsapp_number</span>, dan semua jawapan form.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <Toggle
              id="emailNotif"
              label="2. Email (Resend)"
              checked={settings.email_notifications ?? true}
              onChange={(checked) =>
                setSettings((s) => ({ ...s, email_notifications: checked }))
              }
            />
            <p className="mt-2 text-xs text-muted-fg">
              Hantar email alert guna Resend. Admin perlu set <span className="font-mono">RESEND_API_KEY</span> dalam Vercel env.
            </p>
            {settings.email_notifications && (
              <div className="mt-3">
                <Label htmlFor="notificationEmail">Alert email (optional)</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  value={settings.notification_email ?? ""}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, notification_email: e.target.value }))
                  }
                  placeholder={profileEmail || "Leave empty to use account email"}
                />
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <Toggle
              id="alerts"
              label="3. Dashboard realtime"
              checked={settings.submission_alerts ?? true}
              onChange={(checked) =>
                setSettings((s) => ({ ...s, submission_alerts: checked }))
              }
            />
            <p className="mt-2 text-xs text-muted-fg">
              Popup toast & badge dalam dashboard bila lead baru masuk (dashboard mesti dibuka).
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <Toggle
              id="telegramNotif"
              label="4. Telegram bot"
              checked={settings.telegram_notifications ?? false}
              onChange={(checked) =>
                setSettings((s) => ({ ...s, telegram_notifications: checked }))
              }
            />
            <p className="mt-2 text-xs text-muted-fg">
              Hantar mesej ke Telegram group/chat bila ada submission.
            </p>
            {settings.telegram_notifications && (
              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="telegramBotToken">Bot token</Label>
                  <Input
                    id="telegramBotToken"
                    value={settings.telegram_bot_token ?? ""}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, telegram_bot_token: e.target.value }))
                    }
                    placeholder="123456789:ABCdefGHI..."
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="telegramChatId">Chat ID</Label>
                  <Input
                    id="telegramChatId"
                    value={settings.telegram_chat_id ?? ""}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, telegram_chat_id: e.target.value }))
                    }
                    placeholder="-1001234567890"
                    className="font-mono text-sm"
                  />
                  <p className="mt-1 text-[11px] text-muted-fg">
                    Chat dengan bot dulu (@BotFather → /newbot). Untuk group: tambah bot, hantar
                    mesej, dapatkan chat id dari @userinfobot / getUpdates.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={testingTelegram}
                  onClick={() => void handleTestTelegram()}
                >
                  {testingTelegram ? "Sending…" : "Test Telegram"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Meta Pixel Analytics" description="Tracks PageView on form load, and zaqoneformSubmit (browser + Conversions API) when a visitor submits.">
        <div className="space-y-4">
          <Toggle
            id="metaPixelEnabled"
            label="Enable Meta Pixel tracking"
            checked={settings.meta_pixel_enabled ?? false}
            onChange={(checked) =>
              setSettings((s) => ({ ...s, meta_pixel_enabled: checked }))
            }
          />
          {settings.meta_pixel_enabled && (
            <div>
              <Label htmlFor="metaPixelId">Meta Pixel ID</Label>
              <Input
                id="metaPixelId"
                value={settings.meta_pixel_id ?? ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, meta_pixel_id: e.target.value.trim() }))
                }
                placeholder="123456789012345"
              />
            </div>
          )}
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
