import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#9A3412", // სიღნაღისფერი სტაფილოსფერი
        navy: "#1E3A8A",  // მუქი ლურჯი
      }
    },
  },
  plugins: [],
};
export default config;