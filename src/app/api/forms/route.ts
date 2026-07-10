import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { getTemplateById } from "@/lib/templates";
import { checkFormLimit } from "@/lib/check-limits";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;

  const { data: forms, error, count } = await supabase
    .from("forms")
    .select("*, submissions(count)", { count: "exact" })
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    forms,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check form creation limit
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

  const body = await request.json();
  const templateId = body.templateId as string | undefined;
  const mode = body.mode as string | undefined;
  const isDirect = mode === "direct";

  let title = isDirect ? "Direct WhatsApp Link" : "Untitled Form";
  let description = "";
  let ctaText = isDirect ? "Chat on WhatsApp" : "Submit on WhatsApp";
  let settings: Record<string, unknown> | undefined = isDirect
    ? { form_mode: "direct", direct_message: "", tiktok_mode: true }
    : undefined;
  let fields: Array<{
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    order_index: number;
  }> = isDirect
    ? []
    : [
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

  if (templateId && !isDirect) {
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

  const baseSlug = slugify(title) || (isDirect ? "direct-link" : "form");
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
      ...(settings ? { settings } : {}),
    })
    .select()
    .single();

  if (formError || !form) {
    return NextResponse.json({ error: formError?.message ?? "Failed to create form" }, { status: 500 });
  }

  if (fields.length === 0) {
    return NextResponse.json({ form }, { status: 201 });
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
