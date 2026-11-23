import { Platform, StyleSheet, Text, useWindowDimensions, type TextProps, type TextStyle } from 'react-native';

import { familyFor } from '@/config/theme';
import { useTheme } from './useTheme';

/** Legacy names map onto the ui-v3 scale: h1 = title1, h2 = title2, h3 = title3, small = callout, tiny = caption. */
type Variant = 'display' | 'title1' | 'title2' | 'title3' | 'body' | 'bodyStrong' | 'callout' | 'footnote' | 'caption' | 'h1' | 'h2' | 'h3' | 'small' | 'tiny';

interface Props extends TextProps {
  variant?: Variant;
  muted?: boolean;
  color?: string;
  weight?: '400' | '500' | '600' | '700' | '800';
  center?: boolean;
  /** Tabular figures for timers and stats. */
  tabular?: boolean;
}

const alias = { h1: 'title1', h2: 'title2', h3: 'title3', small: 'callout', tiny: 'caption' } as const;

/**
 * The only text primitive. Resolves every weight to an embedded Inter face (custom fonts have no
 * synthetic weights on Android), so callers keep writing `fontWeight`.
 */
export function AppText({ variant = 'body', muted, color, weight, center, tabular, style, ...rest }: Props) {
  const t = useTheme();
  const { fontScale } = useWindowDimensions();
  const key = variant in alias ? alias[variant as keyof typeof alias] : (variant as Exclude<Variant, keyof typeof alias>);
  const base = t.type[key];
  const own: TextStyle = StyleSheet.flatten(style) ?? {};
  const flat: TextStyle = {
    color: color ?? (muted ? t.tokens.mutedForeground : t.tokens.foreground),
    fontSize: base.fontSize,
    lineHeight: base.lineHeight,
    fontWeight: weight ?? base.fontWeight,
    textAlign: center ? 'center' : undefined,
    fontVariant: tabular ? ['tabular-nums'] : undefined,
    ...own,
  };
  const { fontWeight, ...resolved } = flat;
  // A style that changes fontSize without a lineHeight keeps the variant's ratio instead of clipping.
  if (flat.fontSize !== base.fontSize && !own.lineHeight) {
    resolved.lineHeight = Math.round((flat.fontSize ?? base.fontSize) * (base.lineHeight / base.fontSize));
  }
  const family = resolved.fontFamily ?? familyFor(fontWeight);
  // Web preview only: a sans-serif fallback while the bundled faces load (native waits for them).
  const fontFamily = Platform.OS === 'web' ? `${family}, system-ui, sans-serif` : family;
  const size = resolved.fontSize ?? base.fontSize;
  // The phone's text size setting is followed within limits (user request 2026-11-22: "devasa veya
  // küçücük"): never below MIN_SCALE, and big text grows less than small text.
  const lift = fontScale < MIN_SCALE ? MIN_SCALE / fontScale : 1;
  if (lift !== 1) {
    resolved.fontSize = size * lift;
    if (resolved.lineHeight) resolved.lineHeight = resolved.lineHeight * lift;
  }
  return <Text maxFontSizeMultiplier={maxScaleFor(size)} style={{ ...resolved, fontFamily }} {...rest} />;
}

/** The smallest text scale we allow when the phone's setting is smaller. */
export const MIN_SCALE = 0.9;

/** How much a size may grow with the phone's setting: headings little, small text more (stays readable, layouts hold). */
export function maxScaleFor(fontSize: number): number {
  if (fontSize >= 28) return 1.15;
  if (fontSize >= 17) return 1.25;
  if (fontSize >= 14) return 1.3;
  return 1.4;
}
