"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "OneForm made it effortless to connect our forms with WhatsApp. The setup was quick and the results have been fantastic for our team.",
    name: "J Gustaf Carlsen",
    role: "Business Consultant",
    initials: "JG",
    bg: "bg-blue-500",
  },
  {
    quote:
      "OneForm has been amazing for generating and managing leads via WhatsApp. It's intuitive, fast, and has become an essential part of our workflow.",
    name: "Joti Duli",
    role: "Web in Development House",
    initials: "JD",
    bg: "bg-green-500",
  },
  {
    quote:
      "Very easy to use, and the support team is incredibly responsive. OneForm helped us streamline our customer interactions.",
    name: "Vince Ng",
    role: "CXassist",
    initials: "VN",
    bg: "bg-purple-500",
  },
  {
    quote:
      "OneForm solved our problem of collecting leads through WhatsApp. It's simple, effective, and our team adopted it immediately.",
    name: "Asit Patel",
    role: "AMPSolar Technology",
    initials: "AP",
    bg: "bg-orange-500",
  },
  {
    quote:
      "Setting up OneForm was incredibly easy. We had our WhatsApp forms running within minutes, and it has boosted our response rates significantly.",
    name: "Primož Zorč",
    role: "Adventura",
    initials: "PZ",
    bg: "bg-teal-500",
  },
  {
    quote:
      "OneForm is a must-have for any business using WhatsApp. The Google Form integration works flawlessly, and we get instant notifications.",
    name: "Jp Steyn",
    role: "Business Owner",
    initials: "JS",
    bg: "bg-indigo-500",
  },
];

export function Testimonials() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Trusted by Businesses Worldwide
          </h2>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <p className="mb-6 text-sm leading-relaxed text-gray-600">
                "{item.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${item.bg}`}
                >
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
