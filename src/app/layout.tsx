import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";

const geistSans = GeistSans;
const geistMono = GeistMono;

// Anti-FOUC: apply theme class before hydration
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('oneform-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export const metadata: Metadata = {
  title: "OneForm — Smart WhatsApp Form Builder",
  description:
    "OneForm helps businesses collect enquiries, bookings, customer details, and sales leads through beautiful online forms connected directly to WhatsApp.",
  keywords: [
    "WhatsApp form",
    "form builder",
    "lead capture",
    "OneForm",
    "oneform.app",
  ],
  icons: {
    icon: [
      { url: "/favicon-icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: ["/favicon-icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
