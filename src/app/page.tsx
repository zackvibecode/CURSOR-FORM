import dynamic from "next/dynamic";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { VideoDemo } from "@/components/landing/VideoDemo";
import { HowItWorks } from "@/components/landing/HowItWorks";

const Comparison = dynamic(
  () => import("@/components/landing/Comparison").then((m) => ({ default: m.Comparison })),
  { loading: () => <div className="min-h-[240px] bg-white" aria-hidden /> }
);
const AIFeatures = dynamic(
  () => import("@/components/landing/AIFeatures").then((m) => ({ default: m.AIFeatures })),
  { loading: () => <div className="min-h-[320px] bg-white" aria-hidden /> }
);
const Testimonials = dynamic(
  () => import("@/components/landing/Testimonials").then((m) => ({ default: m.Testimonials })),
  { loading: () => <div className="min-h-[280px] bg-white" aria-hidden /> }
);
const Templates = dynamic(
  () => import("@/components/landing/Templates").then((m) => ({ default: m.Templates })),
  { loading: () => <div className="min-h-[280px] bg-white" aria-hidden /> }
);
const FAQ = dynamic(
  () => import("@/components/landing/FAQ").then((m) => ({ default: m.FAQ })),
  { loading: () => <div className="min-h-[240px] bg-white" aria-hidden /> }
);
const CTASection = dynamic(
  () => import("@/components/landing/CTASection").then((m) => ({ default: m.CTASection })),
  { loading: () => <div className="min-h-[200px]" aria-hidden /> }
);
const Footer = dynamic(
  () => import("@/components/landing/Footer").then((m) => ({ default: m.Footer }))
);
const FloatingWhatsAppButton = dynamic(
  () =>
    import("@/components/ui/FloatingWhatsAppButton").then((m) => ({
      default: m.FloatingWhatsAppButton,
    }))
);

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <VideoDemo />
        <HowItWorks />
        <Comparison />
        <AIFeatures />
        <Testimonials />
        <Templates />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </>
  );
}
