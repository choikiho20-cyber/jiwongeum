import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          500: "#2b5cd9",
          600: "#1f47b3",
          700: "#183a92",
          900: "#0f2c5c",
        },
      },
    },
  },
  plugins: [],
};
export default config;
