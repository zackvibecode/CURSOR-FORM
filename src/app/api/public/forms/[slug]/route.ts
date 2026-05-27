import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const supabase = await createClient();

  const { data: form, error } = await supabase
    .from("forms")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", form.id)
    .order("order_index");

  return NextResponse.json({ form, fields: fields ?? [] });
}
