import { X, Check } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const withoutItems = [
  "Asking same questions repeatedly",
  "Customers kept waiting while you are busy",
  "Forms get fake numbers & unreachable emails",
  "No way to collect info before the chat begins",
];

const withItems = [
  "Faster replies and 98% open rate",
  "Get only genuine phone numbers",
  "Personal connection with every customer",
  "Automated data collection on WhatsApp",
];

export function Comparison() {
  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Without vs With <span className="text-whatsapp">OneForm</span>
          </h2>
        </ScrollReveal>

        <div className="grid gap-8 md:grid-cols-2">
          <ScrollReveal>
            <div className="rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-red-500">
                <X className="h-6 w-6" strokeWidth={2.5} />
                Without OneForm
              </h3>
              <ul className="space-y-4">
                {withoutItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-600">
                    <X className="mt-0.5 h-5 w-5 shrink-0 text-red-400" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="rounded-2xl border border-whatsapp/20 bg-white p-8 shadow-sm">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-whatsapp-dark">
                <Check className="h-6 w-6" strokeWidth={2.5} />
                With OneForm
              </h3>
              <ul className="space-y-4">
                {withItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-600">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-whatsapp" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
