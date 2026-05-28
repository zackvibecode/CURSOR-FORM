import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-brand-bg">
      <div className="text-center">
        <span className="text-6xl font-bold text-whatsapp/20">404</span>
        <h1 className="mt-4 text-2xl font-bold text-brand-text">Page not found</h1>
        <p className="mt-2 text-brand-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0DB849]"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
