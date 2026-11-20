import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme, type IconName } from '@/components';
import { Card, ScalePressable } from '@/components/ui';
import { strengthTestDue } from '@/features/progress/stats';
import { openGated } from '@/features/purchases/useGate';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useTrainingStore } from '@/stores/trainingStore';

interface Goal {
  id: string;
  title: string;
  icon: IconName;
  done: boolean;
  onPress: () => void;
}

/**
 * "Bugün" checklist — ui-v3 (SPEC_UI_V3 §7.1.3): compact rows for the main session, the micro set and
 * the weekly strength test. Ticks come from the real state; tapping an open item starts it.
 */
export function DailyGoalCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const workouts = useHistoryStore((s) => s.workouts);
  const tests = useHistoryStore((s) => s.strengthTests);
  const today = toDateKey();
  const todays = workouts.filter((w) => w.date === today && w.completed);
  const mainDone = todays.some((w) => !w.isMicro);
  const microDone = todays.some((w) => w.isMicro);

  const goals: Goal[] = [{ id: 'main', icon: 'play', title: tr('today.goals.main'), done: mainDone, onPress: () => openGated('workout', { pathname: '/workout/[sessionId]', params: { sessionId: today } }) }];
  if (training.dailyTarget > 1) goals.push({ id: 'micro', icon: 'pulse', title: tr('today.goals.micro'), done: microDone, onPress: () => openGated('workout', { pathname: '/workout/[sessionId]', params: { sessionId: 'micro' } }) });
  if (strengthTestDue(tests, today)) goals.push({ id: 'test', icon: 'chart', title: tr('today.goals.test'), done: false, onPress: () => openGated('strengthTest', '/strength-test') });

  return (
    <View style={{ gap: t.space.md }}>
      <AppText variant="title2" accessibilityRole="header">
        {tr('today.checklist')}
      </AppText>
      <Card style={{ paddingHorizontal: t.space.lg }}>
        {goals.map((g, i) => (
          <ScalePressable
            key={g.id}
            onPress={g.done ? undefined : g.onPress}
            disabled={g.done}
            accessibilityRole="button"
            accessibilityState={{ checked: g.done, disabled: g.done }}
            accessibilityLabel={`${g.title}${g.done ? `, ${tr('today.goals.doneA11y')}` : ''}`}
            style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: t.space.md, borderTopWidth: i ? t.border.thin : 0, borderTopColor: t.tokens.border }}
          >
            <View style={{ width: 24, height: 24, borderRadius: t.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: g.done ? t.tokens.primary : 'transparent', borderWidth: t.border.medium, borderColor: g.done ? t.tokens.primary : t.tokens.subtle }}>
              {g.done ? <Icon name="check" size={14} color={t.tokens.primaryForeground} /> : null}
            </View>
            <AppText variant="body" style={{ flex: 1, color: g.done ? t.tokens.mutedForeground : t.tokens.foreground }}>
              {g.title}
            </AppText>
            {!g.done ? <Icon name="chevron" size="md" color={t.tokens.subtle} /> : null}
          </ScalePressable>
        ))}
      </Card>
    </View>
  );
}
