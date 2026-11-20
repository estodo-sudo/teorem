import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

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
  return <Text maxFontSizeMultiplier={key === 'display' ? 1.4 : 1.8} style={{ ...resolved, fontFamily }} {...rest} />;
}
