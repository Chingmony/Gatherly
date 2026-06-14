import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", "[data-theme='dark']"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["DM Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        /* ── shadcn/ui palette ── */
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* ── Gatherly extended palette (direct CSS vars) ── */
        surface:   "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        sidebar:   "var(--sidebar)",
        bg:        "var(--bg)",

        "g-primary":   "var(--primary-hex)",
        "g-primary-soft": "var(--primary-soft)",

        green:  "var(--green)",
        "green-600": "var(--green-600)",
        "green-soft": "var(--green-soft)",

        blue:       "var(--blue)",
        "blue-soft": "var(--blue-soft)",

        orange:      "var(--orange)",
        "orange-soft": "var(--orange-soft)",

        violet:      "var(--violet)",
        "violet-soft": "var(--violet-soft)",

        pink:        "var(--pink)",
        "pink-soft": "var(--pink-soft)",

        teal:        "var(--teal)",
        "teal-soft": "var(--teal-soft)",

        danger:      "var(--danger)",
        "danger-soft": "var(--danger-soft)",

        "text-strong": "var(--text-strong)",
        "text-muted":  "var(--text-muted)",
        "text-faint":  "var(--text-faint)",

        "border-strong": "var(--border-strong)",
      },
      borderRadius: {
        "2xl": "var(--radius-xl)",   /* 22px — card radius */
        xl:    "var(--radius-lg)",   /* 18px */
        lg:    "var(--radius-md)",   /* 13px */
        md:    "var(--radius-md)",
        sm:    "var(--radius-sm)",   /* 9px */
      },
      boxShadow: {
        sm:   "var(--shadow-sm)",
        card: "var(--shadow-card)",
        pop:  "var(--shadow-pop)",
        glow: "var(--shadow-glow)",
      },
      maxWidth: {
        "page": "1320px",
      },
      width: {
        sidebar: "252px",
      },
      fontSize: {
        /* Design-exact sizes */
        "2xs": ["11px", { lineHeight: "1.4" }],
        xs:    ["12px", { lineHeight: "1.5" }],
        sm:    ["13px", { lineHeight: "1.5" }],
        base:  ["14px", { lineHeight: "1.6" }],
        md:    ["14.5px", { lineHeight: "1.5" }],
        lg:    ["15px", { lineHeight: "1.5" }],
        xl:    ["17px", { lineHeight: "1.4", fontWeight: "800" }],
        "2xl": ["20px", { lineHeight: "1.3" }],
        "3xl": ["24px", { lineHeight: "1.2" }],
        "4xl": ["25px", { lineHeight: "1.15" }],
        "5xl": ["34px", { lineHeight: "1.12" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
