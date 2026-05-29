import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
});

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
      { url: "/favicon.png", type: "image/png", sizes: "1024x769" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: ["/favicon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans`}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
