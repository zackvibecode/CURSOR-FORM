import { X, Check } from "lucide-react";

const withoutItems = [
  "Asking same questions repeatedly",
  "Customers kept waiting while you are busy",
  "Forms get fake numbers & unreachable emails",
  "No way to collect info before chat begins",
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
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Without vs With WhatsLead</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-red-100 bg-white p-8">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-brand-red">
              <X className="h-6 w-6" />
              Without WhatsLead
            </h3>
            <ul className="space-y-4">
              {withoutItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-600">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-whatsapp/20 bg-white p-8">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-whatsapp-dark">
              <Check className="h-6 w-6" />
              With WhatsLead
            </h3>
            <ul className="space-y-4">
              {withItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-600">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-whatsapp" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
