import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublishedFormBySlug } from "@/lib/public-form";
import { mapDbFieldToFormField } from "@/lib/forms";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { PublicFormClient } from "@/components/form/PublicFormClient";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getPublishedFormBySlug(params.slug);
  if (!data) {
    return { title: "Form not found" };
  }

  return {
    title: data.form.title,
    description: data.form.description || `Fill out ${data.form.title}`,
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
      {data.pixelId && (
        <>
          <script
            id="meta-pixel-base"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${data.pixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${data.pixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
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
