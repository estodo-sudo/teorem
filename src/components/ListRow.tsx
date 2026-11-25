import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { localeOf } from '@/i18n/languages';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import type { ModuleTone } from '@/config/theme';
import { AppText } from './AppText';
import { Dialog } from './Dialog';
import { Icon, type IconName } from './Icon';
import { IconTile } from './ui/IconTile';
import { useTheme } from './useTheme';

interface Props {
  label: string;
  value?: string;
  description?: string;
  icon?: IconName;
  tone?: ModuleTone;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
}

/** Descriptions longer than this (characters) go behind the "?" button. */
export const LONG_DESCRIPTION = 90;

/**
 * Settings / menu row (SPEC_UI_V3 §5 ListRow): ≥ 56 px, a 40 px icon tile, the title with an optional
 * footnote description (two lines at most), an optional value and a subtle chevron. Rows inside one card
 * are separated by hairlines; wrap them in `RowGroup` so the last line is hidden. A long description
 * (over two lines) moves behind a "?" button that opens it in a dialog (§7.8).
 */
export function ListRow({ label, value, description, icon, tone = 'kegel', onPress, right, danger }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [help, setHelp] = useState(false);
  const long = Boolean(description && description.length > LONG_DESCRIPTION);
  const helpButton = long ? (
    <Pressable onPress={() => setHelp(true)} accessibilityRole="button" accessibilityLabel={tr('common.moreInfo', { label })} hitSlop={4} style={{ width: t.touch, height: t.touch, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="help" size="md" color={t.tokens.mutedForeground} />
    </Pressable>
  ) : null;
  const dialog = long ? <Dialog visible={help} title={label} message={description} onDismiss={() => setHelp(false)} actions={[{ label: tr('common.close'), onPress: () => setHelp(false) }]} /> : null;
  const content = (
    <View style={[styles.row, { minHeight: 56, gap: t.space.md, paddingVertical: t.space.sm, borderBottomColor: t.tokens.border }]}>
      {icon ? <IconTile icon={icon} tone={tone} background={danger ? t.tokens.destructiveSoft : undefined} color={danger ? t.tokens.destructive : undefined} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong" color={danger ? t.tokens.destructive : undefined}>
          {label}
        </AppText>
        {description && !long ? (
          <AppText variant="footnote" muted>
            {description}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="callout" muted>
          {value}
        </AppText>
      ) : null}
      {helpButton}
      {right}
      {onPress && !right ? <Icon name="chevron" color={t.tokens.subtle} size="md" /> : null}
      {dialog}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={value ? `${label}, ${value}` : label} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

/** A card of rows: the hairline under the last row is tucked away. */
export function RowGroup({ title, children }: { title?: string; children: ReactNode }) {
  const t = useTheme();
  const { i18n } = useTranslation();
  return (
    <View style={{ gap: t.space.sm }}>
      {title ? (
        <AppText variant="caption" muted style={{ letterSpacing: 0.4, marginLeft: t.space.xs }} accessibilityRole="header">
          {/* Locale-aware capitals (2026-11-24: "ABONELIK" → "ABONELİK"). */}
          {title.toLocaleUpperCase(localeOf(i18n.language))}
        </AppText>
      ) : null}
      <View style={{ borderRadius: t.radius.lg, borderWidth: t.border.thin, borderColor: t.tokens.border, backgroundColor: t.tokens.card, paddingHorizontal: t.space.lg, overflow: 'hidden' }}>
        <View style={{ marginBottom: -StyleSheet.hairlineWidth }}>{children}</View>
      </View>
    </View>
  );
}

interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: IconName;
}

export function SwitchRow({ label, description, value, onChange, icon }: SwitchRowProps) {
  const t = useTheme();
  return (
    <ListRow
      label={label}
      description={description}
      icon={icon}
      right={<Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: t.tokens.primary, false: t.tokens.subtle }} thumbColor={t.tokens.card} />}
    />
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth } });
