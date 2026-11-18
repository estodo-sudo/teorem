import { useState, type ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { AppText, Icon, useTheme } from '@/components';

/** 8-digit hex with alpha for soft tinted backgrounds (falls back to the colour as is). */
export const tint = (hex: string, alpha = '1F') => (/^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex);

/** Campus hero: a coloured card with two soft decorative circles behind its content. */
export function CampusHero({ color, children, style }: { color: string; children: ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[{ borderRadius: t.radius.xl, backgroundColor: color, padding: 20, gap: 16, overflow: 'hidden' }, style]}>
      <View pointerEvents="none" style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -70, top: -90, backgroundColor: 'rgba(255,255,255,0.08)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', width: 140, height: 140, borderRadius: 70, left: -50, bottom: -70, backgroundColor: 'rgba(255,255,255,0.06)' }} />
      {children}
    </View>
  );
}

/** Small stat inside a hero: value over label, on a translucent tile. */
export function HeroStat({ label, value, color }: { label: string; value: string; color: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, gap: 2, paddingVertical: 10, paddingHorizontal: 10, borderRadius: t.radius.md, backgroundColor: 'rgba(255,255,255,0.12)' }} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="h3" weight="800" color={color} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="tiny" color={color} style={{ opacity: 0.85 }} numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

/** Section heading with an emoji badge and optional hint. */
export function SectionTitle({ emoji, title, hint, right }: { emoji: string; title: string; hint?: string; right?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: tint(t.colors.primary, '26'), alignItems: 'center', justifyContent: 'center' }}>
        <AppText>{emoji}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="h3" accessibilityRole="header">
          {title}
        </AppText>
        {hint ? (
          <AppText variant="small" muted>
            {hint}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Rounded group of rows separated by hairlines (lists of plans, help, etc.). */
export function GroupCard({ children }: { children: ReactNode[] }) {
  const t = useTheme();
  const items = children.filter(Boolean);
  return (
    <View style={{ borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surface, overflow: 'hidden' }}>
      {items.map((c, i) => (
        <View key={i} style={{ padding: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: t.colors.border }}>
          {c}
        </View>
      ))}
    </View>
  );
}

/** "ℹ️ Bu ne demek?" style toggle: a short title that opens a plain explanation in place. `light` is for use on a coloured hero. */
export function InfoToggle({ title, text, light }: { title: string; text: string; light?: boolean }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const fg = light ? '#FFFFFF' : t.colors.primary;
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        hitSlop={6}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 32 }}
      >
        <AppText variant="small">ℹ️</AppText>
        <AppText variant="small" weight="800" color={fg} style={{ opacity: light ? 0.95 : 1 }}>
          {title}
        </AppText>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="chevron" color={fg} size={14} />
        </View>
      </Pressable>
      {open ? (
        <View style={{ padding: 12, borderRadius: t.radius.md, backgroundColor: light ? 'rgba(255,255,255,0.14)' : tint(t.colors.primary, '14') }}>
          <AppText variant="small" color={light ? '#FFFFFF' : t.colors.text}>
            {text}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
