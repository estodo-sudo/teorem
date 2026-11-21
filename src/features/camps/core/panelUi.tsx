import type { IconName } from '@/components/Icon';
import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme } from '@/components';
import { Card, IconTile } from '@/components/ui';
import { mixHex } from '@/components/ui/urgeGaugeLogic';
import type { ModuleTone } from '@/config/theme';

/**
 * Building blocks of the camp home pages (SPEC_V4 §C.6, §D.1): five layers with one job each and a
 * single filled button — hero, "Bugün", one situational card, an 8-tile tool grid, the support line.
 * Shared by Sigarasız Kamp and Odak Kampı; `tone` picks the camp colour.
 */

/** Hero card: dark gradient in the camp tone, radius 24, padding 20. */
export function PanelHero({ tone, children }: { tone: ModuleTone; children: ReactNode }) {
  const t = useTheme();
  const fg = t.tone[tone].fg;
  const id = `hero-${tone}`;
  return (
    <View style={{ borderRadius: t.radius.xl, overflow: 'hidden', padding: 20, gap: t.space.md }}>
      <Svg width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={mixHex(fg, t.focus.black, 0.25)} />
            <Stop offset="1" stopColor={mixHex(fg, t.focus.black, 0.62)} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}

export function HeroChip({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: t.radius.pill, backgroundColor: t.veil.mid }}>
      <AppText variant="footnote" weight="600" color={t.focus.text}>
        {label}
      </AppText>
    </View>
  );
}

export function HeroTitle({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <AppText variant="title1" tabular color={t.focus.text} style={{ fontSize: 30, lineHeight: 36 }} accessibilityRole="header">
      {children}
    </AppText>
  );
}

/** Three small stats under the counter, with thin dividers. */
export function MiniStats({ items }: { items: { value: string; label: string; onPress?: () => void }[] }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', paddingVertical: t.space.xs }}>
      {items.map((x, i) => (
        <View key={x.label} style={{ flex: 1, flexDirection: 'row' }}>
          {i > 0 ? <View style={{ width: 1, backgroundColor: t.veil.bold, opacity: 0.6 }} /> : null}
          <MiniStat {...x} />
        </View>
      ))}
    </View>
  );
}

function MiniStat({ value, label, onPress }: { value: string; label: string; onPress?: () => void }) {
  const t = useTheme();
  const body = (
    <View style={{ gap: 2 }}>
      <AppText variant="bodyStrong" tabular color={t.focus.text}>
        {value}
      </AppText>
      <AppText variant="footnote" color={t.focus.icon}>
        {label}
      </AppText>
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} style={{ flex: 1, paddingHorizontal: t.space.sm }}>
      {body}
    </Pressable>
  ) : (
    <View style={{ flex: 1, paddingHorizontal: t.space.sm }} accessible accessibilityLabel={`${label}: ${value}`}>
      {body}
    </View>
  );
}

