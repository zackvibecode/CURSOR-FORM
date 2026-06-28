"use client";

import Link from "next/link";
import { QrCode, LinkIcon, ArrowRight } from "lucide-react";

const tools = [
  {
    title: "QR Code Generator",
    description:
      "Generate QR codes for URLs or WhatsApp links. Customize colors and download as PNG.",
    href: "/dashboard/tools/qr-generator",
    icon: QrCode,
  },
  {
    title: "WhatsApp Link Generator",
    description: "Create wa.me links with pre-filled messages for instant WhatsApp chats.",
    href: "/dashboard/tools/link-generator",
    icon: LinkIcon,
  },
];

export default function DashboardToolsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-fg">Tools</h2>
        <p className="mt-0.5 text-sm text-muted-fg">
          Helpful tools available on your plan — generate QR codes and WhatsApp links.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-fg/30 hover:bg-muted"
          >
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-fg">
              <tool.icon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-fg">{tool.title}</h3>
            <p className="mt-1 text-xs text-muted-fg">{tool.description}</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-fg transition-colors group-hover:text-fg">
              Open tool
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
        <p className="text-xs text-muted-fg">More tools coming soon.</p>
      </div>
    </div>
  );
}
