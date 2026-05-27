import {
  LayoutDashboard,
  Link2,
  MessageSquare,
  Smartphone,
  PenLine,
  Zap,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const features = [
  {
    icon: MessageSquare,
    title: "WhatsApp Lead Collection",
    description:
      "Every submission opens WhatsApp with a pre-filled message — ready for you to reply instantly.",
  },
  {
    icon: PenLine,
    title: "Custom Form Builder",
    description:
      "Build professional forms with text, phone, email, dropdown, date, and message fields.",
  },
  {
    icon: LayoutDashboard,
    title: "Admin Dashboard",
    description:
      "Manage forms, track submissions, and monitor performance from one clean dashboard.",
  },
  {
    icon: Zap,
    title: "Real-Time Submissions",
    description:
      "Receive leads the moment customers submit — no delays, no missed opportunities.",
  },
  {
    icon: Smartphone,
    title: "Mobile Responsive",
    description:
      "Forms look premium on every device — desktop, tablet, and mobile.",
  },
  {
    icon: Link2,
    title: "Easy Share Link",
    description:
      "Share your form anywhere — website, social media, QR code, or direct message.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            Everything you need to capture WhatsApp leads
          </h2>
          <p className="mx-auto max-w-2xl text-brand-muted">
            A premium form builder designed for agencies, travel companies, service providers,
            and sales teams.
          </p>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <ScrollReveal key={feature.title} delay={index * 0.08}>
              <div className="group h-full rounded-2xl border border-brand-border bg-white p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-whatsapp/10 text-whatsapp transition-colors group-hover:bg-whatsapp group-hover:text-white">
                  <feature.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-brand-text">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-brand-muted">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
