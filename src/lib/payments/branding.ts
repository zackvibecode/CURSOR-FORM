export const PAYMENT_BRANDING = {
  company: "ZAQONE.COM",
  payeeName: "MUHAMMAD ZARUL ZAQ'WAN BIN NASARUDDIN",
  bank: "Maybank Malaysia",
  paymentLabel: "DuitNow",
  trademark: "zarul zaqwan your developer",
  qrImagePath: "/IMG_3906.PNG",
  currency: "MYR",
  currencySymbol: "RM",
} as const;

export type InvoiceRecord = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  amount: number;
  currency: string;
  description: string;
  notes: string | null;
  payment_method: string;
  status: string;
  paid_at: string;
  created_by: string;
  created_at: string;
};

/** Build invoice number like ZQ-20260825-001 */
export function buildInvoiceNumberPrefix(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `ZQ-${y}${m}${d}`;
}

export function formatMoney(amount: number, currency = "MYR"): string {
  const symbol = currency === "MYR" ? "RM" : currency;
  return `${symbol} ${Number(amount).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
