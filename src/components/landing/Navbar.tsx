"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Menu, X, ChevronDown, QrCode, LinkIcon, Wrench } from "lucide-react";

const toolsLinks = [
  { label: "QR Code Generator", href: "/tools/qr-generator", icon: QrCode },
  { label: "WhatsApp Link Generator", href: "/tools/link-generator", icon: LinkIcon },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    }
    if (toolsOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [toolsOpen]);

  return (
    <header className="fixed top-4 left-4 right-4 z-50 lg:left-6 lg:right-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-[64px] items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 shadow-sm sm:px-6">
          <BrandLogo priority />

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
            <Link
              href="/pricing"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-whatsapp-deep"
            >
              Pricing
            </Link>
            <a
              href="#templates"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-whatsapp-deep"
            >
              Templates
            </a>

            {/* Tools Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-whatsapp-deep"
                onClick={() => setToolsOpen(!toolsOpen)}
              >
                Tools
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${toolsOpen ? "rotate-180" : ""}`} />
              </button>
              {toolsOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                  {toolsLinks.map((tool) => (
                    <Link
                      key={tool.label}
                      href={tool.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-600 transition-colors hover:bg-whatsapp/5 hover:text-whatsapp-deep"
                      onClick={() => setToolsOpen(false)}
                    >
                      <tool.icon className="h-4 w-4 shrink-0 text-gray-400" />
                      {tool.label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-gray-100" />
                  <Link
                    href="/tools"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-whatsapp transition-colors hover:bg-whatsapp/5"
                    onClick={() => setToolsOpen(false)}
                  >
                    <Wrench className="h-4 w-4 shrink-0" />
                    All Free Tools
                  </Link>
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
          <div className="mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-lg md:hidden">
            <nav className="flex flex-col gap-1">
              <a href="#how-it-works" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                How it works
              </a>
              <a href="#features" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Features
              </a>
              <Link href="/pricing" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Pricing
              </Link>
              <a href="#templates" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Templates
              </a>
              <Link href="/demo" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Try Demo
              </Link>
              <div className="my-2 border-t border-gray-100" />
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Free Tools</p>
              {toolsLinks.map((tool) => (
                <Link
                  key={tool.label}
                  href={tool.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <tool.icon className="h-4 w-4 text-gray-400" />
                  {tool.label}
                </Link>
              ))}
              <Link href="/tools" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-whatsapp hover:bg-whatsapp/5">
                <Wrench className="h-4 w-4" />
                All Free Tools
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
