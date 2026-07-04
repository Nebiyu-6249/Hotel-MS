import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Public site: candlelit heritage palette. Warm near-black, aged
        // brass as the single accent, burgundy held back for small moments.
        ink: { DEFAULT: "#191512", soft: "#221c17", raised: "#2b231c" },
        parchment: { DEFAULT: "#ede4d3", dim: "#b3a68e", faint: "#8a7d67" },
        brass: { DEFAULT: "#c19a5b", bright: "#d8b578", dark: "#8f6f3d" },
        burgundy: { DEFAULT: "#6b2e35", deep: "#4c1f25" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        site: "76rem",
      },
    },
  },
  plugins: [],
};

export default config;
