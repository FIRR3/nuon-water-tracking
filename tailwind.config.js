/** @type {import('tailwindcss').Config} */

const { colors } = require('./constants/nativeWind-colors')

module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      fontFamily: {
        poppins: ["Poppins-Regular"],
        'poppins-medium': ["Poppins-Medium"],
        'poppins-bold': ["Poppins-Bold"],
      },
      fontSize: {
        xs: 12,
        sm: 14,
        md: 18,
        lg: 24,
        xl: 70,
      },
    },
  },
  plugins: [],
}