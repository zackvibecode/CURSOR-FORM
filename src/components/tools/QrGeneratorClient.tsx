"use client";

import { useState, useMemo } from "react";
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

  const inputClass =
    "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-muted-fg focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20";

  return (
    <section className={containerClass}>
      <div className={inDashboard ? "" : "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"}>
        {!inDashboard && (
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-fg">
              <QrCode className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              QR Code Generator
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-fg">
              Generate QR codes for URLs or WhatsApp links. Customize colors and download in high quality.
            </p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Left: Controls */}
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="rounded-lg border border-border bg-card p-4">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-fg">
                Content type
              </label>
              <div className="flex gap-2">
                {[
                  { id: "url" as Mode, label: "URL", icon: LinkIcon },
                  { id: "whatsapp" as Mode, label: "WhatsApp", icon: MessageSquare },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-md border py-2 text-sm font-medium transition-colors",
                      mode === m.id
                        ? "border-fg/30 bg-muted text-fg"
                        : "border-border text-muted-fg hover:bg-muted/60 hover:text-fg"
                    )}
                  >
                    <m.icon className="h-3.5 w-3.5" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Fields */}
            <div className="rounded-lg border border-border bg-card p-4">
              {mode === "url" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-fg">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className={inputClass}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-fg">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="60123456789 (with country code)"
                      className={cn(inputClass, "font-mono")}
                    />
                    <p className="mt-1 text-[11px] text-muted-fg">Include country code without + sign</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-fg">
                      Pre-filled message (optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Hi, I'm interested in..."
                      rows={3}
                      className={cn(inputClass, "resize-none")}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Customization */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-muted-fg" />
                <label className="text-xs font-medium uppercase tracking-wide text-muted-fg">
                  Customize
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] text-muted-fg">QR color</label>
                  <div className="flex flex-wrap gap-2">
                    {presetColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setFgColor(color.value)}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform",
                          fgColor === color.value
                            ? "border-fg scale-110"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: `#${color.value}` }}
                        aria-label={color.label}
                        title={color.label}
                      >
                        {fgColor === color.value && (
                          <Check className="h-3 w-3 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={`#${fgColor}`}
                      onChange={(e) => setFgColor(e.target.value.replace("#", ""))}
                      className="h-7 w-7 cursor-pointer rounded-full border-2 border-dashed border-border p-0"
                      title="Custom color"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[11px] text-muted-fg">
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
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-fg">
                    <span>128px</span>
                    <span>512px</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview & Download */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-lg border border-border bg-card p-5 text-center">
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                Preview
              </h3>

              <div className="mx-auto mb-4 inline-block rounded-md border border-dashed border-border bg-card p-3">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    width={displaySize}
                    height={displaySize}
                    className="block"
                  />
                ) : (
                  <div
                    className="flex items-center justify-center"
                    style={{ width: displaySize, height: displaySize }}
                  >
                    <QrCode className="h-10 w-10 text-muted-fg/40" />
                  </div>
                )}
              </div>

              <p className="mb-4 truncate font-mono text-[11px] text-muted-fg">{qrValue}</p>

              <button
                onClick={handleDownload}
                disabled={!qrUrl}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
                  downloaded
                    ? "bg-whatsapp text-white"
                    : qrUrl
                      ? "bg-fg text-bg hover:bg-gray-600 dark:hover:bg-gray-200"
                      : "cursor-not-allowed bg-muted text-muted-fg/50"
                )}
              >
                {downloaded ? (
                  <>
                    <Check className="h-4 w-4" />
                    Downloaded
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PNG
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
