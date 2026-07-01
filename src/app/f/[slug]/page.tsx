import { redirect } from "next/navigation";

/** Legacy /f/slug URLs redirect to /slug */
export default function LegacyFormRedirect({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/${params.slug}`);
}
