/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gray: {
          50: "#f6f5f1",
          100: "#eeefe9",
          200: "#dedfd8",
          300: "#c5cac3",
          400: "#9aa59c",
          500: "#758279",
          600: "#59675e",
          700: "#35423a",
          800: "#1e2823",
          900: "#151c19",
        },
        blue: {
          50: "#f0f6f1",
          100: "#e3eee5",
          200: "#c9dfd0",
          300: "#a4d9b8",
          400: "#86c89f",
          500: "#3d8760",
          600: "#235d47",
          700: "#194533",
          800: "#173d2c",
          900: "#163025",
        },
        background: {
          light: "#ffffff",
          dark: "#111111",
        },
        card: {
          light: "#ffffff",
          dark: "#23272f",
        },
        section: {
          light: "#f8f9fa",
          dark: "#18181b",
        },
      },
    },
  },
  plugins: [],
};
