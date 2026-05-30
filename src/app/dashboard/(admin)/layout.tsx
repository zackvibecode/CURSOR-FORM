import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PlanStatusBanner } from "@/components/dashboard/PlanStatusBanner";

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

  const [
    { data: profile },
    { data: subscription },
    { count: formsCount },
  ] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    supabase.from("subscriptions").select("plan, status").eq("user_id", user.id).single(),
    supabase
      .from("forms")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  // Pass auth data via React context instead of re-fetching in child pages
  return (
    <DashboardShell
      userName={profile?.name ?? user.email}
      plan={subscription?.plan ?? "free"}
      status={subscription?.status ?? "active"}
      formsCount={formsCount ?? 0}
    >
      <PlanStatusBanner
        plan={subscription?.plan ?? "free"}
        status={subscription?.status ?? "active"}
      />
      {children}
    </DashboardShell>
  );
}
