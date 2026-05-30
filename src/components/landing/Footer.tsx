"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Twitter, Linkedin, Github, Mail } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Templates", href: "#templates" },
    { label: "Pricing", href: "/pricing" },
    { label: "Demo", href: "/demo" },
  ],
  tools: [
    { label: "QR Code Generator", href: "/tools/qr-generator" },
    { label: "WhatsApp Link Generator", href: "/tools/link-generator" },
    { label: "All Free Tools", href: "/tools" },
  ],
  support: [
    { label: "FAQ", href: "#faq" },
    { label: "Contact Us", href: "mailto:contact@oneform.app" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <BrandLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
              The smartest way to collect form responses directly on WhatsApp. Create beautiful forms in minutes, no coding required.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Github, href: "#", label: "GitHub" },
                { icon: Mail, href: "mailto:contact@oneform.app", label: "Email" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-whatsapp/30 hover:bg-whatsapp/5 hover:text-whatsapp"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-whatsapp-deep"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Free Tools</h3>
            <ul className="space-y-3">
              {footerLinks.tools.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 transition-colors hover:text-whatsapp-deep"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("mailto:") ? (
                    <a
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-whatsapp-deep"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-whatsapp-deep"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-100 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} OneForm. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
