/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 20px 45px -25px rgba(15,23,42,0.45)"
      },
      colors: {
        surface: {
          DEFAULT: "#f7f9fb",
          muted: "#eef2f7"
        }
      }
    }
  },
  plugins: []
};

