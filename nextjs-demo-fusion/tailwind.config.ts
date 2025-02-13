import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      backgroundSize: {
        "circuit-pattern": "20px 20px"
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        bearish: {
          DEFAULT: "#FF4E17",
          light: "#FF6B3F",
          dark: "#9A3412"
        }
      },
      keyframes: {
        "flash-glow": {
          "0%": { opacity: "1", filter: "brightness(1)" },
          "15%": { opacity: "1", filter: "brightness(1.2)" },
          "30%": { opacity: "1", filter: "brightness(1.1)" },
          "45%": { opacity: "1", filter: "brightness(1.15)" },
          "60%": { opacity: "1", filter: "brightness(1.1)" },
          "75%": { opacity: "1", filter: "brightness(1.05)" },
          "100%": { opacity: "1", filter: "brightness(1)" }
        }
      },
      animation: {
        "flash-glow": "flash-glow 1s ease-in-out"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      }
    }
  }
}
export default config
