import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./content/**/*.mdx", "./public/**/*.svg"],
  theme: {
    extend: {
      boxShadow: {
        "code-shadow":
          "0 0 0 1px rgba(14, 22, 34, 0.1), 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
      },
      fontFamily: {
        sans: ["Reference Outfit", "system-ui", "sans-serif"],
        mono: ["Reference Core Mono", "ui-monospace", "monospace"],
        display: ["Reference Bluu Next", "Georgia", "serif"],
        org: ["Reference Bluu Next", "Georgia", "serif"],
        grotesk: ["Reference Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        "bg-primary": "var(--bg-primary)",
        "border-primary": "var(--border-primary)",
        "dark-primary": "var(--dark-primary)",
        "purple-primary": "var(--purple-primary)",
        "purple-secondary": "var(--purple-secondary)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
      },
      typography: {
        quoteless: {
          css: {
            "blockquote p:first-of-type::before": { content: "none" },
            "blockquote p:first-of-type::after": { content: "none" },
          },
        },
        h1: {
          colors: "text-secondary",
        },
      },
      animation: {
        "spin-slow": "spin 14s linear infinite",
        marquee: "marquee var(--marquee-duration, 30s) linear infinite",
        "marquee-reverse":
          "marquee var(--marquee-duration, 30s) linear infinite reverse",
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
} satisfies Config;