/** The one filled button of the page: light on the dark hero, ink in the camp tone. */
export function HeroButton({ tone, icon, label, hint, onPress }: { tone: ModuleTone; icon: IconName; label: string; hint?: string; onPress: () => void }) {
  const t = useTheme();
  const ink = mixHex(t.tone[tone].fg, t.focus.black, 0.55);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={hint}
      style={({ pressed }) => ({ minHeight: 56, borderRadius: t.radius.button, backgroundColor: t.focus.text, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: t.space.sm, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
    >
      <Icon name={icon} size={20} color={ink} />
      <AppText variant="bodyStrong" color={ink}>
        {label}
      </AppText>
    </Pressable>
  );
}

export interface TaskRow {
  key: string;
  icon: IconName;
  title: string;
  sub: string;
  done: boolean;
  locked?: boolean;
  /** A small text action on the right instead of the chevron (e.g. "Kaydet"). */
  action?: string;
  /** Not counted in "Bugün n/m tamam" (e.g. "Bir davranış kaydet"). */
  extra?: boolean;
  onPress: () => void;
}

/** "Bugün": one card of task rows with a completion ring each, and "Bugün n/m tamam" above it. */
export function TodayCard({ title, rows }: { title: string; rows: TaskRow[] }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const counted = rows.filter((r) => !r.extra);
  return (
    <View style={{ gap: t.space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <AppText variant="title3" accessibilityRole="header" style={{ flex: 1 }}>
          {title}
        </AppText>
        <AppText variant="footnote" muted tabular>
          {tr('camp.home2.todayDone', { done: counted.filter((r) => r.done).length, total: counted.length })}
        </AppText>
      </View>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {rows.map((x, i) => (
          <TaskLine key={x.key} row={x} first={i === 0} />
        ))}
      </Card>
    </View>
  );
}

function TaskLine({ row, first }: { row: TaskRow; first: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Pressable
      onPress={row.onPress}
      accessibilityRole="button"
      accessibilityLabel={`${row.title}, ${row.sub}${row.done ? `, ${tr('camp.home2.doneA11y')}` : ''}${row.locked ? `, ${tr('camp.home2.lockedA11y')}` : ''}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 64, paddingHorizontal: t.space.lg, paddingVertical: t.space.md, borderTopWidth: first ? 0 : 1, borderTopColor: t.tokens.border, backgroundColor: pressed ? t.tokens.muted : 'transparent' })}
    >
      <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: row.extra ? 0 : 2, borderColor: row.done ? t.tokens.primary : t.tokens.border, backgroundColor: row.done ? t.tokens.primary : row.extra ? t.tokens.muted : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {row.done ? <Icon name="check" size={16} color={t.tokens.primaryForeground} strokeWidth={3} /> : <Icon name={row.icon} size={14} color={t.tokens.mutedForeground} />}
      </View>
      <View style={{ flex: 1, gap: 1, opacity: row.done ? 0.6 : 1 }}>
        <AppText variant="callout" weight="600">
          {row.title}
        </AppText>
        <AppText variant="footnote" muted numberOfLines={2}>
          {row.sub}
        </AppText>
      </View>
      {row.locked ? <Icon name="lock" size={16} color={t.tokens.mutedForeground} /> : null}
      {row.action ? (
        <AppText variant="callout" weight="600" color={t.tokens.primary}>
          {row.action}
        </AppText>
      ) : (
        <Icon name="chevron" size="sm" color={t.tokens.subtle} />
      )}
    </Pressable>
  );
}

/** The one situational card (layer 4): the only place a pastel fill is allowed. */
export function PastelCard({ tone, icon, title, text, onPress, extra }: { tone: ModuleTone; icon: IconName; title: string; text?: string | null; onPress?: () => void; extra?: ReactNode }) {
  const t = useTheme();
  const body = (
    <View style={{ backgroundColor: t.tone[tone].soft, borderRadius: t.radius.lg, padding: t.space.lg, gap: t.space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
        <IconTile icon={icon} tone={tone} size="lg" round />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong">{title}</AppText>
          {text ? (
            <AppText variant="footnote" muted>
              {text}
            </AppText>
          ) : null}
        </View>
        {onPress ? <Icon name="chevron" size="sm" color={t.tokens.subtle} /> : null}
      </View>
      {extra}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={text ? `${title}. ${text}` : title}>
      {body}
    </Pressable>
  ) : (
    <View accessible accessibilityLabel={text ? `${title}. ${text}` : title}>
      {body}
    </View>
  );
}

export interface ToolTile {
  icon: IconName;
  title: string;
  sub?: string;
  route: Href;
}

/** Layer 5: a two-column grid of tool tiles (height 88, icon tile and name, a small counter if any). */
export function ToolGrid({ tone, title, tools }: { tone: ModuleTone; title: string; tools: ToolTile[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space.sm }}>
      <AppText variant="title3" accessibilityRole="header">
        {title}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
        {tools.map((x) => (
          <Pressable
            key={x.title}
            onPress={() => router.push(x.route)}
            accessibilityRole="button"
            accessibilityLabel={x.sub ? `${x.title}, ${x.sub}` : x.title}
            style={({ pressed }) => ({ minHeight: 88, flexGrow: 1, flexBasis: '45%', flexDirection: 'row', alignItems: 'center', backgroundColor: t.tokens.card, borderColor: t.tokens.border, borderWidth: 1, borderRadius: t.radius.lg, padding: t.space.md, gap: t.space.sm, transform: [{ scale: pressed ? 0.98 : 1 }] })}
          >
            <IconTile icon={x.icon} tone={tone} size="sm" />
            <View style={{ gap: 1, flex: 1 }}>
              <AppText variant="callout" weight="600">
                {x.title}
              </AppText>
              {x.sub ? (
                <AppText variant="footnote" muted tabular>
                  {x.sub}
                </AppText>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** The support line: one card split into two halves. */
export function SupportRow({ items }: { items: { icon: IconName; title: string; sub: string; onPress: () => void }[] }) {
  const t = useTheme();
  return (
    <Card style={{ padding: 0, flexDirection: 'row', overflow: 'hidden' }}>
      {items.map((x, i) => (
        <View key={x.title} style={{ flex: 1, flexDirection: 'row' }}>
          {i > 0 ? <View style={{ width: 1, backgroundColor: t.tokens.border }} /> : null}
          <Pressable onPress={x.onPress} accessibilityRole="button" accessibilityLabel={`${x.title}, ${x.sub}`} style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.space.sm, padding: t.space.md, minHeight: 64, backgroundColor: pressed ? t.tokens.muted : 'transparent' })}>
            <Icon name={x.icon} size={20} color={t.tokens.primary} />
            <View style={{ flex: 1 }}>
              <AppText variant="callout" weight="600">
                {x.title}
              </AppText>
              <AppText variant="footnote" muted>
                {x.sub}
              </AppText>
            </View>
          </Pressable>
        </View>
      ))}
    </Card>
  );
}
