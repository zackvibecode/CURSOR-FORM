import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/auth/is-admin";
import { InvoicePrintView } from "@/components/admin/InvoicePrintView";
import type { InvoiceRecord } from "@/lib/payments/branding";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { user, isAdmin } = await getAdminContext(supabase);

  if (!user) redirect("/login");
  if (!isAdmin) redirect("/dashboard/forms");

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", params.id)
    .eq("created_by", user.id)
    .single();

  if (error || !data) notFound();

  return <InvoicePrintView invoice={data as InvoiceRecord} />;
}
