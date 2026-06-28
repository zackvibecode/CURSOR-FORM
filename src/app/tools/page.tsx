"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { QrCode, LinkIcon, ArrowRight } from "lucide-react";

const tools = [
  {
    title: "QR Code Generator",
    description:
      "Generate QR codes for any URL or WhatsApp link. Customize colors and download in high quality. Perfect for print materials, business cards, and marketing.",
    href: "/tools/qr-generator",
    icon: QrCode,
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    title: "WhatsApp Link Generator",
    description:
      "Create wa.me links with pre-filled messages. Share on websites, social media, or emails to let customers start a WhatsApp chat instantly.",
    href: "/tools/link-generator",
    icon: LinkIcon,
    color: "bg-whatsapp",
    bgColor: "bg-whatsapp/10",
    textColor: "text-whatsapp-deep",
  },
];

export default function ToolsPage() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="mb-3 inline-block rounded-full bg-whatsapp/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-whatsapp-deep uppercase">
            Free Tools
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Free WhatsApp Tools
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-fg">
            Boost your WhatsApp marketing with our collection of free tools. No signup required.
          </p>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link href={tool.href} className="group block h-full">
                <div className="flex h-full flex-col rounded-lg border border-border bg-card p-8 shadow-sm transition-all hover:border-fg/30 hover:shadow-md dark:shadow-none">
                  <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl ${tool.bgColor}`}>
                    <tool.icon className={`h-7 w-7 ${tool.textColor}`} />
                  </div>
                  <h2 className="mb-3 text-xl font-bold text-fg group-hover:text-whatsapp-deep dark:group-hover:text-whatsapp">
                    {tool.title}
                  </h2>
                  <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-fg">
                    {tool.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-whatsapp transition-colors group-hover:gap-3">
                    Open Tool
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* More tools coming */}
        <motion.div
          className="mt-12 rounded-lg border border-dashed border-border p-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-sm font-medium text-muted-fg">
            More tools coming soon — Message Formatter, vCard Generator, Chat Button Generator & more
          </p>
        </motion.div>
      </div>
    </section>
  );
}
