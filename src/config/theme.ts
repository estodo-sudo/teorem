import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

/**
 * Design tokens (ui-v3, SPEC_UI_V3 §3): calm, trustworthy, warm. Deep petrol green is the only
 * brand colour (≈10 % of a screen); warm amber (`highlight`) is reserved for streaks, celebrations
 * and personal records. Light + dark (no pure black).
 *
 * New code reads `t.tokens.*`, `t.tone.*`, `t.space`, `t.radius`, `t.type`, `t.shadow`, `t.border`.
 * Spec name → token: bg=background, surface=card, surfaceMuted=muted, text=foreground,
 * textMuted=mutedForeground, onPrimary=primaryForeground, accent (amber)=highlight.
 * `accent` is kept as a deprecated alias of `primary` (it used to be the orange call to action).
 */

export interface ThemeTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  /** Helper labels only — never body text. */
  subtle: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  /** @deprecated former orange CTA — now the same as primary. */
  accent: string;
  /** @deprecated */
  accentForeground: string;
  /** Warm amber: streak flame, celebration, personal record. Never a text colour. */
  highlight: string;
  highlightSoft: string;
  destructive: string;
  destructiveSoft: string;
  destructiveForeground: string;
  success: string;
  successSoft: string;
  successForeground: string;
  warning: string;
  warningSoft: string;
  warningForeground: string;
  info: string;
  infoSoft: string;
  infoForeground: string;
  border: string;
  input: string;
  ring: string;
  overlay: string;
  /** Kegel player: squeeze / relax / calm colours. */
  contract: string;
  relax: string;
  breathe: string;
  /** Ring around unread story bubbles. */
  storyRing: string;
  /** Disabled / locked surfaces. */
  locked: string;
}

/** Legacy colour names (aliases of the tokens). */
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
  contract: string;
  relax: string;
  breathe: string;
  storyRing: string;
  info: string;
  infoText: string;
  locked: string;
  overlay: string;
}

/** Module identity (§3.3): only icon backgrounds and heading accents — buttons stay primary. */
export type ModuleTone = 'kegel' | 'mind' | 'smokefree' | 'focus' | 'campus' | 'knowledge';
export interface ToneColors {
  fg: string;
  soft: string;
}

/** Colours of the always-dark focus screens (player, SOS, breathing) — §7.4. */
export interface FocusColors {
  bg: string;
  bgEnd: string;
  text: string;
  /** 70 % white — top-bar icons. */
  icon: string;
  /** 60 % white — hints, secondary controls. */
  dim: string;
  /** 12 % white — control backgrounds. */
  control: string;
  track: string;
  orbCenter: string;
  orbEdge: string;
  relax: string;
  /** Idle / neutral sphere tone and the paused sphere. */
  idle: string;
  paused: string;
  glow: string;
  /** Discreet (black) mode. */
  black: string;
}

/** White veils for text and shapes on a coloured hero (and the dark player). */
export interface Veils {
  faint: string;
  soft: string;
  mid: string;
  strong: string;
  bold: string;
  /** Dark frosted card on story photos (SPEC_GORSELLER_V5 §4); the same in both themes. */
  card: string;
  /** Text shadow on the sphere's seconds. */
  shadow: string;
}

/** 8 pt grid (§3.5): 4 8 12 16 20 24 32 40 48. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, gutter: 20, xl: 24, xxl: 32, xxxl: 40, huge: 48 } as const;
/** card 20 · button 14 · input / icon tile 12 · sheet 24 · chips pill. */
export const radius = { sm: 8, md: 12, button: 14, lg: 20, xl: 24, pill: 999 } as const;
export const borderWidth = { hairline: StyleSheet.hairlineWidth, thin: 1, medium: 1.5, thick: 2 } as const;

/** Embedded Inter faces (loaded with expo-font from the app bundle — never from the network). */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;
export type FontWeight = '400' | '500' | '600' | '700';
export function familyFor(weight: TextStyle['fontWeight']): string {
  const w = String(weight ?? '400');
  if (w === 'bold' || Number(w) >= 700) return fontFamily.bold;
  if (Number(w) >= 600) return fontFamily.semibold;
  if (Number(w) >= 500) return fontFamily.medium;
  return fontFamily.regular;
}

