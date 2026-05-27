"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-border/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
        <BrandLogo showDomain />

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-brand-muted transition-colors hover:text-whatsapp-deep"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-brand-muted transition-colors hover:text-whatsapp-deep"
          >
            How it works
          </a>
          <Link
            href="/login"
            className="text-sm font-medium text-brand-muted transition-colors hover:text-whatsapp-deep"
          >
            Login
          </Link>
          <Link href="/signup">
            <Button size="sm" variant="whatsapp" showWhatsAppIcon>
              Create Your Form
            </Button>
          </Link>
        </nav>

        <button
          className="rounded-lg p-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-brand-border bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <a href="#features" onClick={() => setOpen(false)} className="font-medium">
              Features
            </a>
            <a href="#how-it-works" onClick={() => setOpen(false)} className="font-medium">
              How it works
            </a>
            <Link href="/demo" onClick={() => setOpen(false)} className="font-medium">
              View Demo
            </Link>
            <Link href="/login" onClick={() => setOpen(false)} className="font-medium">
              Login
            </Link>
            <Link href="/signup" onClick={() => setOpen(false)}>
              <Button className="w-full" variant="whatsapp" showWhatsAppIcon>
                Create Your Form
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
