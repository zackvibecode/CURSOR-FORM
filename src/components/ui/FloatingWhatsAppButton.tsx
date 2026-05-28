"use client";

import { motion } from "framer-motion";
import { WhatsAppIcon } from "./WhatsAppIcon";

const DEFAULT_NUMBER = "60123456789";
const DEFAULT_MESSAGE = "Hi, I would like to learn more about OneForm";

export function FloatingWhatsAppButton({
  phone = DEFAULT_NUMBER,
  message = DEFAULT_MESSAGE,
}: {
  phone?: string;
  message?: string;
}) {
  const url = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-whatsapp text-white shadow-soft animate-pulse-soft transition-transform hover:scale-105 hover:bg-[#20bd5a]"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, duration: 0.4 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </motion.a>
  );
}
