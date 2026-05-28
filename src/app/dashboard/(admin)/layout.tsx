import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  // Pass auth data via React context instead of re-fetching in child pages
  return (
    <DashboardShell userName={profile?.name ?? user.email}>
      {children}
    </DashboardShell>
  );
}
