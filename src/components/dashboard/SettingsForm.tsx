import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export function SettingsContent({ profile }: { profile: { email: string } | null }) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-semibold text-brand-text">Account</h2>
        <p className="mb-6 text-sm text-brand-muted">
          Your account settings. Most form settings (WhatsApp number, messages, theme) are
          configured per-form in the{" "}
          <Link href="/dashboard/forms" className="font-semibold text-whatsapp hover:underline">
            form builder
          </Link>
          .
        </p>
        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={profile?.email ?? ""} disabled />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-semibold text-brand-text">Where to configure</h2>
        <div className="space-y-3 text-sm text-brand-muted">
          <p>
            &bull; <strong>WhatsApp number, messages, theme color</strong> &mdash; set per form in the form
            builder
          </p>
          <p>
            &bull; <strong>Form fields, status, slug</strong> &mdash; edit your form in the Forms page
          </p>
          <p>
            &bull; <strong>Email &amp; password</strong> &mdash; managed by Supabase Auth (reset via login
            page)
          </p>
        </div>
      </section>
    </div>
  );
}
