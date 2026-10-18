import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#0B0E0C",
          deep: "#0B0E0C",
        },
        forest: {
          DEFAULT: "#111A14",
          deep: "#0D140F",
          light: "#16231A",
        },
        surface: {
          DEFAULT: "#19221B",
          elevated: "#202C23",
          card: "#151D17",
          border: "#303A31",
        },
        emerald: {
          DEFAULT: "#0C7049",
          signature: "#0C7049",
          vibrant: "#30BD83",
          deep: "#084C32",
        },
        gold: {
          DEFAULT: "#D7BC83",
          champagne: "#D7BC83",
          light: "#EAD7A6",
          muted: "#9C875C",
        },
        ivory: {
          DEFAULT: "#F4F0E6",
          warm: "#F4F0E6",
          muted: "#A7AEA6",
          dim: "#6B756E",
        },
        border: {
          DEFAULT: "#303A31",
          subtle: "#303A31",
          light: "#3E4C40",
          gold: "rgba(215, 188, 131, 0.25)",
        },
        status: {
          available: "#30BD83",
          reserved: "#4D88AB",
          inplay: "#D99B43",
          maintenance: "#6B756E",
        },
      },
      fontFamily: {
        serif: ["'Cinzel'", "'Cormorant Garamond'", "'Playfair Display'", "Georgia", "serif"],
        sans: ["var(--font-geist-sans)", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "'SF Mono'", "monospace"],
      },
      boxShadow: {
        "editorial": "0 20px 40px -15px rgba(0, 0, 0, 0.7)",
        "editorial-gold": "0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 15px rgba(215, 188, 131, 0.08)",
        "editorial-emerald": "0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 15px rgba(48, 189, 131, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
