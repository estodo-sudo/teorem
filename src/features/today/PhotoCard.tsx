import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/components';
import type { AppImage } from '@/content/images';

/**
 * Photo background for the Günüm cards (user request 2026-11-23): the image fills the card (its bottom
 * part is blurred in the file itself) and a dark veil keeps the white text readable in both themes —
 * a little at the top for the title, more at the bottom for the actions. `id` keeps the SVG gradient
 * unique when several cards are on one screen.
 */
export function PhotoBackground({ image, id, position = 'top', textAt = 'both' }: { image: AppImage; id: string; position?: 'top' | 'center'; /** 'bottom': no title on top, so the top stays clear. */ textAt?: 'both' | 'bottom' }) {
  const t = useTheme();
  return (
    <>
      <Image source={image.image} placeholder={{ blurhash: image.blurhash }} contentFit="cover" contentPosition={position} transition={200} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.focus.black} stopOpacity={textAt === 'bottom' ? 0.05 : 0.55} />
            <Stop offset="0.28" stopColor={t.focus.black} stopOpacity={textAt === 'bottom' ? 0.05 : 0.12} />
            <Stop offset={textAt === 'bottom' ? '0.42' : '0.5'} stopColor={t.focus.black} stopOpacity={0.1} />
            <Stop offset={textAt === 'bottom' ? '0.62' : '0.72'} stopColor={t.focus.black} stopOpacity={textAt === 'bottom' ? 0.62 : 0.55} />
            <Stop offset="1" stopColor={t.focus.black} stopOpacity={0.82} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </>
  );
}
