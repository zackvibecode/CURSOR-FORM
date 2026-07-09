import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/auth/is-admin";
import { AdminSubscriptionsClient } from "@/components/admin/AdminSubscriptionsClient";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await getAdminContext(supabase);

  if (!user) redirect("/login");
  if (!isAdmin) redirect("/dashboard/forms");

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-fg">Subscription Requests</h2>
        <p className="text-sm text-muted-fg">
          Approve or reject paid plan requests after confirming payment.
        </p>
      </div>
      <AdminSubscriptionsClient />
    </div>
  );
}
