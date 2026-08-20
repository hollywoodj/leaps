import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1b57b5",
          deep: "#15448f",
        },
        ios: "#007aff",
        grouped: "#f2f2f7",
        label: "#163a73",
        muted: "#8e8e93",
        fill: "#e5e5ea",
        good: "#34c759",
        bad: "#ff3b30",
        ink: "#163a73",
        teal: {
          DEFAULT: "#1b57b5",
          dark: "#15448f",
        },
      },
      boxShadow: {
        card: "0 8px 24px rgba(16, 42, 90, 0.08)",
        sheet: "0 -8px 40px rgba(16, 42, 90, 0.18)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
