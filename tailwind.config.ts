import type { Config } from "tailwindcss";

/**
 * Design tokens live here so that both Tailwind utilities and the raw Three.js
 * scene can read from a single source of truth (see `src/lib/design-tokens.ts`).
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#0a0a0c",
          50: "#f5f5f7",
          100: "#e7e7ea",
          200: "#c9c9cf",
          300: "#a1a1aa",
          400: "#6f6f7a",
          500: "#4a4a54",
          600: "#2e2e36",
          700: "#1c1c22",
          800: "#121216",
          900: "#0a0a0c",
          950: "#060607",
        },
        neon: {
          DEFAULT: "#7c5cff",
          violet: "#7c5cff",
          cyan: "#22d3ee",
          lime: "#a3e635",
          pink: "#f472b6",
          amber: "#fbbf24",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,0.35), 0 0 32px -4px rgba(124,92,255,0.55)",
        "glow-cyan": "0 0 0 1px rgba(34,211,238,0.35), 0 0 32px -4px rgba(34,211,238,0.5)",
        inset: "inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "grid-overlay":
          "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(120% 80% at 50% 0%, rgba(124,92,255,0.16) 0%, rgba(10,10,12,0) 60%)",
      },
      backgroundSize: {
        grid: "48px 48px",
        "grid-sm": "24px 24px",
      },
      keyframes: {
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "scan-line": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(100%)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 24s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        marquee: "marquee 38s linear infinite",
        "scan-line": "scan-line 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
