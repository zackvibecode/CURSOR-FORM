"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
  PAYMENT_BRANDING,
  formatMoney,
  type InvoiceRecord,
} from "@/lib/payments/branding";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";

export function PaymentsClient() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invoices");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setInvoices(json.invoices ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          amount: Number(amount),
          description,
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to record payment");
      const invoice = json.invoice as InvoiceRecord;
      setCustomerName("");
      setCustomerEmail("");
      setAmount("");
      setDescription("");
      setNotes("");
      router.push(`/dashboard/admin/payments/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
        {/* QR card */}
        <aside className="rounded-xl border border-border bg-card p-5">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-fg">
            {PAYMENT_BRANDING.company}
          </p>
          <h3 className="mt-1 text-center text-sm font-semibold leading-snug text-fg">
            {PAYMENT_BRANDING.payeeName}
          </h3>
          <p className="mt-1 text-center text-xs text-muted-fg">
            {PAYMENT_BRANDING.bank} · {PAYMENT_BRANDING.paymentLabel}
          </p>
          <div className="mx-auto mt-4 flex max-w-[220px] justify-center overflow-hidden rounded-2xl bg-[#e91e63]/10 p-2">
            <Image
              src={PAYMENT_BRANDING.qrImagePath}
              alt="Maybank Malaysia National QR / DuitNow"
              width={400}
              height={520}
              className="h-auto w-full rounded-xl object-contain"
              priority
            />
          </div>
          <p className="mt-4 text-center text-[10px] italic tracking-wide text-muted-fg">
            {PAYMENT_BRANDING.trademark}
          </p>
        </aside>

        {/* Record form */}
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-5"
        >
          <div>
            <h3 className="text-sm font-semibold text-fg">Record payment</h3>
            <p className="mt-0.5 text-xs text-muted-fg">
              After customer pays via DuitNow, record here — invoice generates
              automatically.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="customerName">Customer name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer full name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerEmail">Email (optional)</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (RM)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="29.00"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Pro Monthly subscription"
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reference, plan cycle, etc."
                className="min-h-[80px]"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              "Record & Generate Invoice"
            )}
          </Button>
        </form>
      </div>

      {/* History */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">Payment history</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-fg">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Invoice</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-fg">
                      Loading…
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-fg">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-fg">
                        {inv.invoice_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-fg">{inv.customer_name}</div>
                        {inv.customer_email && (
                          <div className="text-xs text-muted-fg">
                            {inv.customer_email}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-fg">
                        {formatMoney(Number(inv.amount), inv.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={inv.status === "paid" ? "converted" : "default"}
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-fg">
                        {new Date(inv.paid_at).toLocaleString("en-MY", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/admin/payments/${inv.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-whatsapp-deep hover:text-whatsapp dark:text-whatsapp"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
