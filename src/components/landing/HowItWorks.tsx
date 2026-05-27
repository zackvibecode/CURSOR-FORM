import { Share2, PenLine, Inbox } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const steps = [
  {
    number: "01",
    icon: PenLine,
    title: "Create your form",
    description:
      "Use the drag-and-drop builder to add fields, customize labels, and set your WhatsApp number.",
  },
  {
    number: "02",
    icon: Share2,
    title: "Share your form link",
    description:
      "Publish and share your unique form URL on your website, social media, or QR code.",
  },
  {
    number: "03",
    icon: Inbox,
    title: "Receive submissions directly through WhatsApp and dashboard",
    description:
      "Get instant WhatsApp messages with customer details and track everything in your dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-brand-bg py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <ScrollReveal className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            How ZAQONE.FORM works
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-brand-muted">
            Three simple steps to start collecting leads on WhatsApp
          </p>
        </ScrollReveal>

        <div className="mx-auto flex flex-col items-center justify-center gap-8 sm:flex-row sm:items-start">
          {steps.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 0.1}>
              <div className="mx-auto w-full max-w-[320px] rounded-2xl border border-brand-border bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg sm:w-72">
                <span className="block text-2xl font-bold text-whatsapp/20">
                  {step.number}
                </span>
                <div className="mb-4 mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-whatsapp/10 text-whatsapp">
                  <step.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </div>
                <h3 className="mb-2 text-[17px] font-semibold text-brand-text">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-brand-muted">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
