import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        extend: {
            backgroundSize: {
                'circuit-pattern': '20px 20px'
            },
            colors: {
                border: "hsl(var(--border))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
            },
            keyframes: {
                'flash-glow': {
                    '0%': { opacity: '1', filter: 'brightness(1)' },
                    '15%': { opacity: '1', filter: 'brightness(1.2)' },
                    '30%': { opacity: '1', filter: 'brightness(1.1)' },
                    '45%': { opacity: '1', filter: 'brightness(1.15)' },
                    '60%': { opacity: '1', filter: 'brightness(1.1)' },
                    '75%': { opacity: '1', filter: 'brightness(1.05)' },
                    '100%': { opacity: '1', filter: 'brightness(1)' },
                }
            },
            animation: {
                'flash-glow': 'flash-glow 1s ease-in-out',
            }
        }
    },
};
export default config;

