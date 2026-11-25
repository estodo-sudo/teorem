import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/components';
import type { AppImage } from '@/content/images';

/**
 * Standard photo space of the Günüm photo cards (2026-11-23: "görsel çok uzun", was 150): the same
 * height on the workout and Kasık Fitness cards, so both cards keep one size (64 after the second "kısalt"; 170 since "biraz daha büyült"; it grew after the summary line moved
 * up next to the day, so the cards keep the size they had then).
 */
export const PHOTO_SPACE = 170;

/**
 * Photo background for the Günüm cards (user request 2026-11-23): the image fills the card (its top edge and bottom
 * part carry a smooth, progressive blur baked into the file itself) and only a light shade is laid on top
 * (the blur, not darkness, keeps the white text readable). `id` keeps the SVG gradient
 * unique when several cards are on one screen.
 */
export function PhotoBackground({ image, id, position = 'top', textAt = 'both' }: { image: AppImage; id: string; position?: 'top' | 'center'; /** 'bottom': no title on top, so the top stays clear. */ textAt?: 'both' | 'bottom' }) {
  const t = useTheme();
  return (
    <>
      <Image
        source={image.image}
        placeholder={{ blurhash: image.blurhash }}
        contentFit="cover"
        contentPosition={position}
        transition={200}
        style={StyleSheet.absoluteFill}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            {/* A light shade only (2026-11-23: "blur yerine karartma"): the blur baked into the photo does the work. */}
            <Stop offset="0" stopColor={t.focus.black} stopOpacity={textAt === 'bottom' ? 0.12 : 0.32} />
            <Stop offset="0.26" stopColor={t.focus.black} stopOpacity={textAt === 'bottom' ? 0.04 : 0.08} />
            <Stop offset="0.5" stopColor={t.focus.black} stopOpacity={0} />
            <Stop offset="0.78" stopColor={t.focus.black} stopOpacity={0.16} />
            <Stop offset="1" stopColor={t.focus.black} stopOpacity={0.3} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </>
  );
}
