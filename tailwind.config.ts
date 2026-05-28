import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          DEFAULT: "#10D050",
          deep: "#0B8A3D",
          dark: "#0A7A36",
          light: "#DCFCE7",
        },
        oneform: {
          DEFAULT: "#10D050",
          dark: "#0B8A3D",
          light: "#E8FBEF",
        },
        brand: {
          text: "#111827",
          muted: "#6B7280",
          bg: "#F7FAF8",
          border: "#E5E7EB",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06)",
        "card-lg": "0 4px 12px rgba(0, 0, 0, 0.05), 0 16px 48px rgba(0, 0, 0, 0.08)",
        soft: "0 2px 8px rgba(16, 208, 80, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        float: "float 5s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSoft: {
          "0%, 100%": { boxShadow: "0 4px 16px rgba(16, 208, 80, 0.25)" },
          "50%": { boxShadow: "0 4px 24px rgba(16, 208, 80, 0.45)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
