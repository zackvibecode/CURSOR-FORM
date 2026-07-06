import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedFormBySlug } from "@/lib/public-form";
import { mapDbFieldToFormField } from "@/lib/forms";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { PublicFormClient } from "@/components/form/PublicFormClient";

export const revalidate = 60;

export default async function PublicFormPage({
  params,
}: {
  params: { slug: string };
}) {
  if (isReservedSlug(params.slug)) {
    notFound();
  }

  const data = await getPublishedFormBySlug(params.slug);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-2xl font-bold text-fg">Form not found</h1>
          <p className="mb-6 text-muted-fg">
            This form may have been removed or is not published yet.
          </p>
          <Link href="/" className="font-semibold text-whatsapp-deep hover:underline">
            Create your own OneForm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PublicFormClient
      form={data.form}
      fields={data.fields.map(mapDbFieldToFormField)}
      pixelId={data.pixelId}
      usesTeamRouting={data.usesTeamRouting}
      teamRoutingSnapshot={data.teamRoutingSnapshot}
    />
  );
}
