import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formUpdateBodySchema } from "@/lib/form-schema";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { mergeFormSettings } from "@/lib/form-settings";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: form, error } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", id)
    .order("order_index");

  return NextResponse.json({ form, fields: fields ?? [] });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existingForm } = await supabase
    .from("forms")
    .select("id, settings")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existingForm) {
    return NextResponse.json({ error: "Form not found or access denied" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = formUpdateBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { title, slug, whatsapp_number, cta_text, description, status, fields, settings } =
    parsed.data;

  if (slug) {
    if (isReservedSlug(slug)) {
      return NextResponse.json({ error: "This URL is reserved and cannot be used" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("forms")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "This URL slug is already taken" }, { status: 409 });
    }
  }

  const mergedSettings = mergeFormSettings(existingForm.settings, settings);

  const { data: form, error } = await supabase
    .from("forms")
    .update({
      title,
      slug,
      whatsapp_number,
      cta_text,
      description,
      status,
      ...(mergedSettings !== undefined ? { settings: mergedSettings } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !form) {
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 500 });
  }

  // Use RPC to bypass RLS for field updates (ownership verified inside function)
  if (Array.isArray(fields) && fields.length > 0) {
    const rpcFields = fields.map((f: Record<string, unknown>, i: number) => ({
      id: f.id,
      type: f.type,
      label: f.label,
      placeholder: f.placeholder ?? "",
      required: f.required ?? false,
      options: f.options ?? [],
      order_index: i,
      settings: f.settings ?? {},
    }));

    const { error: rpcError } = await supabase.rpc("upsert_form_fields", {
      p_form_id: id,
      p_user_id: user.id,
      p_fields: rpcFields,
    });

    if (rpcError) {
      console.error("[forms] RPC upsert_form_fields failed:", rpcError.message);
      return NextResponse.json(
        { error: "Failed to update fields. Please try again." },
        { status: 500 }
      );
    }
  }

  const { data: updatedFields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", id)
    .order("order_index");

  return NextResponse.json({ form, fields: updatedFields ?? [] });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("forms")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}