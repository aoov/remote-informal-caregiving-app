// tailwind.config.js
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}", // Add this line to include all files in the /app directory
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};