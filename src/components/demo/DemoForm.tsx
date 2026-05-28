"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { FloatingWhatsAppButton } from "@/components/ui/FloatingWhatsAppButton";
import Link from "next/link";

const DEMO_WHATSAPP = "60123456789";

const SERVICES = [
  "Consultation",
  "Premium Package",
  "Standard Package",
  "Custom Service",
];

function buildDemoMessage(data: Record<string, string>) {
  return [
    "Hi, I would like to submit my details:",
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    `Service: ${data.service}`,
    `Quantity: ${data.quantity}`,
    `Preferred Date: ${data.date}`,
    `Message: ${data.message}`,
  ].join("\n");
}

export function DemoForm() {
  const [values, setValues] = useState({
    name: "",
    phone: "",
    email: "",
    service: SERVICES[0],
    quantity: "",
    date: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!values.name.trim()) nextErrors.name = "Name is required";
    if (!values.phone.trim()) nextErrors.phone = "Phone is required";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const message = buildDemoMessage(values);
    const url = `https://wa.me/${DEMO_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="border-b border-brand-border bg-white">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
          <BrandLogo />
          <Link
            href="/"
            className="text-sm font-medium text-brand-muted hover:text-whatsapp-deep"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="px-4 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-lg"
        >
          <div className="mb-8 text-center">
            <span className="mb-3 inline-block rounded-full bg-whatsapp/10 px-3 py-1 text-xs font-semibold text-whatsapp-deep">
              Live Demo
            </span>
            <h1 className="text-2xl font-bold text-brand-text sm:text-3xl">
              Customer Enquiry Form
            </h1>
            <p className="mt-2 text-sm text-brand-muted">
              Fill in your details and submit directly via WhatsApp
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-brand-border bg-white p-6 shadow-card-lg sm:p-8"
          >
            <div className="space-y-5">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={values.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+60 12 345 6789"
                  value={values.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="service">Service / Package</Label>
                <select
                  id="service"
                  value={values.service}
                  onChange={(e) => handleChange("service", e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-text outline-none transition-all focus:border-whatsapp focus:ring-2 focus:ring-whatsapp/20"
                >
                  {SERVICES.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="quantity">Number of Pax / Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={values.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="date">Preferred Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={values.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your requirements..."
                  value={values.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="whatsapp"
              showWhatsAppIcon
              size="lg"
              className="mt-8 w-full"
            >
              Submit via WhatsApp
            </Button>

            <p className="mt-4 text-center text-xs text-brand-muted">
              Powered by OneForm · oneform.app
            </p>
          </form>
        </motion.div>
      </main>

      <FloatingWhatsAppButton />
    </div>
  );
}
