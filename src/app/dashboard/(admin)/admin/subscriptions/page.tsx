import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/auth/is-admin";
import { AdminSubscriptionsClient } from "@/components/admin/AdminSubscriptionsClient";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await getAdminContext(supabase);

  if (!user) redirect("/login");
  // Non-admins must never see this page.
  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-text">Subscription Requests</h2>
        <p className="text-brand-muted">
          Approve or reject paid plan requests after confirming payment.
        </p>
      </div>
      <AdminSubscriptionsClient />
    </div>
  );
}
