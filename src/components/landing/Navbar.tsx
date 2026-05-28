"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Menu, X, ChevronDown } from "lucide-react";

const navLinks = [
  { label: "Try Demo", href: "/demo" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <header className="fixed top-4 left-4 right-4 z-50 lg:left-6 lg:right-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-[64px] items-center justify-between rounded-2xl border border-gray-200/80 bg-white/80 px-4 shadow-sm backdrop-blur-xl sm:px-6">
          <BrandLogo showDomain />

          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="#how-it-works"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-whatsapp-deep"
            >
              How it works
            </a>
            <a
              href="#features"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-whatsapp-deep"
            >
              Features
            </a>
            <a
              href="#templates"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-whatsapp-deep"
            >
              Templates
            </a>

            {/* Tools Dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-whatsapp-deep"
                onClick={() => setToolsOpen(!toolsOpen)}
              >
                Tools
                <ChevronDown className={`h-4 w-4 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
              </button>
              {toolsOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                  {[
                    "Message Formatter",
                    "QR Code Generator",
                    "Link Generator",
                    "vCard Generator",
                  ].map((tool) => (
                    <button
                      key={tool}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-whatsapp-deep"
                      onClick={() => setToolsOpen(false)}
                    >
                      {tool}
                    </button>
                  ))}
                  <div className="my-1 border-t border-gray-100" />
                  <button className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-whatsapp transition-colors hover:bg-whatsapp/5">
                    All Free Tools
                  </button>
                </div>
              )}
            </div>

            <div className="ml-2 h-6 w-px bg-gray-200" />

            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-whatsapp-deep"
            >
              Login
            </Link>
            <Link href="/signup">
              <button className="ml-2 inline-flex items-center gap-1.5 rounded-xl bg-whatsapp px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0DB849] hover:shadow-md">
                Create a free form
              </button>
            </Link>
          </nav>

          <button
            className="rounded-lg p-2 transition-colors hover:bg-gray-50 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="mt-2 rounded-2xl border border-gray-200/80 bg-white/95 px-4 py-4 shadow-lg backdrop-blur-xl md:hidden">
            <nav className="flex flex-col gap-1">
              <a href="#how-it-works" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                How it works
              </a>
              <a href="#features" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Features
              </a>
              <a href="#templates" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Templates
              </a>
              <Link href="/demo" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Try Demo
              </Link>
              <div className="my-2 border-t border-gray-100" />
              <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Login
              </Link>
              <Link href="/signup" onClick={() => setOpen(false)}>
                <button className="mt-2 w-full rounded-xl bg-whatsapp py-2.5 text-sm font-semibold text-white shadow-sm">
                  Create a free form
                </button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
