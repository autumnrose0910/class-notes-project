/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F6F2EE",
        mocha: "#7C5E4F",
        latte: "#B99A8A",
        butter: "#F3E6B3",
        peach: "#E8C4B0",
        sand: "#EDE3DB",
      },
      fontFamily: {
        serifDisplay: ['"Playfair Display"', "serif"],
      },
      boxShadow: {
        soft: "0 8px 20px rgba(124, 94, 79, 0.08)",
      },
    },
  },
  plugins: [],
}
