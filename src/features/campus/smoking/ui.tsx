import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Dialog, Icon, ProgressRing, useTheme } from '@/components';
import { useCampusStore } from '@/stores/campusStore';

import { SMOKING, type SmokingStep } from './content';
import { nextSlipEndsAttempt, prepProgress } from './logic';

/** Small stat tile used in the smoke-free hero card. */
export function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="h3" weight="800" color={color} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="tiny" color={color} style={{ opacity: 0.8 }} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

/** Selectable pill. */
export function Chip({ label, emoji, selected, onPress }: { label: string; emoji?: string; selected: boolean; onPress: () => void }) {
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
      {emoji ? <AppText>{emoji}</AppText> : null}
      <AppText weight="700" variant="small" color={selected ? t.colors.primaryText : t.colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

/**
 * "I smoked" dialog. The first slip of an attempt is logged and the counter goes on;
 * a second one is confirmed first and then ends the attempt (counter restarts).
 */
export function SlipDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t: tr } = useTranslation();
  const smoking = useCampusStore((s) => s.smoking);
  const [endedAttempt, setEndedAttempt] = useState<number | null>(null);
  // Reset only when the dialog opens again, so its content does not change while it fades out.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setEndedAttempt(null);
  }
  const close = onClose;
  const helpPhone = SMOKING.help.find((h) => h.phone)?.phone ?? null;
  const log = () => {
    const { restarted } = useCampusStore.getState().logSlip();
    if (restarted) setEndedAttempt(useCampusStore.getState().smoking.attempt);
    else close();
  };

  if (endedAttempt !== null) {
    return (
      <Dialog
        visible={visible}
        title={tr('smoking.slip.endedTitle')}
        message={tr('smoking.slip.endedBody', { count: endedAttempt })}
        onDismiss={close}
        actions={[
          { label: tr('smoking.slip.endedOk'), variant: 'primary', onPress: close },
          ...(helpPhone ? [{ label: tr('smoking.home.call', { phone: helpPhone }), variant: 'secondary' as const, onPress: () => void Linking.openURL(`tel:${helpPhone}`) }] : []),
        ]}
      />
    );
  }
  if (nextSlipEndsAttempt(smoking)) {
    return (
      <Dialog
        visible={visible}
        title={tr('smoking.slip.secondTitle')}
        message={tr('smoking.slip.secondBody')}
        onDismiss={close}
        actions={[
          { label: tr('smoking.slip.secondYes'), variant: 'danger', onPress: log },
          { label: tr('smoking.slip.secondNo'), variant: 'ghost', onPress: close },
        ]}
      />
    );
  }
  return (
    <Dialog
      visible={visible}
      title={tr('smoking.slip.title')}
      onDismiss={close}
      actions={[
        { label: tr('smoking.slip.save'), variant: 'primary', onPress: log },
        { label: tr('common.cancel'), variant: 'ghost', onPress: close },
      ]}
    >
      <View style={{ gap: 8 }}>
        {SMOKING.slip.map((line) => (
          <AppText key={line} variant="small">
            {line}
          </AppText>
        ))}
      </View>
    </Dialog>
  );
}

/** One guide section as a readable page: badge, title, numbered sections and "in this step" actions. */
export function GuideStepView({ step, n, total }: { step: SmokingStep; n: number; total: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ gap: 16 }}>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: t.radius.pill, backgroundColor: t.colors.surfaceAlt }}>
        <AppText variant="tiny" weight="800" color={t.colors.primary}>
          {tr('smoking.guide.badge', { n, total })}
        </AppText>
      </View>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <AppText variant="display">{step.emoji}</AppText>
        <AppText variant="h1" center accessibilityRole="header">
          {step.title}
        </AppText>
        <AppText muted center>
          {step.summary}
        </AppText>
      </View>
      {step.sections.map((sec, i) => (
        <View key={sec.title} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
            <AppText variant="small" weight="800">
              {i + 1}
            </AppText>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="h3" accessibilityRole="header">
              {sec.title}
            </AppText>
            <AppText>{sec.text}</AppText>
          </View>
        </View>
      ))}
      {step.actions.length ? (
        <View style={{ gap: 8, padding: 16, borderRadius: t.radius.lg, borderWidth: 2, borderColor: t.colors.primary, backgroundColor: t.colors.surface }}>
          <AppText variant="h3">{tr('smoking.guide.actionsTitle')}</AppText>
          {step.actions.map((a) => (
            <View key={a} style={{ flexDirection: 'row', gap: 8 }}>
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

/** Preparation checklist: progress ring header and large tappable items (enrolment page and campus home). */
export function PrepChecklist({ doneIds, onToggle, title, subtitle }: { doneIds: string[]; onToggle: (id: string) => void; title: string; subtitle?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { done, total, complete } = prepProgress(SMOKING.prep.map((p) => p.id), doneIds);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <ProgressRing size={72} stroke={8} value={total ? done / total : 0} color={complete ? t.colors.success : t.colors.accent}>
          <AppText weight="800">{tr('smoking.prep.ring', { done, total })}</AppText>
        </ProgressRing>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="h3" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="small" muted>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      {SMOKING.prep.map((p) => {
        const checked = doneIds.includes(p.id);
        return (
          <Pressable
            key={p.id}
            onPress={() => onToggle(p.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel={`${p.text}. ${p.detail}`}
            style={{
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
              padding: 14,
              minHeight: t.touch,
              borderRadius: t.radius.lg,
              borderWidth: 2,
              borderColor: checked ? t.colors.success : t.colors.border,
              backgroundColor: t.colors.surface,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: checked ? t.colors.success : t.colors.textMuted,
                backgroundColor: checked ? t.colors.success : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {checked ? <Icon name="check" color="#FFFFFF" size={18} strokeWidth={3} /> : null}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText weight="700">{p.text}</AppText>
              <AppText variant="small" muted>
                {p.detail}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
