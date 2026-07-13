export const colors = {
  brand: {
    navy950: "#061238",
    navy900: "#071A4A",
    navy700: "#253B70",
    mint500: "#35C4B3",
    cyan400: "#63CBE4",
    blue500: "#4F7DF3",
    violet500: "#7658F5",
    purple600: "#6139E8",
  },
  background: {
    primary: "#F7F9FF",
    secondary: "#F0F3FC",
    lavender: "#F2F0FF",
  },
  surface: {
    solid: "#FFFFFF",
    soft: "#FCFDFF",
    dark: "#0B1B49",
  },
  text: {
    primary: "#071A4A",
    secondary: "#53627F",
    tertiary: "#8792A8",
    inverse: "#FFFFFF",
    link: "#4F67DD",
  },
  status: {
    success: "#178D7D",
    info: "#3D69D8",
    warning: "#A96608",
    error: "#C63C56",
    disabled: "#B7C0D1",
  },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  full: 999,
} as const;

export const motion = {
  fast: 120,
  standard: 220,
  emphasis: 360,
  score: 700,
  loop: 1400,
} as const;
