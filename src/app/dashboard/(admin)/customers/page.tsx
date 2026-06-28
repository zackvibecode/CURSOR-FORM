import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { extractCustomers, mapSubmissionsToRows } from "@/lib/dashboard-stats";
import { formatDate } from "@/lib/utils";
import { Phone } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-fg">Customers</h2>
        <p className="text-sm text-muted-fg">
          Unique contacts collected through your WhatsApp forms
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-fg">No customers yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Name
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Phone
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Last form
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    Last seen
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-[11px] font-semibold text-muted-fg">
                          {customer.name?.trim()?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="font-medium text-fg">{customer.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-fg">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-fg">{customer.formName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={customer.status}>{customer.status}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-fg">
                      {formatDate(customer.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
