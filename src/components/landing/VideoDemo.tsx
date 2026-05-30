"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

/** https://youtu.be/rrBsU931GhU */
const YOUTUBE_VIDEO_ID = "rrBsU931GhU";

export function VideoDemo() {
  const [isPlaying, setIsPlaying] = useState(false);

  const embedUrl = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`;
  const thumbnailUrl = `https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`;

  return (
    <section className="bg-white py-20 sm:py-28">
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

        <ScrollReveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-card-lg">
            <div className="relative aspect-video w-full">
              {isPlaying ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={embedUrl}
                  title="OneForm Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <Image
                    src={thumbnailUrl}
                    alt="OneForm demo video thumbnail"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 896px"
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-black/35" />

                  <button
                    type="button"
                    onClick={() => setIsPlaying(true)}
                    className="group absolute inset-0 z-10 flex items-center justify-center"
                    aria-label="Play OneForm demo on YouTube"
                  >
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-whatsapp/30 transition-transform group-hover:scale-110 group-hover:bg-[#0DB849] active:scale-95">
                      <Play className="ml-1 h-8 w-8 fill-current" />
                    </span>
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <p className="text-sm font-medium text-white/90">
                      Create your first WhatsApp form in under 5 minutes
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
