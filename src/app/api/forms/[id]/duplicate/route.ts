import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { checkFormLimit } from "@/lib/check-limits";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id: sourceId } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitCheck = await checkFormLimit(user.id);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: "form_limit_reached",
        message: `You've reached your ${limitCheck.plan} plan limit of ${limitCheck.max} forms. Upgrade to create more forms.`,
        limit: limitCheck,
      },
      { status: 403 }
    );
  }

  const { data: sourceForm, error: formError } = await supabase
    .from("forms")
    .select("*")
    .eq("id", sourceId)
    .eq("user_id", user.id)
    .single();

  if (formError || !sourceForm) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const [{ data: sourceFields }, { data: teamSettings }] = await Promise.all([
    supabase
      .from("form_fields")
      .select("type, label, placeholder, required, options, order_index, settings")
      .eq("form_id", sourceId)
      .order("order_index"),
    supabase
      .from("form_team_settings")
      .select("distribution_mode, team_members")
      .eq("form_id", sourceId)
      .maybeSingle(),
  ]);

  const copyTitle = `${sourceForm.title.replace(/\s*\(Copy\)$/i, "")} (Copy)`;
  const baseSlug = slugify(copyTitle) || "form";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

  const { data: newForm, error: insertError } = await supabase
    .from("forms")
    .insert({
      user_id: user.id,
      title: copyTitle,
      slug,
      whatsapp_number: sourceForm.whatsapp_number ?? "",
      cta_text: sourceForm.cta_text ?? "Submit on WhatsApp",
      description: sourceForm.description ?? "",
      status: "draft",
      settings: sourceForm.settings ?? {},
    })
    .select()
    .single();

  if (insertError || !newForm) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to duplicate form" },
      { status: 500 }
    );
  }

  if (sourceFields && sourceFields.length > 0) {
    const fieldRows = sourceFields.map((field) => ({
      form_id: newForm.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder ?? "",
      required: field.required ?? false,
      options: field.options ?? [],
      order_index: field.order_index,
      settings: field.settings ?? {},
    }));

    const { error: fieldsError } = await supabase.from("form_fields").insert(fieldRows);

    if (fieldsError) {
      await supabase.from("forms").delete().eq("id", newForm.id);
      return NextResponse.json({ error: fieldsError.message }, { status: 500 });
    }
  }

  if (teamSettings) {
    const { error: teamError } = await supabase.from("form_team_settings").insert({
      form_id: newForm.id,
      distribution_mode: teamSettings.distribution_mode,
      team_members: teamSettings.team_members ?? [],
      last_assigned_index: 0,
    });

    if (teamError) {
      console.error("[forms] duplicate team settings failed:", teamError.message);
    }
  }

  return NextResponse.json({ form: newForm }, { status: 201 });
}
