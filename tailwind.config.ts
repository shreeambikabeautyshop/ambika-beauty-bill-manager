import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
          950: "#4a044e",
        },
        gold: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        surface: {
          DEFAULT: "#0f0f13",
          card:    "#17171f",
          border:  "#2a2a35",
          hover:   "#1e1e28",
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #c026d3 0%, #7c3aed 50%, #2563eb 100%)",
        "gradient-gold":  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        "gradient-card":  "linear-gradient(145deg, #17171f 0%, #1e1e2a 100%)",
        "gradient-glow":  "radial-gradient(ellipse at top, #c026d320 0%, transparent 60%)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Cal Sans", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "brand":      "0 0 40px rgba(192, 38, 211, 0.15)",
        "brand-lg":   "0 0 80px rgba(192, 38, 211, 0.2)",
        "gold":       "0 0 30px rgba(245, 158, 11, 0.2)",
        "card":       "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.6)",
        "glow-sm":    "0 0 12px rgba(192,38,211,0.3)",
      },
      animation: {
        "pulse-slow":    "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "float":         "float 6s ease-in-out infinite",
        "shimmer":       "shimmer 2s linear infinite",
        "slide-up":      "slideUp 0.4s ease-out",
        "fade-in":       "fadeIn 0.3s ease-out",
      },
      keyframes: {
        float:    { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        shimmer:  { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        slideUp:  { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn:   { from: { opacity: "0" }, to: { opacity: "1" } },
      },
    },
  },
  plugins: [],
};

export default config;
