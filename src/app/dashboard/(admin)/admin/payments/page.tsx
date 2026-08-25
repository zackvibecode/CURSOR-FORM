import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/auth/is-admin";
import { PaymentsClient } from "@/components/admin/PaymentsClient";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const { user, isAdmin } = await getAdminContext(supabase);

  if (!user) redirect("/login");
  if (!isAdmin) redirect("/dashboard/forms");

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-fg">Payments</h2>
      </div>
      <PaymentsClient />
    </div>
  );
}
