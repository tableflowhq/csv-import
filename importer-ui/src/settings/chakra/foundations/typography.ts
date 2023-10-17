const typography = {
  letterSpacings: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },

  lineHeights: {
    normal: "normal",
    none: 1,
    shorter: 1.25,
    short: 1.375,
    base: 1.5,
    tall: 1.625,
    taller: "2",
    "3": ".75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "7": "1.75rem",
    "8": "2rem",
    "9": "2.25rem",
    "10": "2.5rem",
  },

  fontWeights: {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  fonts: {
    heading: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
    body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
    mono: `SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace`,
  },

  fontSizes: {
    "3xs": "calc(var(--font-size) * 0.45)",
    "2xs": "calc(var(--font-size) * 0.625)",
    xs: "calc(var(--font-size) * 0.75)",
    sm: "calc(var(--font-size) * 0.875)",
    md: "calc(var(--font-size) * 1)",
    lg: "calc(var(--font-size) * 1.125)",
    xl: "calc(var(--font-size) * 1.25)",
    "2xl": "calc(var(--font-size) * 1.5)",
    "3xl": "calc(var(--font-size) * 1.875)",
    "4xl": "calc(var(--font-size) * 2.25)",
    "5xl": "calc(var(--font-size) * 3)",
    "6xl": "calc(var(--font-size) * 3.75)",
    "7xl": "calc(var(--font-size) * 4.5)",
    "8xl": "calc(var(--font-size) * 6)",
    "9xl": "calc(var(--font-size) * 8)",
  },
};

export default typography;
