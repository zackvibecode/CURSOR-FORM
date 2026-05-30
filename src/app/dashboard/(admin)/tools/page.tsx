"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { QrCode, LinkIcon, ArrowRight } from "lucide-react";

const tools = [
  {
    title: "QR Code Generator",
    description: "Generate QR codes for URLs or WhatsApp links. Customize colors and download as PNG.",
    href: "/dashboard/tools/qr-generator",
    icon: QrCode,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100 hover:border-blue-200",
  },
  {
    title: "WhatsApp Link Generator",
    description: "Create wa.me links with pre-filled messages for instant WhatsApp chats.",
    href: "/dashboard/tools/link-generator",
    icon: LinkIcon,
    color: "bg-whatsapp/10 text-whatsapp-deep",
    border: "border-whatsapp/20 hover:border-whatsapp/40",
  },
];

export default function DashboardToolsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-brand-text">Free Tools</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Helpful tools available on your plan — generate QR codes and WhatsApp links.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Link
              href={tool.href}
              className={`group block rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md ${tool.border}`}
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${tool.color}`}
              >
                <tool.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{tool.description}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-whatsapp-deep">
                Open tool
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-500">More tools coming soon.</p>
      </div>
    </div>
  );
}