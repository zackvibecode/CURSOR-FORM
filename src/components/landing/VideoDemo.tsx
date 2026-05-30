import { ScrollReveal } from "@/components/ui/ScrollReveal";

/** https://youtu.be/rrBsU931GhU */
const YOUTUBE_VIDEO_ID = "rrBsU931GhU";
const EMBED_URL = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1`;

export function VideoDemo() {
  return (
    <section id="demo-video" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full bg-whatsapp/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-whatsapp-deep uppercase">
            Demo
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            See OneForm in Action
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Watch how easy it is to create a WhatsApp form and start collecting responses in minutes
          </p>
        </ScrollReveal>

        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-card-lg">
          <div className="relative aspect-video w-full">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={EMBED_URL}
              title="OneForm Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          <a
            href={`https://youtu.be/${YOUTUBE_VIDEO_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-whatsapp-deep hover:underline"
          >
            Watch on YouTube
          </a>
        </p>
      </div>
    </section>
  );
}
