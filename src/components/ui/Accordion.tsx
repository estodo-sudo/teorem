import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { useTheme } from '../useTheme';
import { ScalePressable } from './pressable';

/**
 * Accordion card — ui-v2, after the 21st "Accordion Card" (arihantcodes): every item sits in its own
 * bordered, rounded panel; the header (icon, title, optional subtitle) toggles the body. Closed by default.
 */
export function AccordionCard({ title, subtitle, icon, iconColor, children, defaultOpen = false }: { title: string; subtitle?: string; icon?: IconName; iconColor?: string; children: ReactNode; defaultOpen?: boolean }) {
  const t = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={{ borderRadius: t.radius.lg, borderWidth: t.border.thin, borderColor: open ? t.tokens.ring : t.tokens.border, backgroundColor: t.tokens.card, overflow: 'hidden' }}>
      <ScalePressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        style={{ minHeight: t.touch + t.space.sm, flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingHorizontal: t.space.lg, paddingVertical: t.space.md }}
      >
        {icon ? (
          <View style={{ width: 36, height: 36, borderRadius: t.radius.pill, backgroundColor: t.tokens.muted, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size="md" color={iconColor ?? t.tokens.primary} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <AppText style={{ ...t.type.body, fontWeight: '700', color: t.tokens.cardForeground }}>{title}</AppText>
          {subtitle ? <AppText style={{ ...t.type.small, color: t.tokens.mutedForeground }}>{subtitle}</AppText> : null}
        </View>
        <Icon name={open ? 'minus' : 'plus'} size="md" color={t.tokens.mutedForeground} />
      </ScalePressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(t.motion.normal).reduceMotion(ReduceMotion.System)} style={{ paddingHorizontal: t.space.lg, paddingBottom: t.space.lg, gap: t.space.sm }}>
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}
