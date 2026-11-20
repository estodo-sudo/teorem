import { useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { ModuleTone } from '@/config/theme';
import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { useTheme } from '../useTheme';
import { Illustration, type IllustrationName } from '../illustrations/Illustration';
import { uiHaptic } from './haptic';
import { IconTile } from './IconTile';
import { ScalePressable } from './pressable';

// ---------------------------------------------------------------- ListRow

/** List row (§5): ≥ 56 px, IconTile 40, title + optional description, ChevronRight. Use inside one Card; separators come from `divider`. */
export function ListItem({ title, description, icon, tone, onPress, right, divider, accessibilityHint }: { title: string; description?: string; icon?: IconName; tone?: ModuleTone; onPress?: () => void; right?: ReactNode; divider?: boolean; accessibilityHint?: string }) {
  const t = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 56, paddingVertical: t.space.sm }}>
      {icon ? <IconTile icon={icon} tone={tone} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        {description ? <AppText variant="footnote" muted>{description}</AppText> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron" size="md" color={t.tokens.subtle} /> : null)}
    </View>
  );
  const sep = divider ? { borderTopWidth: t.border.thin, borderTopColor: t.tokens.border } : null;
  if (!onPress) return <View style={sep}>{body}</View>;
  return (
    <ScalePressable
      onPress={() => {
        uiHaptic('selection');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      accessibilityHint={accessibilityHint}
      style={sep}
    >
      {body}
    </ScalePressable>
  );
}

// ---------------------------------------------------------------- Stats

export interface Stat {
  value: string;
  label: string;
}

/** StatTile row (§5): big tabular number + footnote label, 3–4 side by side in one card. */
export function StatRow({ stats }: { stats: Stat[] }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      {stats.map((s, i) => (
        <View key={s.label} accessible accessibilityLabel={`${s.label}: ${s.value}`} style={{ flex: 1, gap: 2, paddingHorizontal: stats.length > 3 ? t.space.xs : t.space.sm, borderLeftWidth: i === 0 ? 0 : t.border.thin, borderLeftColor: t.tokens.border }}>
          <AppText variant="title2" tabular>
            {s.value}
          </AppText>
          <AppText variant="footnote" muted>
            {s.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- EmptyState

/** Empty state (§5): compact (about 220 px) — small illustration (96 px) or icon + title + one line + optional action. */
export function EmptyState({ icon, illustration, tone = 'kegel', title, description, action }: { icon?: IconName; illustration?: IllustrationName; tone?: ModuleTone; title: string; description?: string; action?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: t.space.sm, paddingVertical: t.space.lg }}>
      {illustration ? <Illustration name={illustration} size={96} tone={tone} /> : icon ? <IconTile icon={icon} tone={tone} size={t.tile.lg + t.space.lg} round /> : null}
      <AppText variant="title3" center>
        {title}
      </AppText>
      {description ? (
        <AppText variant="footnote" muted center>
          {description}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

// ---------------------------------------------------------------- Chip

/** Chip (§5): 36 px, pill; selected = primarySoft + primary text + Check. */
export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName }) {
  const t = useTheme();
  const k = t.tokens;
  const fg = selected ? k.primary : k.foreground;
  return (
    <ScalePressable
      onPress={
        onPress
          ? () => {
              uiHaptic('selection');
              onPress();
            }
          : undefined
      }
      disabled={!onPress}
      accessibilityRole={onPress ? 'checkbox' : 'text'}
      accessibilityState={onPress ? { checked: Boolean(selected) } : undefined}
      accessibilityLabel={label}
      hitSlop={(t.touch - 36) / 2}
      style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: t.space.xs, paddingHorizontal: t.space.md, borderRadius: t.radius.pill, backgroundColor: selected ? k.primarySoft : k.card, borderWidth: t.border.thin, borderColor: selected ? k.primarySoft : k.border }}
    >
      {selected ? <Icon name="check" size="sm" color={fg} /> : icon ? <Icon name={icon} size="sm" color={k.mutedForeground} /> : null}
      <AppText variant="footnote" style={{ color: fg, fontWeight: '500' }}>
        {label}
      </AppText>
    </ScalePressable>
  );
}

// ---------------------------------------------------------------- Slider

/** Slider (§5): thick track, big value label, end labels; a `selection` haptic on every step. Adjustable for screen readers. */
export function Slider({ value, onChange, min = 1, max = 10, label, minLabel, maxLabel }: { value: number | null; onChange: (v: number) => void; min?: number; max?: number; label: string; minLabel?: string; maxLabel?: string }) {
  const t = useTheme();
  const k = t.tokens;
  const [w, setW] = useState(0);
  const thumb = 28;
  // No answer yet: the thumb waits in the middle and the number shows a dash.
  const shown = value ?? Math.round((min + max) / 2);
  const frac = (shown - min) / (max - min);
  const set = (x: number) => {
    if (w <= 0) return;
    const v = Math.round(min + Math.min(1, Math.max(0, (x - thumb / 2) / (w - thumb))) * (max - min));
    if (v !== value) {
      uiHaptic('selection');
      onChange(v);
    }
  };
  return (
    <View style={{ gap: t.space.sm }}>
      <AppText variant="display" tabular center muted={value === null}>
        {value === null ? '–' : value}
      </AppText>
      <View
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => set(e.nativeEvent.locationX)}
        onResponderMove={(e) => set(e.nativeEvent.locationX)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value ?? undefined, text: value === null ? '' : `${value} / ${max}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, shown + (value === null ? 0 : 1)));
          if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(min, shown - (value === null ? 0 : 1)));
        }}
        style={{ height: t.touch, justifyContent: 'center' }}
      >
        <View pointerEvents="none" style={{ height: 10, borderRadius: 5, backgroundColor: k.muted, overflow: 'hidden' }}>
          <View style={{ width: `${value === null ? 0 : frac * 100}%`, height: '100%', backgroundColor: k.primary }} />
        </View>
        <View pointerEvents="none" style={{ position: 'absolute', left: frac * Math.max(0, w - thumb), width: thumb, height: thumb, borderRadius: thumb / 2, backgroundColor: k.card, borderWidth: t.border.thick + 1, borderColor: value === null ? k.subtle : k.primary }} />
      </View>
      {minLabel || maxLabel ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="footnote" muted>
            {minLabel}
          </AppText>
          <AppText variant="footnote" muted>
            {maxLabel}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------- BottomBar

/** The screen's main action (§5): full width, pinned above the safe area, with a 24 px fade into the background. */
export function BottomBar({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const bg = t.tokens.background;
  return (
    <View pointerEvents="box-none" style={[{ position: 'absolute', left: 0, right: 0, bottom: 0 }, style]}>
      <Svg width="100%" height={t.space.xl} pointerEvents="none">
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={bg} stopOpacity={0} />
            <Stop offset="1" stopColor={bg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#fade)" />
      </Svg>
      <View style={{ backgroundColor: bg, paddingHorizontal: t.space.gutter, paddingBottom: Math.max(insets.bottom, t.space.lg), gap: t.space.sm }}>{children}</View>
    </View>
  );
}
