"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plane, MessageSquare, Star, Utensils, ShoppingBag, Calendar } from "lucide-react";

const templates = [
  {
    id: "travel",
    icon: Plane,
    title: "Travel Booking",
    description: "Use this simple form to get travel requirements from your customer",
    color: "bg-sky-50 text-sky-600",
    borderColor: "border-sky-100",
  },
  {
    id: "contact",
    icon: MessageSquare,
    title: "Contact Form",
    description: "Get general inquiries from anyone using this classic contact form",
    color: "bg-purple-50 text-purple-600",
    borderColor: "border-purple-100",
  },
  {
    id: "feedback",
    icon: Star,
    title: "Customer Feedback",
    description: "Collect feedbacks from your customers about their experience",
    color: "bg-amber-50 text-amber-600",
    borderColor: "border-amber-100",
  },
  {
    id: "restaurant",
    icon: Utensils,
    title: "Restaurant Order",
    description: "Connect with customers who want to order their favourite meals",
    color: "bg-rose-50 text-rose-600",
    borderColor: "border-rose-100",
  },
  {
    id: "store",
    icon: ShoppingBag,
    title: "Store Order",
    description: "Use this form to help customers buy clothes and accessories online",
    color: "bg-teal-50 text-teal-600",
    borderColor: "border-teal-100",
  },
  {
    id: "event",
    icon: Calendar,
    title: "Event Registration",
    description: "Make registrations for events easier to manage and track using this form",
    color: "bg-indigo-50 text-indigo-600",
    borderColor: "border-indigo-100",
  },
];

export function Templates() {
  return (
    <section id="templates" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Choose from our ready to use templates
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-500">
            Create your form in a single-click from our curated templates
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${template.color}`}
              >
                <template.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {template.title}
              </h3>
              <p className="mb-6 flex-1 text-sm text-gray-500 leading-relaxed">
                {template.description}
              </p>
              <div className="flex gap-2">
                <Link href={`/signup?template=${template.id}`} className="flex-1">
                  <button className="w-full rounded-xl bg-whatsapp py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#20bd5a] active:scale-[0.98]">
                    Create {template.title.split(" ")[0]} Form
                  </button>
                </Link>
                <Link href={`/demo?template=${template.id}`}>
                  <button className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.98]">
                    Demo
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
