"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  PAYMENT_BRANDING,
  formatMoney,
  type InvoiceRecord,
} from "@/lib/payments/branding";
import { ArrowLeft, Printer } from "lucide-react";

export function InvoicePrintView({ invoice }: { invoice: InvoiceRecord }) {
  const paidDate = new Date(invoice.paid_at).toLocaleString("en-MY", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href="/dashboard/admin/payments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-fg transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payments
        </Link>
        <Button type="button" onClick={() => window.print()} size="sm">
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      <article className="invoice-sheet rounded-xl border border-border bg-card p-6 sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-xl font-bold tracking-tight text-fg">
              {PAYMENT_BRANDING.company}
            </p>
            <p className="mt-1 text-xs italic text-muted-fg">
              {PAYMENT_BRANDING.trademark}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-fg">
              Invoice
            </p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-fg">
              {invoice.invoice_number}
            </p>
            <p className="mt-2 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-700 dark:text-emerald-400">
              {invoice.status}
            </p>
          </div>
        </header>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
              Bill to
            </p>
            <p className="mt-1 text-sm font-semibold text-fg">
              {invoice.customer_name}
            </p>
            {invoice.customer_email && (
              <p className="text-sm text-muted-fg">{invoice.customer_email}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-fg">
              Pay to
            </p>
            <p className="mt-1 text-sm font-semibold text-fg">
              {PAYMENT_BRANDING.payeeName}
            </p>
            <p className="text-sm text-muted-fg">
              {PAYMENT_BRANDING.bank} · {PAYMENT_BRANDING.paymentLabel}
            </p>
            <p className="mt-2 text-xs text-muted-fg">Paid on {paidDate}</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-fg">
              <tr>
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4 text-fg">
                  <p className="font-medium">{invoice.description}</p>
                  {invoice.notes && (
                    <p className="mt-1 text-xs text-muted-fg">{invoice.notes}</p>
                  )}
                  <p className="mt-2 text-[11px] text-muted-fg">
                    Payment method: DuitNow (Maybank)
                  </p>
                </td>
                <td className="px-4 py-4 text-right font-semibold text-fg">
                  {formatMoney(Number(invoice.amount), invoice.currency)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/20">
                <td className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-fg">
                  Total
                </td>
                <td className="px-4 py-3 text-right text-base font-bold text-fg">
                  {formatMoney(Number(invoice.amount), invoice.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <footer className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-6">
          <div className="max-w-[140px] print:max-w-[120px]">
            <Image
              src={PAYMENT_BRANDING.qrImagePath}
              alt="DuitNow QR"
              width={200}
              height={260}
              className="h-auto w-full rounded-lg object-contain"
            />
          </div>
          <div className="text-right text-xs text-muted-fg">
            <p>Thank you for your payment.</p>
            <p className="mt-1 font-medium text-fg">{PAYMENT_BRANDING.company}</p>
            <p className="mt-0.5 italic">{PAYMENT_BRANDING.trademark}</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
