export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B1020",
        surface: "#111827",
        border: "#1F2937",
        primary: "#F59E0B",
        success: "#10B981",
        danger: "#EF4444",
        info: "#3B82F6",
        purple: "#8B5CF6",
      },
      boxShadow: {
        glow: "0 0 20px rgba(255,255,255,0.1)",
      },
    },
  },
  plugins: [],
};
