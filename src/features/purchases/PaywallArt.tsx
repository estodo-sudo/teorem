import { Image } from 'expo-image';
import { useId, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { appImage } from '@/content/images';

/**
 * Paywall look, v3 (user feedback 2026-11-26: "too obviously AI-made"). Restraint over effects: one
 * brand colour, flat surfaces, a real photo at the top, strong type. No glows, no gradient pills, no
 * rainbow icons, no animated button. The paywall keeps this dark palette in both themes.
 */
export const PW = {
  bg: '#0E1113',
  surface: '#171B1E',
  surfaceSelected: '#10302C',
  border: '#2A3034',
  text: '#F4F6F5',
  muted: '#A3ABAE',
  faint: '#7D8689',
  brand: '#3CC2B1',
  onBrand: '#062521',
  amber: '#F2B24C',
  onAmber: '#2B1B02',
} as const;

/** Photo behind the title (a morning forest path: neutral for everyone); fades into the page. */
export function PaywallPhoto({ height, children }: { height: number; children?: ReactNode }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const photo = appImage('story/smoking/6');
  return (
    <View style={{ height, justifyContent: 'flex-end' }}>
      {photo ? (
        <Image source={photo.image} placeholder={{ blurhash: photo.blurhash }} contentFit="cover" contentPosition={{ top: '58%' }} transition={200} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      ) : null}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id={`fade${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={PW.bg} stopOpacity={0.15} />
            <Stop offset="0.45" stopColor={PW.bg} stopOpacity={0.35} />
            <Stop offset="1" stopColor={PW.bg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#fade${uid})`} />
      </Svg>
      {children}
    </View>
  );
}
