import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { getTemplateById } from "@/lib/templates";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: forms, error } = await supabase
    .from("forms")
    .select("*, submissions(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ forms });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const templateId = body.templateId as string | undefined;

  let title = "Untitled Form";
  let description = "";
  let ctaText = "Submit on WhatsApp";
  let fields: Array<{
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    order_index: number;
  }> = [
    {
      type: "title",
      label: "Welcome!",
      required: false,
      order_index: 0,
    },
    {
      type: "text",
      label: "Your name",
      placeholder: "Enter your name",
      required: true,
      order_index: 1,
    },
  ];

  if (templateId) {
    const template = getTemplateById(templateId);
    if (template) {
      title = template.title;
      description = template.description_text;
      ctaText = template.cta_text;
      fields = template.fields.map((f, i) => ({
        type: f.type,
        label: f.label,
        placeholder: f.placeholder,
        required: f.required,
        options: f.options,
        order_index: i,
      }));
    }
  }

  const baseSlug = slugify(title) || "form";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

  const { data: form, error: formError } = await supabase
    .from("forms")
    .insert({
      user_id: user.id,
      title,
      slug,
      description,
      cta_text: ctaText,
      status: "draft",
    })
    .select()
    .single();

  if (formError || !form) {
    return NextResponse.json({ error: formError?.message ?? "Failed to create form" }, { status: 500 });
  }

  const fieldRows = fields.map((f) => ({
    form_id: form.id,
    type: f.type,
    label: f.label,
    placeholder: f.placeholder ?? "",
    required: f.required,
    options: f.options ?? [],
    order_index: f.order_index,
  }));

  const { error: fieldsError } = await supabase.from("form_fields").insert(fieldRows);

  if (fieldsError) {
    await supabase.from("forms").delete().eq("id", form.id);
    return NextResponse.json({ error: fieldsError.message }, { status: 500 });
  }

  return NextResponse.json({ form }, { status: 201 });
}
