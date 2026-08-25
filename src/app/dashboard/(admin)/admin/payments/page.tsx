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
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-fg">Payments</h2>
        <p className="text-sm text-muted-fg">
          Maybank DuitNow QR · Record payment and generate invoice.
        </p>
      </div>
      <PaymentsClient />
    </div>
  );
}
