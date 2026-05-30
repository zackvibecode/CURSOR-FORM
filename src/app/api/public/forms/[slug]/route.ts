import { NextResponse } from "next/server";
import { getPublishedFormBySlug } from "@/lib/public-form";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const data = await getPublishedFormBySlug(params.slug);

  if (!data) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  return NextResponse.json({ form: data.form, fields: data.fields });
}
