import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { buildInvoiceNumberPrefix } from "@/lib/payments/branding";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoices: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    customer_name?: string;
    customer_email?: string;
    amount?: number | string;
    description?: string;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const customerName =
    typeof body.customer_name === "string" ? body.customer_name.trim() : "";
  const customerEmail =
    typeof body.customer_email === "string" ? body.customer_email.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const amountRaw =
    typeof body.amount === "number"
      ? body.amount
      : typeof body.amount === "string"
        ? Number(body.amount)
        : NaN;

  if (!customerName) {
    return NextResponse.json(
      { error: "customer_name is required." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(amountRaw) || amountRaw < 0) {
    return NextResponse.json(
      { error: "amount must be a valid non-negative number." },
      { status: 400 }
    );
  }
  if (!description) {
    return NextResponse.json(
      { error: "description is required." },
      { status: 400 }
    );
  }

  const prefix = buildInvoiceNumberPrefix();
  const { count, error: countError } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .like("invoice_number", `${prefix}-%`);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const seq = String((count ?? 0) + 1).padStart(3, "0");
  const invoiceNumber = `${prefix}-${seq}`;
  const paidAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      customer_name: customerName,
      customer_email: customerEmail || null,
      amount: Number(amountRaw.toFixed(2)),
      currency: "MYR",
      description,
      notes: notes || null,
      payment_method: "duitnow_maybank",
      status: "paid",
      paid_at: paidAt,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoice: data }, { status: 201 });
}
