import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f3f1ec",
        ink: "#1c1917",
        muted: "#78716c",
        line: "rgba(28, 25, 23, 0.08)",
        good: "#15803d",
        bad: "#dc2626",
        teal: {
          DEFAULT: "#0f766e",
          dark: "#115e59",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,25,23,0.04), 0 10px 28px rgba(28,25,23,0.06)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
