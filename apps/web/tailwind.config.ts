import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2937",
        mist: "#edf2f7",
        paper: "#fffdf7",
        accent: "#b45309",
        pine: "#14532d",
        slateblue: "#334155",
      },
      boxShadow: {
        card: "0 20px 45px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "Noto Sans JP", "Segoe UI", "sans-serif"],
        mono: ["IBM Plex Mono", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
