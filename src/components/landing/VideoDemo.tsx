"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function VideoDemo() {
  const [isPlaying, setIsPlaying] = useState(false);

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
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
                  title="OneForm Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
                    <div className="absolute inset-0 opacity-20 max-md:hidden">
                      <div className="absolute top-8 left-8 h-3 w-32 rounded-full bg-whatsapp/40" />
                      <div className="absolute top-16 left-8 h-2 w-48 rounded-full bg-white/20" />
                      <div className="absolute top-24 left-8 h-2 w-40 rounded-full bg-white/10" />
                      <div className="absolute bottom-8 right-8 h-24 w-48 rounded-xl border border-whatsapp/20 bg-whatsapp/5" />
                      <div className="absolute top-8 right-8 h-8 w-8 rounded-full bg-whatsapp/30" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPlaying(true)}
                      className="group relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-whatsapp/30 transition-transform hover:scale-110 hover:bg-[#0DB849] active:scale-95"
                      aria-label="Play demo video"
                    >
                      <Play className="ml-1 h-8 w-8 fill-current" />
                    </button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
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
