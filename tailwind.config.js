/** @type {import('tailwindcss').Config} */

// Mirrors the :root custom properties in src/index.css so classes can name a
// token instead of repeating a hex. Values are duplicated rather than read
// through var(): Tailwind needs literals to generate opacity modifiers like
// bg-surface/60, which var() breaks. Change both or neither — see DESIGN.md.
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#090B12",
        surface: "#111521",
        card: "#171C2B",
        hover: "#1E2540",
        // `fg` is the accent for TEXT and icons. `DEFAULT` is for fills and
        // borders, where WCAG asks 3:1 rather than 4.5:1 — as text on --bg it
        // only reaches 4.40:1, and much of this accent is set at 10px.
        primary: { DEFAULT: "#6366F1", hover: "#7C83FF", fg: "#818CF8" },
        accent: "#00D4FF",
        fg: { DEFAULT: "#F8FAFC", muted: "#9AA3B2" },
        hairline: "rgba(255,255,255,0.08)",
        live: "#4ADE80",
        danger: "#EF4444",
        "danger-fg": "#FFB4AB",
      },
      fontFamily: {
        sans: ["Instrument Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "source-code-pro", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
