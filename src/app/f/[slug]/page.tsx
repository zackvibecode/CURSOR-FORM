import { PublicFormClient } from "@/components/form/PublicFormClient";

export default function PublicFormPage({
  params,
}: {
  params: { slug: string };
}) {
  return <PublicFormClient slug={params.slug} />;
}
