/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F7F2E7",
        paper: "#FFFFFF",
        ink: "#2E4756",
        "ink-light": "#3F5A6B",
        accent: "#D97748",
        "accent-light": "#F0C6AE",
        success: "#3F7F5C",
        "success-bg": "#E3EFE6",
        warn: "#B9791F",
        "warn-bg": "#F6E7C9",
        danger: "#C0463F",
        "danger-bg": "#F7DBD8",
      },
    },
  },
  plugins: [],
};
