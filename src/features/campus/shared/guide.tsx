import type { IconName } from '@/components/Icon';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme } from '@/components';
import { IconTile } from '@/components/ui';

/** One guide section of a campus: icon, title, summary, numbered sections and "in this step" actions. */
export interface GuideStep {
  id: string;
  icon: IconName;
  title: string;
  summary: string;
  sections: { title: string; text: string }[];
  actions: string[];
}

/** Selectable pill. */
export function Chip({ label, icon, selected, onPress }: { label: string; icon?: IconName; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        minHeight: 44,
        borderRadius: t.radius.pill,
        borderWidth: 2,
        borderColor: selected ? t.colors.primary : t.colors.border,
        backgroundColor: selected ? t.colors.primary : t.colors.surface,
      }}
    >
      {icon ? <Icon name={icon} size="md" /> : null}
      <AppText weight="700" variant="small" color={selected ? t.colors.primaryText : t.colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** One guide section as a readable page: badge, title, numbered sections and "in this step" actions. */
export function GuideStepView({ step, n, total }: { step: GuideStep; n: number; total: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ gap: t.space.lg }}>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: t.space.xs, borderRadius: t.radius.pill, backgroundColor: t.colors.surfaceAlt }}>
        <AppText variant="tiny" weight="800" color={t.colors.primary}>
          {tr('campusShared.guideBadge', { n, total })}
        </AppText>
      </View>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <IconTile icon={step.icon} tone="campus" size="lg" round />
        <AppText variant="h1" center accessibilityRole="header">
          {step.title}
        </AppText>
        <AppText muted center>
          {step.summary}
        </AppText>
      </View>
      {step.sections.map((sec, i) => (
        <View key={sec.title} style={{ flexDirection: 'row', gap: t.space.md }}>
          <View style={{ width: 28, height: 28, borderRadius: t.radius.button, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
            <AppText variant="small" weight="800">
              {i + 1}
            </AppText>
          </View>
          <View style={{ flex: 1, gap: t.space.xs }}>
            <AppText variant="h3" accessibilityRole="header">
              {sec.title}
            </AppText>
            <AppText>{sec.text}</AppText>
          </View>
        </View>
      ))}
      {step.actions.length ? (
        <View style={{ gap: t.space.sm, padding: t.space.lg, borderRadius: t.radius.lg, borderWidth: 2, borderColor: t.colors.primary, backgroundColor: t.colors.surface }}>
          <AppText variant="h3">{tr('campusShared.guideActionsTitle')}</AppText>
          {step.actions.map((a) => (
            <View key={a} style={{ flexDirection: 'row', gap: t.space.sm }}>
              <AppText weight="800" color={t.colors.primary}>
                →
              </AppText>
              <AppText style={{ flex: 1 }}>{a}</AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
