import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { extractCustomers, mapSubmissionsToRows } from "@/lib/dashboard-stats";
import { formatDate } from "@/lib/utils";
import { Phone, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: forms } = await supabase
    .from("forms")
    .select("id, title")
    .eq("user_id", user.id);

  const formIds = (forms ?? []).map((f) => f.id);
  let customers: ReturnType<typeof extractCustomers> = [];

  if (formIds.length > 0) {
    // Parallel queries for speed
    const [submissionsResult, fieldsResult] = await Promise.all([
      supabase
        .from("submissions")
        .select("*, forms(title)")
        .in("form_id", formIds)
        .order("submitted_at", { ascending: false }),
      supabase
        .from("form_fields")
        .select("id, label, type, form_id")
        .in("form_id", formIds),
    ]);

    const submissions = mapSubmissionsToRows(
      submissionsResult.data ?? [],
      forms ?? [],
      fieldsResult.data ?? []
    );
    customers = extractCustomers(submissions);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-text">Customers</h2>
        <p className="text-brand-muted">
          Unique contacts collected through your WhatsApp forms
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-brand-border bg-white p-12 text-center shadow-card">
          <p className="text-brand-muted">No customers yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-2xl border border-brand-border bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-lg"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-whatsapp/10 text-whatsapp">
                  <User className="h-5 w-5" />
                </div>
                <Badge variant={customer.status}>{customer.status}</Badge>
              </div>
              <h3 className="font-semibold text-brand-text">{customer.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-brand-muted">
                <Phone className="h-3.5 w-3.5" />
                {customer.phone}
              </p>
              <p className="mt-3 text-xs text-brand-muted">
                Last form: {customer.formName} · {formatDate(customer.date)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
