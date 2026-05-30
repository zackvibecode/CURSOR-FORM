import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Free Tools — OneForm",
  description:
    "Free WhatsApp tools: QR Code Generator, Link Generator, and more. Boost your WhatsApp marketing with OneForm's free toolkit.",
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24">{children}</main>
      <Footer />
    </>
  );
}
