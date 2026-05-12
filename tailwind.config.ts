import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto"],
      },
      colors: {
        ink: "#0b0b14",
        cream: "#f6f1e7",
        pop: "#ff5b6e",
        sun: "#ffd166",
        sea: "#06b6d4",
      },
      animation: {
        "pop-in": "pop-in 220ms cubic-bezier(.2,.9,.3,1.4)",
        "fade-up": "fade-up 320ms ease-out",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "fade-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
