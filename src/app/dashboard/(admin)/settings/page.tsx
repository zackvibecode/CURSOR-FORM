import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-fg">Settings</h2>
        <p className="text-sm text-muted-fg">
          Configure your business profile, WhatsApp integration, and notifications
        </p>
      </div>
      <SettingsForm profileEmail={profile?.email ?? user.email ?? ""} />
    </div>
  );
}
