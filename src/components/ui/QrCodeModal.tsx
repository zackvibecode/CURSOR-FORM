"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Download, Check, QrCode, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { QR_PRESET_COLORS, buildQrImageUrl, downloadQrImage, toPublicQrUrl } from "@/lib/qr";

const PREVIEW_MAX = 256;
const COMMIT_DELAY = 300;

interface QrCodeModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  subtitle?: string;
}

export function QrCodeModal({
  open,
  onClose,
  url,
  title = "QR Code",
  subtitle,
}: QrCodeModalProps) {
  const [fgColor, setFgColor] = useState("000000");
  const [size, setSize] = useState(PREVIEW_MAX);
  const [committed, setCommitted] = useState({ fgColor: "000000", size: PREVIEW_MAX });
  const [downloaded, setDownloaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  // Resolve against the runtime origin so the code never encodes a relative
  // path or a localhost placeholder when NEXT_PUBLIC_APP_URL is unset.
  const [targetUrl, setTargetUrl] = useState(() => toPublicQrUrl(url));

  // Only hit the QR service once the user stops dragging the color/size controls.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setCommitted({ fgColor, size }), COMMIT_DELAY);
    return () => clearTimeout(timer);
  }, [open, fgColor, size]);

  useEffect(() => {
    if (!open) {
      setImageFailed(false);
      return;
    }
    setTargetUrl(toPublicQrUrl(url));
    setFgColor("000000");
    setSize(PREVIEW_MAX);
    setCommitted({ fgColor: "000000", size: PREVIEW_MAX });
    setDownloaded(false);
    setImageFailed(false);
  }, [open, url]);

  const qrUrl = useMemo(
    () => buildQrImageUrl({ data: targetUrl, size: committed.size, fgColor: committed.fgColor }),
    [targetUrl, committed]
  );

  useEffect(() => {
    setImageFailed(false);
  }, [qrUrl]);

  const previewSize = Math.min(Math.max(size, 128), PREVIEW_MAX);

  async function handleDownload() {
    if (!qrUrl) return;
    try {
      await downloadQrImage(qrUrl, subtitle || title || "qr-code");
    } catch {
      window.open(qrUrl, "_blank", "noopener,noreferrer");
    }
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-5">
        <div className="flex flex-col items-center">
          <div className="rounded-lg border border-border bg-white p-3">
            {qrUrl && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="QR code"
                width={size}
                height={size}
                style={{ width: size, height: "auto", maxWidth: "100%" }}
                className="block"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 text-center"
                style={{ width: previewSize, height: previewSize }}
              >
                {imageFailed ? (
                  <>
                    <TriangleAlert className="h-6 w-6 text-amber-500" />
                    <p className="px-3 text-[11px] text-muted-fg">
                      QR service unavailable right now.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open(qrUrl, "_blank", "noopener,noreferrer")}
                      className="text-[11px] font-medium text-whatsapp-deep underline dark:text-whatsapp"
                    >
                      Open image
                    </button>
                  </>
                ) : (
                  <QrCode className="h-10 w-10 text-muted-fg/40" />
                )}
              </div>
            )}
          </div>
          <p className="mt-3 w-full truncate text-center font-mono text-[11px] text-muted-fg">
            {targetUrl || "No URL available"}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-muted-fg">
              Color
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {QR_PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFgColor(color.value)}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform",
                    fgColor === color.value
                      ? "scale-110 border-fg"
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
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-muted-fg">
              Size: {size}px
            </label>
            <input
              type="range"
              min={128}
              max={512}
              step={64}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-whatsapp"
            />
            <p className="mt-1 text-[11px] text-muted-fg">
              The downloaded PNG is saved at {size}px.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleDownload()}
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
    </Modal>
  );
}
