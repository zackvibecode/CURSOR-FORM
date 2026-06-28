import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens driven by CSS variables (support light + dark)
        bg: "var(--bg)",
        fg: "var(--fg)",
        card: "var(--card)",
        border: "var(--border)",
        muted: {
          DEFAULT: "var(--muted)",
          fg: "var(--muted-fg)",
        },
        // Vercel-style gray ramp for explicit usage
        gray: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
        // WhatsApp green kept as brand accent
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
        // Legacy brand tokens (kept for backward compat with untouched pages)
        brand: {
          text: "#111827",
          muted: "#6B7280",
          bg: "#F7FAF8",
          border: "#E5E7EB",
          red: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
        md: "0 2px 8px -2px rgb(0 0 0 / 0.1)",
        lg: "0 8px 24px -4px rgb(0 0 0 / 0.12)",
        glow: "0 0 0 1px rgba(16, 208, 80, 0.4), 0 0 12px 2px rgba(16, 208, 80, 0.25)",
        // Legacy
        card: "0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06)",
        "card-lg": "0 4px 12px rgba(0, 0, 0, 0.05), 0 16px 48px rgba(0, 0, 0, 0.08)",
        soft: "0 2px 8px rgba(16, 208, 80, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        float: "float 5s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
        "slide-in": "slideIn 0.2s ease-out",
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
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
