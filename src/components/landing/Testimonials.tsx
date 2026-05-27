import { Card } from "@/components/ui/Card";

const testimonials = [
  {
    quote:
      "WhatsLead made it effortless to connect our forms with WhatsApp. Setup was quick and results have been fantastic.",
    name: "Sarah Lim",
    role: "Business Consultant",
  },
  {
    quote:
      "Amazing for generating and managing leads via WhatsApp. Intuitive, fast, and essential for our workflow.",
    name: "Ahmad Razak",
    role: "Marketing Manager",
  },
  {
    quote:
      "Very easy to use. Our team adopted it immediately and customer response rates improved significantly.",
    name: "Priya Nair",
    role: "CX Lead",
  },
  {
    quote:
      "Simple, effective solution for collecting leads through WhatsApp. We had forms running within minutes.",
    name: "David Tan",
    role: "Business Owner",
  },
];

export function Testimonials() {
  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Trusted by businesses worldwide
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {testimonials.map((item) => (
            <Card key={item.name}>
              <p className="mb-6 text-gray-700">&ldquo;{item.quote}&rdquo;</p>
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-sm text-gray-500">{item.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
