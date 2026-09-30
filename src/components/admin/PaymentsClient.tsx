"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  ArrowUpRight,
  Banknote,
  ExternalLink,
  Loader2,
  RefreshCw,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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

  const stats = useMemo(() => {
    const now = new Date();
    let today = 0;
    let month = 0;
    let total = 0;
    for (const inv of invoices) {
      if (inv.status !== "paid") continue;
      const amount = Number(inv.amount);
      total += amount;
      const d = new Date(inv.paid_at);
      if (isSameDay(d, now)) today += amount;
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        month += amount;
      }
    }
    return { today, month, total, count: invoices.length };
  }, [invoices]);

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
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Stats */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-fg">
            <Wallet className="h-3.5 w-3.5" />
            <p className="text-xs font-medium">Hari ini</p>
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight text-fg">
            {formatMoney(stats.today)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-fg">
            <TrendingUp className="h-3.5 w-3.5" />
            <p className="text-xs font-medium">Bulan ini</p>
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight text-fg">
            {formatMoney(stats.month)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-fg">
            <Receipt className="h-3.5 w-3.5" />
            <p className="text-xs font-medium">Jumlah ({stats.count} invois)</p>
          </div>
          <p className="mt-2 text-xl font-semibold tracking-tight text-fg">
            {formatMoney(stats.total)}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* QR card */}
        <section className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center">
          <div className="flex items-center gap-2 text-muted-fg">
            <Banknote className="h-3.5 w-3.5" />
            <p className="text-xs font-semibold uppercase tracking-wide">
              {PAYMENT_BRANDING.bank} · {PAYMENT_BRANDING.paymentLabel}
            </p>
          </div>
          <h3 className="mt-3 text-base font-semibold leading-snug text-fg">
            {PAYMENT_BRANDING.payeeName}
          </h3>
          <p className="text-xs text-muted-fg">{PAYMENT_BRANDING.company}</p>

          <div className="mt-5 w-full max-w-[280px] overflow-hidden rounded-2xl shadow-sm ring-1 ring-border">
            <Image
              src={PAYMENT_BRANDING.qrImagePath}
              alt="Maybank Malaysia National QR / DuitNow"
              width={640}
              height={820}
              className="h-auto w-full object-contain"
              priority
            />
          </div>

          <div className="mt-4 w-full max-w-[280px] rounded-lg bg-muted/40 px-4 py-2.5">
            <p className="text-[11px] text-muted-fg">Pakej Pro</p>
            <p className="text-sm font-semibold text-fg">
              {formatMoney(PAYMENT_BRANDING.proPackagePrice)} / bulanan
            </p>
          </div>

          <p className="mt-3 text-[11px] italic text-muted-fg">
            {PAYMENT_BRANDING.trademark}
          </p>
        </section>

        {/* Record payment */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <form onSubmit={onSubmit} className="flex h-full flex-col space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-fg">Rekod bayaran</h3>
              <p className="text-xs text-muted-fg">
                Lepas pelanggan bayar ke QR, isi nama & generate invoice.
              </p>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Nama pelanggan</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
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
                />
              </div>

              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-fg">Jumlah bayaran</p>
                <p className="mt-0.5 text-lg font-bold text-fg">
                  {formatMoney(PAYMENT_BRANDING.proPackagePrice)}
                </p>
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
                <>
                  <Receipt className="h-4 w-4" />
                  Record & Generate Invoice
                </>
              )}
            </Button>
          </form>
        </section>
      </div>

      {/* History */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">Sejarah invois</h3>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-fg transition-colors hover:bg-muted hover:text-fg disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading && invoices.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-xs text-muted-fg">
            Loading…
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-xs text-muted-fg">
            Tiada rekod lagi.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40">
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
                      className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-fg transition-colors hover:text-fg"
                    >
                      View
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <p className="flex items-center justify-center gap-1 text-center text-[11px] text-muted-fg">
        <ArrowUpRight className="h-3 w-3" />
        Reminder pembaharuan akan dipaparkan dalam dashboard pelanggan 7 hari sebelum pelan tamat.
      </p>
    </div>
  );
}
