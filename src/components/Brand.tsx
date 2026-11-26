import { Image, Platform, Text, View } from 'react-native';

import { APP_NAME } from '@/config/app';
import { familyFor } from '@/config/theme';

import { AppText } from './AppText';
import { useTheme } from './useTheme';

/**
 * The app's name stands out wherever it appears (user request 2026-11-25: "uygulama isminin geçtiği
 * yerlerde ismi kalın ve diğer metinlerden daha belirgin yaz"): extra bold, in the primary colour.
 */
function useBrandStyle() {
  const t = useTheme();
  const family = familyFor('800');
  return { color: t.tokens.primary, fontFamily: Platform.OS === 'web' ? `${family}, system-ui, sans-serif` : family, letterSpacing: 0.3 };
}

/** Text with every "Phelvik" in it set in the brand style; the rest keeps the surrounding text's style. */
export function Branded({ children }: { children: string }) {
  const style = useBrandStyle();
  if (!children.includes(APP_NAME)) return <>{children}</>;
  const parts = children.split(APP_NAME);
  return (
    <>
      {parts.map((p, i) => (
        <Text key={i}>
          {p}
          {i < parts.length - 1 ? <Text style={style}>{APP_NAME}</Text> : null}
        </Text>
      ))}
    </>
  );
}

/** The name on its own (About, Profile). */
export function BrandName({ variant = 'title2' }: { variant?: 'title1' | 'title2' | 'title3' }) {
  const style = useBrandStyle();
  return (
    <AppText variant={variant} weight="800" style={style} accessibilityRole="header">
      {APP_NAME}
    </AppText>
  );
}

const LOGO = require('../../assets/brand/phelvik-icon-512.png');

/** The logo: the teal P on its black tile (user's logo, 2026-11-25). */
export function AppLogo({ size = 72 }: { size?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, borderRadius: size * 0.24, overflow: 'hidden', backgroundColor: '#000' }}>
      <Image source={LOGO} style={{ width: size, height: size }} />
    </View>
  );
}
