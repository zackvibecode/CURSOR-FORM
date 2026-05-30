import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Pricing } from "@/components/landing/Pricing";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Pricing — OneForm",
  description:
    "Simple, transparent pricing for OneForm. Start free and upgrade as you grow. WhatsApp form builder plans for every business size.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        <Pricing />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
