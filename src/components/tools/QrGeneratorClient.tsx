"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Download,
  QrCode,
  LinkIcon,
  MessageSquare,
  Palette,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const presetColors = [
  { label: "Black", value: "000000" },
  { label: "WhatsApp Green", value: "10D050" },
  { label: "Blue", value: "2563EB" },
  { label: "Purple", value: "7C3AED" },
  { label: "Red", value: "DC2626" },
  { label: "Orange", value: "EA580C" },
];

type Mode = "url" | "whatsapp";

interface QrGeneratorClientProps {
  inDashboard?: boolean;
}

export function QrGeneratorClient({ inDashboard = false }: QrGeneratorClientProps) {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("https://oneform.app");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [fgColor, setFgColor] = useState("000000");
  const [bgColor] = useState("ffffff");
  const [size, setSize] = useState(256);
  const [downloaded, setDownloaded] = useState(false);

  const qrValue =
    mode === "url"
      ? url || "https://"
      : `https://wa.me/${phone.replace(/[^0-9]/g, "")}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

  const displaySize = Math.min(size, 256);

  const qrUrl = useMemo(() => {
    if (!qrValue || qrValue === "https://") return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=${displaySize}x${displaySize}&data=${encodeURIComponent(qrValue)}&color=${fgColor}&bgcolor=${bgColor}`;
  }, [qrValue, fgColor, bgColor, displaySize]);

  async function handleDownload() {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const pngUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "oneform-qr-code.png";
      link.href = pngUrl;
      link.click();
      URL.revokeObjectURL(pngUrl);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch {
      window.open(qrUrl, "_blank");
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    }
  }

  const containerClass = inDashboard ? "" : "py-12 sm:py-20";

  return (
    <section className={containerClass}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {!inDashboard && (
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
              <QrCode className="h-7 w-7 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              QR Code Generator
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-gray-500">
              Generate QR codes for URLs or WhatsApp links. Customize colors and download in high quality.
            </p>
          </motion.div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left: Controls */}
          <motion.div
            className="space-y-6"
            initial={inDashboard ? false : { opacity: 0, x: -20 }}
            animate={inDashboard ? {} : { opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Mode Toggle */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="mb-3 block text-sm font-semibold text-gray-900">Content Type</label>
              <div className="flex gap-2">
                {[
                  { id: "url" as Mode, label: "URL", icon: LinkIcon },
                  { id: "whatsapp" as Mode, label: "WhatsApp", icon: MessageSquare },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all",
                      mode === m.id
                        ? "border-whatsapp bg-whatsapp/5 text-whatsapp-deep"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <m.icon className="h-4 w-4" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Fields */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {mode === "url" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">Website URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="60123456789 (with country code)"
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20"
                    />
                    <p className="mt-1 text-xs text-gray-400">Include country code without + sign</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">Pre-filled Message (optional)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Hi, I'm interested in..."
                      rows={3}
                      className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Customization */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Palette className="h-4 w-4 text-gray-400" />
                <label className="text-sm font-semibold text-gray-900">Customize</label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">QR Color</label>
                  <div className="flex flex-wrap gap-2">
                    {presetColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setFgColor(color.value)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                          fgColor === color.value ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: `#${color.value}` }}
                        aria-label={color.label}
                        title={color.label}
                      >
                        {fgColor === color.value && <Check className="h-3 w-3 text-white drop-shadow-md" />}
                      </button>
                    ))}
                    <div className="relative">
                      <input
                        type="color"
                        value={`#${fgColor}`}
                        onChange={(e) => setFgColor(e.target.value.replace("#", ""))}
                        className="h-8 w-8 cursor-pointer rounded-full border-2 border-dashed border-gray-300 p-0"
                        title="Custom color"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-500">
                    Size: {size}px
                  </label>
                  <input
                    type="range"
                    min={128}
                    max={512}
                    step={32}
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full accent-whatsapp"
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>128px</span>
                    <span>512px</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Preview & Download */}
          <motion.div
            className="lg:sticky lg:top-28 lg:self-start"
            initial={inDashboard ? false : { opacity: 0, x: 20 }}
            animate={inDashboard ? {} : { opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card text-center">
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-wide text-gray-400">Preview</h3>

              <div className="mx-auto mb-6 inline-block rounded-xl border-2 border-dashed border-gray-200 p-4 bg-white">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    width={displaySize}
                    height={displaySize}
                    className="block"
                  />
                ) : (
                  <div className="flex items-center justify-center" style={{ width: displaySize, height: displaySize }}>
                    <QrCode className="h-12 w-12 text-gray-300" />
                  </div>
                )}
              </div>

              <p className="mb-6 truncate text-xs text-gray-400">{qrValue}</p>

              <button
                onClick={handleDownload}
                disabled={!qrUrl}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98]",
                  downloaded
                    ? "bg-green-500 text-white"
                    : qrUrl
                      ? "bg-whatsapp text-white shadow-md hover:bg-[#0DB849] hover:shadow-lg"
                      : "cursor-not-allowed bg-gray-100 text-gray-400"
                )}
              >
                {downloaded ? (
                  <>
                    <Check className="h-4 w-4" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PNG
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}