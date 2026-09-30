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
      <div>
        <h2 className="text-lg font-semibold text-fg">Payments & Billing</h2>
        <p className="text-sm text-muted-fg">
          Rekod bayaran DuitNow, generate invoice, dan pantau custahan.
        </p>
      </div>
      <PaymentsClient />
    </div>
  );
}
