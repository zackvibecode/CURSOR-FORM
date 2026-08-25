"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
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
          amount: PAYMENT_BRANDING.proPackagePrice,
          description: PAYMENT_BRANDING.proPackageLabel,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to record payment");
      const invoice = json.invoice as InvoiceRecord;
      setCustomerName("");
      setCustomerEmail("");
      router.push(`/dashboard/admin/payments/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-10">
      {/* QR — big & clean */}
      <section className="flex flex-col items-center text-center">
        <p className="text-sm font-semibold tracking-wide text-fg">
          {PAYMENT_BRANDING.company}
        </p>
        <h3 className="mt-2 max-w-sm text-base font-medium leading-snug text-fg">
          {PAYMENT_BRANDING.payeeName}
        </h3>
        <p className="mt-1 text-xs text-muted-fg">
          {PAYMENT_BRANDING.bank} · {PAYMENT_BRANDING.paymentLabel}
        </p>

        <div className="mt-6 w-full max-w-[320px] overflow-hidden rounded-2xl shadow-sm ring-1 ring-border">
          <Image
            src={PAYMENT_BRANDING.qrImagePath}
            alt="Maybank Malaysia National QR / DuitNow"
            width={640}
            height={820}
            className="h-auto w-full object-contain"
            priority
          />
        </div>

        <p className="mt-4 text-[11px] italic text-muted-fg">
          {PAYMENT_BRANDING.trademark}
        </p>
      </section>

      {/* Simple form */}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-fg">Record payment</h3>
          <p className="text-xs text-muted-fg">
            Lepas bayar, isi & generate invoice.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="customerName">Nama</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder=""
              required
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-fg">Pakej</p>
            <p className="mt-0.5 text-sm font-semibold text-fg">
              {PAYMENT_BRANDING.proPackageLabel} ·{" "}
              {formatMoney(PAYMENT_BRANDING.proPackagePrice)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customerEmail">Email (optional)</Label>
            <Input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder=""
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        <Button type="submit" disabled={submitting} className="w-full">
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

      {/* History */}
      <section className="space-y-3 border-t border-border pt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">History</h3>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-muted hover:text-fg disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading && invoices.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-fg">Loading…</p>
        ) : invoices.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-fg">
            Tiada rekod lagi.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-fg">
                      {inv.customer_name}
                    </span>
                    <Badge
                      variant={inv.status === "paid" ? "converted" : "default"}
                      className="shrink-0"
                    >
                      {inv.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-fg">
                    {inv.invoice_number} ·{" "}
                    {new Date(inv.paid_at).toLocaleDateString("en-MY", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-fg">
                    {formatMoney(Number(inv.amount), inv.currency)}
                  </p>
                  <Link
                    href={`/dashboard/admin/payments/${inv.id}`}
                    className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-fg hover:text-fg"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
