/** 브랜드 자산 패키지 V3(color_tokens.css)와 같은 값을 유지합니다. */
export const colors = {
  brand: {
    navy950: "#071026",
    navy900: "#0B173F",
    navy700: "#253B70",
    mint500: "#31C9AE",
    /** 흰 배경 위 작은 아이콘·텍스트용 접근성 민트 */
    mint700: "#168B78",
    cyan400: "#63CBE4",
    blue500: "#3E70E8",
    violet500: "#7557F6",
    purple600: "#5E43D9",
  },
  background: {
    primary: "#F5F7FC",
    secondary: "#EEF2FA",
    lavender: "#EEE9FF",
  },
  surface: {
    solid: "#FFFFFF",
    soft: "#FCFDFF",
    dark: "#0B173F",
  },
  text: {
    primary: "#18213D",
    secondary: "#65708A",
    tertiary: "#8B95AB",
    inverse: "#FFFFFF",
    link: "#3E70E8",
  },
  status: {
    success: "#218A68",
    info: "#3E70E8",
    warning: "#B27500",
    error: "#B44747",
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
