"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";

/** https://youtu.be/rrBsU931GhU */
const YOUTUBE_VIDEO_ID = "rrBsU931GhU";
const EMBED_URL = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`;
const THUMB_URL = `https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`;

export function VideoDemo() {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="demo-video" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full bg-whatsapp/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-whatsapp-dark uppercase">
            Demo
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            See OneForm in Action
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Watch how easy it is to create a WhatsApp form and start collecting responses in minutes
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-card-lg">
          <div className="relative aspect-video w-full min-h-[280px] sm:min-h-[360px] lg:min-h-[420px]">
            {playing ? (
              <iframe
                className="absolute inset-0 h-full w-full border-0"
                src={EMBED_URL}
                title="OneForm Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="group absolute inset-0 flex h-full w-full items-center justify-center"
                aria-label="Play OneForm demo video"
              >
                <Image
                  src={THUMB_URL}
                  alt="OneForm demo video thumbnail"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 896px"
                  loading="lazy"
                />
                <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-whatsapp-dark text-white shadow-lg transition-transform group-hover:scale-105 sm:h-20 sm:w-20">
                  <Play className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" aria-hidden />
                </span>
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          <a
            href={`https://youtu.be/${YOUTUBE_VIDEO_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-whatsapp-dark hover:underline"
          >
            Watch on YouTube
          </a>
        </p>
      </div>
    </section>
  );
}
