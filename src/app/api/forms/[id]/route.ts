import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Verify ownership first — return 403 if not owner
  const { data: existingForm } = await supabase
    .from("forms")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existingForm) {
    return NextResponse.json({ error: "Form not found or access denied" }, { status: 403 });
  }

  const body = await request.json();
  const { title, slug, whatsapp_number, cta_text, description, status, fields } = body;

  if (slug) {
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

  const { data: form, error } = await supabase
    .from("forms")
    .update({
      title,
      slug,
      whatsapp_number,
      cta_text,
      description,
      status,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !form) {
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 500 });
  }

  // Update fields safely: insert new fields first, then delete old ones
  if (Array.isArray(fields)) {
    // Step 1: Fetch current field IDs so we know what to delete later
    const { data: currentFields } = await supabase
      .from("form_fields")
      .select("id")
      .eq("form_id", id);

    const oldFieldIds = new Set(
      (currentFields ?? []).map((f: { id: string }) => f.id)
    );

    // Step 2: Collect incoming IDs (fields being kept/updated)
    const incomingIds = new Set(
      fields.map((f) => f.id).filter(Boolean) as string[]
    );

    // Step 3: Insert new fields (those without existing IDs)
    const fieldsToInsert = fields
      .filter((f) => !f.id || !oldFieldIds.has(f.id))
      .map(
        (
          f: {
            id?: string;
            type: string;
            label: string;
            placeholder?: string;
            required: boolean;
            options?: string[];
            settings?: Record<string, unknown>;
          },
          index: number
        ) => ({
          form_id: id,
          type: f.type,
          label: f.label,
          placeholder: f.placeholder ?? "",
          required: f.required ?? false,
          options: f.options ?? [],
          order_index: index,
          settings: f.settings ?? {},
        })
      );

    if (fieldsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("form_fields")
        .insert(fieldsToInsert);

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to save fields. Please try again." },
          { status: 500 }
        );
      }
    }

    // Step 4: Update existing fields (those with IDs that still exist)
    for (const f of fields) {
      if (f.id && oldFieldIds.has(f.id)) {
        const index = fields.findIndex((x) => x.id === f.id);
        await supabase
          .from("form_fields")
          .update({
            type: f.type,
            label: f.label,
            placeholder: f.placeholder ?? "",
            required: f.required ?? false,
            options: f.options ?? [],
            order_index: index,
            settings: f.settings ?? {},
          })
          .eq("id", f.id);
      }
    }

    // Step 5: Delete old fields that are no longer referenced
    const idsToDelete = Array.from(oldFieldIds).filter((oldId) => !incomingIds.has(oldId));
    if (idsToDelete.length > 0) {
      await supabase.from("form_fields").delete().in("id", idsToDelete);
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
