import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Comparison } from "@/components/landing/Comparison";
import { AIFeatures } from "@/components/landing/AIFeatures";
import { Testimonials } from "@/components/landing/Testimonials";
import { Templates } from "@/components/landing/Templates";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { FloatingWhatsAppButton } from "@/components/ui/FloatingWhatsAppButton";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Comparison />
        <AIFeatures />
        <Testimonials />
        <Templates />
        <FAQ />
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </>
  );
}
