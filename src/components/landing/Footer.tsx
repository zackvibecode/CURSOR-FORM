import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function Footer() {
  return (
    <footer className="border-t border-brand-border bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <BrandLogo showDomain />
          <nav className="flex flex-wrap gap-6 text-sm text-brand-muted">
            <Link href="/demo" className="transition-colors hover:text-whatsapp-deep">
              Demo
            </Link>
            <Link href="/signup" className="transition-colors hover:text-whatsapp-deep">
              Get Started
            </Link>
            <Link href="/login" className="transition-colors hover:text-whatsapp-deep">
              Login
            </Link>
            <a
              href="https://Zaq1.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-whatsapp-deep"
            >
              Zaq1.com
            </a>
          </nav>
        </div>
        <div className="mt-8 border-t border-brand-border pt-8 text-center text-sm text-brand-muted">
          <p>&copy; {new Date().getFullYear()} ZAQONE.FORM. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
