import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Icon, Screen, useTheme } from '@/components';
import { ODAK_ONBOARDING as ONB, ODAK_SKILLS } from '@/features/camps/odak/content';
import { programStart } from '@/features/camps/odak/engine/checkin';
import { ODAK_PHASE_ORDER, odakPhase } from '@/features/camps/odak/engine/phase';
import { lessonOfDay, lessonOpen, lessonOrder, MORAL_HIGH } from '@/features/camps/odak/engine/program';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { lessonIsFree } from '@/features/camps/odak/engine/premium';
import { useAccess } from '@/features/purchases/useGate';
import { goBack } from '@/lib/nav';

/** Skill lessons (ACT + CBT + mindfulness), in recommended order; later phases' lessons open with their phase. */
export default function OdakSkills() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { goal, profile, skillsDone } = useOdakStore();
  const premium = useAccess()('odak');
  const phase = goal ? odakPhase(programStart(goal), new Date()) : 'awareness';
  const done = skillsDone.map((s) => s.id);
  const next = lessonOfDay(ODAK_SKILLS, profile, done, phase);
  const moralHigh = (profile?.moralIncongruence ?? 0) >= MORAL_HIGH;

  return (
    <Screen>
      <Header title={tr('odak.skills.title')} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <AppText muted>{tr('odak.skills.intro', { done: done.filter((id) => ODAK_SKILLS.some((l) => l.id === id)).length, total: ODAK_SKILLS.length })}</AppText>
      {lessonOrder(ODAK_SKILLS, profile).map((l) => {
        const open = (lessonOpen(l, phase) || (l.bonus && moralHigh)) && (premium || lessonIsFree(l));
        const isDone = done.includes(l.id);
        const phaseName = ONB.summary.phases[ODAK_PHASE_ORDER.indexOf(l.phase)]?.name ?? '';
        return (
          <Card
            key={l.id}
            onPress={open ? () => router.push({ pathname: '/odak/skills/[lessonId]', params: { lessonId: l.id } }) : undefined}
            accessibilityLabel={`${l.title}. ${isDone ? tr('odak.skills.done') : open ? tr('odak.skills.minutes', { count: l.minutes }) : tr('odak.skills.upcoming', { phase: phaseName })}`}
            style={{ flexDirection: 'row', gap: 12, alignItems: 'center', opacity: open ? 1 : 0.55, borderColor: next?.id === l.id ? t.colors.accent : t.colors.border, borderWidth: next?.id === l.id ? 2 : 1 }}
          >
            <AppText variant="h1">{l.emoji}</AppText>
            <View style={{ flex: 1, gap: 2 }}>
              {next?.id === l.id ? (
                <AppText variant="tiny" weight="800" color={t.colors.accent}>
                  {tr('odak.skills.next')}
                </AppText>
              ) : null}
              <AppText weight="800">{l.title}</AppText>
              <AppText variant="small" muted>
                {isDone ? `✓ ${tr('odak.skills.done')}` : open ? `${l.summary} · ${tr('odak.skills.minutes', { count: l.minutes })}` : tr('odak.skills.upcoming', { phase: phaseName })}
              </AppText>
            </View>
            <Icon name={open ? 'chevron' : 'lock'} color={t.colors.textMuted} size={18} />
          </Card>
        );
      })}
    </Screen>
  );
}
