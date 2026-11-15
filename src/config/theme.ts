/**
 * Design tokens. "Clinical but warm": deep petrol/navy base with an energetic
 * orange accent. Dark theme is first-class.
 */

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryText: string;
  accent: string;
  accentText: string;
  success: string;
  warning: string;
  danger: string;
  /** Contract phase colour in the player. */
  contract: string;
  /** Relax phase colour in the player. */
  relax: string;
  breathe: string;
  locked: string;
  overlay: string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  spacing: (n: number) => number;
  radius: { sm: number; md: number; lg: number; xl: number; pill: number };
  font: {
    display: number;
    h1: number;
    h2: number;
    h3: number;
    body: number;
    small: number;
    tiny: number;
  };
  /** Minimum touch target (px). */
  touch: number;
}

const palette = {
  navy900: '#0B1D2E',
  navy800: '#10293F',
  navy700: '#173752',
  navy600: '#1F4A6B',
  petrol500: '#1B6F86',
  petrol400: '#2C8CA6',
  petrol100: '#D7EEF3',
  orange500: '#F26B1D',
  orange400: '#FF8A45',
  orange100: '#FFE7D9',
  gray50: '#F6F8FA',
  gray100: '#EDF1F4',
  gray200: '#DCE3E9',
  gray400: '#94A3B1',
  gray500: '#6B7C8C',
  gray700: '#38495A',
  white: '#FFFFFF',
  green: '#2FA36B',
  amber: '#E5A00D',
  red: '#D6453D',
};

const base = {
  spacing: (n: number) => n * 4,
  radius: { sm: 8, md: 12, lg: 18, xl: 28, pill: 999 },
  font: { display: 44, h1: 30, h2: 23, h3: 19, body: 16, small: 14, tiny: 12 },
  touch: 48,
};

export const lightTheme: Theme = {
  ...base,
  dark: false,
  colors: {
    background: palette.gray50,
    surface: palette.white,
    surfaceAlt: palette.gray100,
    border: palette.gray200,
    text: palette.navy900,
    textMuted: palette.gray500,
    textInverse: palette.white,
    primary: palette.navy700,
    primaryText: palette.white,
    accent: palette.orange500,
    accentText: palette.white,
    success: palette.green,
    warning: palette.amber,
    danger: palette.red,
    contract: palette.orange500,
    relax: palette.gray400,
    breathe: palette.petrol400,
    locked: palette.gray200,
    overlay: 'rgba(11,29,46,0.55)',
  },
};

export const darkTheme: Theme = {
  ...base,
  dark: true,
  colors: {
    background: palette.navy900,
    surface: palette.navy800,
    surfaceAlt: palette.navy700,
    border: palette.navy600,
    text: '#EEF3F7',
    textMuted: '#9DB0C1',
    textInverse: palette.navy900,
    primary: palette.petrol400,
    primaryText: palette.white,
    accent: palette.orange400,
    accentText: palette.navy900,
    success: '#45C084',
    warning: '#F2B93B',
    danger: '#F06A62',
    contract: palette.orange400,
    relax: '#5D7184',
    breathe: palette.petrol400,
    locked: palette.navy600,
    overlay: 'rgba(0,0,0,0.6)',
  },
};
