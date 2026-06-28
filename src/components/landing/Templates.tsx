import Link from "next/link";
import { Plane, MessageSquare, Star, Utensils, ShoppingBag, Calendar } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const templates = [
  {
    id: "travel",
    icon: Plane,
    title: "Travel Booking",
    description: "Use this simple form to get travel requirements from your customer",
    color: "bg-sky-50 text-sky-600",
  },
  {
    id: "contact",
    icon: MessageSquare,
    title: "Contact Form",
    description: "Get general inquiries from anyone using this classic contact form",
    color: "bg-purple-50 text-purple-600",
  },
  {
    id: "feedback",
    icon: Star,
    title: "Customer Feedback",
    description: "Collect feedbacks from your customers about their experience",
    color: "bg-amber-50 text-amber-600",
  },
  {
    id: "restaurant",
    icon: Utensils,
    title: "Restaurant Order",
    description: "Connect with customers who want to order their favourite meals",
    color: "bg-rose-50 text-rose-600",
  },
  {
    id: "store",
    icon: ShoppingBag,
    title: "Store Order",
    description: "Use this form to help customers buy clothes and accessories online",
    color: "bg-teal-50 text-teal-600",
  },
  {
    id: "event",
    icon: Calendar,
    title: "Event Registration",
    description: "Make registrations for events easier to manage and track using this form",
    color: "bg-indigo-50 text-indigo-600",
  },
];

export function Templates() {
  return (
    <section id="templates" className="bg-gradient-mint py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Choose from our ready to use templates
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-500">
            Create your form in a single-click from our curated templates
          </p>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
            <ScrollReveal key={template.id} delay={Math.min(index * 0.06, 0.24)}>
              <div className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-whatsapp/30 hover:shadow-card-lg md:hover:-translate-y-1">
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${template.color}`}
                >
                  <template.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{template.title}</h3>
                <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-500">
                  {template.description}
                </p>
                <div className="flex gap-2">
                  <Link href={`/signup?template=${template.id}`} className="flex-1">
                    <button
                      type="button"
                      className="w-full rounded-xl bg-whatsapp py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0DB849] active:scale-[0.98]"
                    >
                      Create {template.title.split(" ")[0]} Form
                    </button>
                  </Link>
                  <Link href={`/demo?template=${template.id}`}>
                    <button
                      type="button"
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-whatsapp/30 hover:bg-whatsapp/5 active:scale-[0.98]"
                    >
                      Demo
                    </button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
