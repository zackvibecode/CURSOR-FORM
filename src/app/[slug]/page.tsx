import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublishedFormBySlug } from "@/lib/public-form";
import { mapDbFieldToFormField } from "@/lib/forms";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { PublicFormClient } from "@/components/form/PublicFormClient";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { MetaViewContent } from "@/components/analytics/MetaViewContent";
import { getFormSeoFromForm, isDirectLinkForm } from "@/lib/form-settings";
import { getAppUrl } from "@/lib/auth/urls";

export const revalidate = 60;

const OG_SIZE = 1000;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getPublishedFormBySlug(params.slug);
  if (!data) {
    return { title: "Form not found", robots: { index: false, follow: false } };
  }

  const appUrl = getAppUrl();
  const seo = getFormSeoFromForm(data.form);
  const title = seo.seo_og_title || seo.seo_title || data.form.title;
  const description =
    seo.seo_og_description ||
    seo.seo_description ||
    data.form.description ||
    `Fill out ${data.form.title}`;
  const pageUrl = seo.canonical_url || `${appUrl}/${data.form.slug}`;
  const bust = Date.parse(data.form.updated_at) || Date.now();
  const imageUrl = seo.seo_og_image
    ? `${appUrl}/api/og/f/${data.form.slug}?v=${bust}`
    : `${appUrl}/favicon-icon.png`;

  return {
    metadataBase: new URL(appUrl),
    title,
    description,
    alternates: { canonical: pageUrl },
    robots: seo.seo_indexing === "noindex"
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "OneForm",
      type: "website",
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: OG_SIZE,
          height: OG_SIZE,
          alt: title,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

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
    <>
      {data.pixelId ? (
        <>
          <MetaPixel pixelId={data.pixelId} />
          <MetaViewContent
            contentKey={data.form.id}
            contentName={data.form.title}
            contentCategory={isDirectLinkForm(data.form) ? "whatsapp_direct_link" : "lead_form"}
            contentIds={[data.form.id]}
          />
        </>
      ) : null}
      <PublicFormClient
        form={data.form}
        fields={data.fields.map(mapDbFieldToFormField)}
        pixelId={data.pixelId}
        usesTeamRouting={data.usesTeamRouting}
        teamRoutingSnapshot={data.teamRoutingSnapshot}
      />
    </>
  );
}
