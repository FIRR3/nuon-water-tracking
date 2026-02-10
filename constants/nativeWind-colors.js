// Same colors, but meant to be used in NativeWind config

export const lightColors = {
  primary: "hsl(0, 0%, 12%)",
  secondary: "hsl(0, 0%, 90%)",
  accent: "hsl(212, 92%, 61%)",

  white: "hsl(0, 0%, 100%)",
  background: "hsl(0, 0%, 100%)",

  orange: "hsl(14, 93%, 56%)",
  yellow: "hsl(58, 100%, 58%)",
};

export const darkColors = {
  primary: "hsl(0, 0%, 100%)",
  secondary: "hsl(0, 0%, 21%)",
  accent: "hsl(212, 92%, 61%)",

  dark: "hsl(0, 0%, 12%)",
  white: "hsl(0, 0%, 100%)",
  background: "hsl(0, 0%, 12%)",

  orange: "hsl(14, 93%, 56%)",
  yellow: "hsl(58, 100%, 58%)",
};

const colors = {
  ...Object.fromEntries(
    Object.entries(lightColors).map(([k, v]) => [`light-${k}`, v]),
  ),
  ...Object.fromEntries(
    Object.entries(darkColors).map(([k, v]) => [`dark-${k}`, v]),
  ),
};

module.exports = { colors };