/** Type scale (§3.4): size / line height / weight. */
export const typeScale = {
  display: { fontSize: 56, lineHeight: 60, fontWeight: '600' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  title3: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  callout: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  /** @deprecated aliases (ui-v2 names) */
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  subheading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  small: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
} as const;
/** Upper-case labels: caption size only, +0.4 letter spacing. */
export const capsLetterSpacing = 0.4;
/** Numbers that must not shift (timers, stats). */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/** Motion (§3.6): press 150, transition 250, sheet / page 350 ms; list stagger 30 ms, max 6 items. */
export const motion = { fast: 150, normal: 250, slow: 350, stagger: 30, staggerMax: 6, enterOffset: 8 } as const;
export const pressScale = 0.98;

export type ShadowLevel = 'none' | 'sm' | 'md' | 'lg';

export interface Theme {
  dark: boolean;
  tokens: ThemeTokens;
  tone: Record<ModuleTone, ToneColors>;
  focus: FocusColors;
  veil: Veils;
  /** "Pelvik taban kasın nerede?" animation (always dark, same in both themes). */
  anatomy: AnatomyColors;
  /** @deprecated use tokens */
  colors: ThemeColors;
  space: typeof space;
  /** @deprecated use space — n × 4 px */
  spacing: (n: number) => number;
  radius: typeof radius;
  border: typeof borderWidth;
  type: typeof typeScale;
  font: { display: number; h1: number; h2: number; h3: number; body: number; small: number; tiny: number };
  family: typeof fontFamily;
  shadow: Record<ShadowLevel, ViewStyle>;
  motion: typeof motion;
  /** Minimum touch target (px). */
  touch: number;
  /** Icon tile sizes (§4.1). */
  tile: { sm: number; lg: number };
  /** Lucide stroke width (§4.1). */
  iconStroke: number;
}

const palette = {
  white: '#FFFFFF',
  black: '#000000',
  // light
  warm50: '#F6F5F2',
  warm100: '#EFEDE8',
  warm200: '#E3E0DA',
  ink900: '#1C1F23',
  ink500: '#6B7078',
  // spec §3.1 gives #9298A0 (2.9:1 on white); darkened a touch to pass the 3:1 UI-part rule of §8.
  ink400: '#878D95',
  petrol600: '#1E6B66',
  petrol700: '#175752',
  petrol50: '#E2EFEC',
  amber400: '#E8A33D',
  amber50: '#FBF1DF',
  green600: '#2F8A5B',
  green50: '#E3F2EA',
  ochre600: '#B7791F',
  ochre50: '#FBF0DC',
  red600: '#C2453D',
  red50: '#F9E5E3',
  blue600: '#3A6EA5',
  blue50: '#E4EDF7',
  relaxBlue: '#7FA7C9',
  // dark
  night900: '#0F1214',
  night850: '#13191B',
  night800: '#171B1E',
  night700: '#1E2327',
  night600: '#2A3035',
  mist100: '#ECEEEF',
  mist400: '#9AA2A9',
  mist500: '#6F777E',
  petrol300: '#4FB3A9',
  petrol350: '#3F9E95',
  petrol950: '#16302D',
  amber300: '#F0B65A',
  amber950: '#33281A',
  green300: '#5FBF8A',
  green950: '#17291F',
  ochre300: '#D9A04A',
  ochre950: '#30261A',
  red300: '#E57A72',
  red950: '#351D1B',
  blue300: '#7FA6D6',
  blue950: '#1A2533',
};

const lightTokens: ThemeTokens = {
  background: palette.warm50,
  foreground: palette.ink900,
  card: palette.white,
  cardForeground: palette.ink900,
  muted: palette.warm100,
  mutedForeground: palette.ink500,
  subtle: palette.ink400,
  primary: palette.petrol600,
  primaryPressed: palette.petrol700,
  primarySoft: palette.petrol50,
  primaryForeground: palette.white,
  secondary: palette.warm100,
  secondaryForeground: palette.ink900,
  accent: palette.petrol600,
  accentForeground: palette.white,
  highlight: palette.amber400,
  highlightSoft: palette.amber50,
  destructive: palette.red600,
  destructiveSoft: palette.red50,
  destructiveForeground: palette.white,
  success: palette.green600,
  successSoft: palette.green50,
  successForeground: palette.white,
  warning: palette.ochre600,
  warningSoft: palette.ochre50,
  warningForeground: palette.white,
  info: palette.blue600,
  infoSoft: palette.blue50,
  infoForeground: palette.white,
  border: palette.warm200,
  input: palette.warm200,
  ring: palette.petrol600,
  overlay: 'rgba(15,18,20,0.4)',
  contract: palette.petrol600,
  relax: palette.relaxBlue,
  breathe: '#5B7FB8',
  storyRing: palette.petrol600,
  locked: palette.warm200,
};

const darkTokens: ThemeTokens = {
  background: palette.night900,
  foreground: palette.mist100,
  card: palette.night800,
  cardForeground: palette.mist100,
  muted: palette.night700,
  mutedForeground: palette.mist400,
  subtle: palette.mist500,
  primary: palette.petrol300,
  primaryPressed: palette.petrol350,
  primarySoft: palette.petrol950,
  primaryForeground: palette.night900,
  secondary: palette.night700,
  secondaryForeground: palette.mist100,
  accent: palette.petrol300,
  accentForeground: palette.night900,
  highlight: palette.amber300,
  highlightSoft: palette.amber950,
  destructive: palette.red300,
  destructiveSoft: palette.red950,
  destructiveForeground: palette.night900,
  success: palette.green300,
  successSoft: palette.green950,
  successForeground: palette.night900,
  warning: palette.ochre300,
  warningSoft: palette.ochre950,
  warningForeground: palette.night900,
  info: palette.blue300,
  infoSoft: palette.blue950,
  infoForeground: palette.night900,
  border: palette.night600,
  input: palette.night600,
  ring: palette.petrol300,
  overlay: 'rgba(0,0,0,0.4)',
  contract: palette.petrol300,
  relax: palette.relaxBlue,
  breathe: '#8AA6D6',
  storyRing: palette.petrol300,
  locked: palette.night600,
};

const lightTones: Record<ModuleTone, ToneColors> = {
  kegel: { fg: palette.petrol600, soft: palette.petrol50 },
  mind: { fg: '#5B7FB8', soft: '#E6EDF7' },
  smokefree: { fg: '#3B8DAE', soft: '#E2F0F5' },
  focus: { fg: '#6466C9', soft: '#E9E9F8' },
  campus: { fg: '#8A7A5C', soft: '#F1ECE3' },
  knowledge: { fg: '#7A6F9B', soft: '#EEEBF4' },
};

const darkTones: Record<ModuleTone, ToneColors> = {
  kegel: { fg: palette.petrol300, soft: palette.petrol950 },
  mind: { fg: '#8AA6D6', soft: '#1B2433' },
  smokefree: { fg: '#6FB5D1', soft: '#152A33' },
  focus: { fg: '#9597E3', soft: '#21223A' },
  campus: { fg: '#BBA984', soft: '#2A251C' },
  knowledge: { fg: '#A89FC8', soft: '#25222F' },
};

/** The focus screens look the same in both themes. */
const focusColors: FocusColors = {
  bg: palette.night900,
  bgEnd: palette.night850,
  text: palette.white,
  icon: 'rgba(255,255,255,0.7)',
  dim: 'rgba(255,255,255,0.6)',
  control: 'rgba(255,255,255,0.12)',
  track: 'rgba(255,255,255,0.14)',
  orbCenter: '#7FCFC6',
  orbEdge: palette.petrol300,
  relax: palette.relaxBlue,
  idle: '#2F6F69',
  paused: '#3A4247',
  glow: palette.petrol300,
  black: palette.black,
};

const veils: Veils = { faint: 'rgba(255,255,255,0.08)', soft: 'rgba(255,255,255,0.12)', mid: 'rgba(255,255,255,0.16)', strong: 'rgba(255,255,255,0.18)', bold: 'rgba(255,255,255,0.4)', card: 'rgba(15,18,20,0.72)', shadow: 'rgba(0,0,0,0.35)' };

function legacy(t: ThemeTokens): ThemeColors {
  return {
    background: t.background,
    surface: t.card,
    surfaceAlt: t.muted,
    border: t.border,
    text: t.foreground,
    textMuted: t.mutedForeground,
    textInverse: palette.white,
    primary: t.primary,
    primaryText: t.primaryForeground,
    accent: t.accent,
    accentText: t.accentForeground,
    success: t.success,
    warning: t.warning,
    danger: t.destructive,
    contract: t.contract,
    relax: t.relax,
    breathe: t.breathe,
    storyRing: t.storyRing,
    info: t.info,
    infoText: t.infoForeground,
    locked: t.locked,
    overlay: t.overlay,
  };
}

/** Cards carry no shadow (border only). Raised elements (sheet, toast): y 8 · blur 24 · 6 %. No shadows in dark. */
function shadows(dark: boolean): Record<ShadowLevel, ViewStyle> {
  if (dark) return { none: {}, sm: {}, md: {}, lg: {} };
  const raised: ViewStyle = { shadowColor: palette.black, shadowOpacity: 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 4 };
  return { none: {}, sm: {}, md: raised, lg: raised };
}

/** Colours of the pelvic floor animation (ANIM_A0_DUZELTME §1). Opacities are separate so the hex stays readable. */
export interface AnatomyColors {
  bgTop: string;
  bgBottom: string;
  /** Soft radial glow in the middle of the background (radius 300). */
  bgGlow: string;
  bgGlowOpacity: number;
  silhouette: string;
  silhouetteEdge: string;
  /** 1 px line between the arm and the body. */
  armDivider: string;
  stool: string;
  bone: string;
  /** Iliac wing, fainter than the other bones. */
  boneWingOpacity: number;
  bladder: string;
  bowel: string;
  organFillOpacity: number;
  organEdgeOpacity: number;
  muscle: string;
  label: string;
  labelOpacity: number;
  /** Scene 7 "do not squeeze" areas and their crosses: `textMuted`, area fill 40 %. Never red. */
  wrong: string;
  wrongOpacity: number;
  /** Captions and the "Geç" / "Sonra" text buttons. */
  text: string;
  /** Round play icon shown while paused: white at 20 %. */
  pauseBg: string;
}

const anatomyColors: AnatomyColors = {
  bgTop: '#15252A',
  bgBottom: '#0C1417',
  bgGlow: '#1E3338',
  bgGlowOpacity: 0.6,
  silhouette: '#26323A',
  silhouetteEdge: '#3E4A52',
  armDivider: '#1A2228',
  stool: '#3E4A52',
  bone: '#C9CED4',
  boneWingOpacity: 0.6,
  bladder: '#5B7FB8',
  bowel: '#A08A62',
  organFillOpacity: 0.35,
  organEdgeOpacity: 0.7,
  muscle: palette.petrol300,
  label: '#E6E9EC',
  labelOpacity: 0.7,
  wrong: palette.mist400,
  wrongOpacity: 0.4,
  text: '#FFFFFF',
  pauseBg: 'rgba(255,255,255,0.2)',
};

function build(dark: boolean): Theme {
  const tokens = dark ? darkTokens : lightTokens;
  return {
    dark,
    tokens,
    tone: dark ? darkTones : lightTones,
    focus: focusColors,
    veil: veils,
    anatomy: anatomyColors,
    colors: legacy(tokens),
    space,
    spacing: (n: number) => n * 4,
    radius,
    border: borderWidth,
    type: typeScale,
    font: { display: typeScale.display.fontSize, h1: typeScale.title1.fontSize, h2: typeScale.title2.fontSize, h3: typeScale.title3.fontSize, body: typeScale.body.fontSize, small: typeScale.callout.fontSize, tiny: typeScale.caption.fontSize },
    family: fontFamily,
    shadow: shadows(dark),
    motion,
    touch: 48,
    tile: { sm: 40, lg: 48 },
    iconStroke: 1.75,
  };
}

export const lightTheme: Theme = build(false);
export const darkTheme: Theme = build(true);
