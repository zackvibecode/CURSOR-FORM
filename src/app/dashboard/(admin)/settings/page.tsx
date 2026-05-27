import { SettingsForm } from "@/components/dashboard/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-text">Settings</h2>
        <p className="text-brand-muted">
          Configure your business profile, WhatsApp integration, and notifications
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
