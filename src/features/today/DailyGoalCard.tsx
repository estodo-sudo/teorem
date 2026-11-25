import { useState, type ReactNode } from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme, type IconName } from '@/components';
import { Card, IconTile, ScalePressable } from '@/components/ui';
import { CHALLENGES, NUTRITION_DAYS, NUTRITION_PLAN, type Challenge } from '@/features/content/data';
import { nutritionDayIndex, nutritionTasksForDay } from '@/features/content/daily';
import { strengthTestDue } from '@/features/progress/stats';
import { openGated } from '@/features/purchases/useGate';
import { generateMicroSet } from '@/features/training/generateSession';
import { buildTodaySession } from '@/features/training/service';
import { dayStatus } from '@/features/training/summary';
import { useKegelLock } from '@/features/training/useKegelLock';
import { useSessionStarter } from '@/features/training/useSessionStarter';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useTrainingStore } from '@/stores/trainingStore';

interface Goal {
  id: string;
  title: string;
  icon: IconName;
  done: boolean;
  onPress: () => void;
}

/**
 * "Bugün" — back to the plain task list (user request 2026-11-23): main session, micro set, weekly
 * strength test; ticks come from the real history, tapping an open task starts it. Below it, in its
 * own section, today's food ideas from the 28-day plan — suggestions only, nothing to tick.
 */
export function DailyGoalCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const workouts = useHistoryStore((s) => s.workouts);
  const tests = useHistoryStore((s) => s.strengthTests);
  const today = toDateKey();
  // Same rule as the card, the week and the calendar (summary.dayStatus).
  const status = dayStatus(workouts, today, training.dailyTarget);
  const lock = useKegelLock();
  // Same start as the card's "Başla": the daily contraction cap and the rest lock are checked (2026-11-23).
  const { go, dialog } = useSessionStarter();
  const startMain = () => go(today, buildTodaySession(training, today).contractions);
  const startMicro = () => go('micro', generateMicroSet({ level: training.level, seed: `${today}-micro` }).contractions);
  const testDoneToday = tests.some((x) => x.date === today);

  const goals: Goal[] = [{ id: 'main', icon: 'play', title: tr('today.goals.main'), done: status.mainDone, onPress: startMain }];
  // The second slot: a micro set, or the target reached another way (e.g. two main sessions).
  if (training.dailyTarget > 1) goals.push({ id: 'micro', icon: 'pulse', title: tr('today.goals.micro'), done: status.microDone || status.full, onPress: startMicro });
  // The weekly test stays ticked on the day it was done (it used to vanish from the list).
  if (testDoneToday || strengthTestDue(tests, today)) goals.push({ id: 'test', icon: 'chart', title: tr('today.goals.test'), done: testDoneToday, onPress: () => openGated('strengthTest', '/strength-test') });

  return (
    <>
      <View style={{ gap: t.space.md }}>
        <AppText variant="title2" accessibilityRole="header">
          {tr('today.checklist')}
        </AppText>
        <Card style={{ paddingHorizontal: t.space.lg }}>
          {goals.map((g, i) => (
            <TaskRow
              key={g.id}
              first={i === 0}
              done={g.done}
              title={g.title}
              onPress={g.done || (lock.locked && g.id !== 'test') ? undefined : g.onPress}
              trailing={
                g.done ? null : lock.locked && g.id !== 'test' ? (
                  <AppText variant="footnote" muted tabular>
                    {lock.left}
                  </AppText>
                ) : (
                  <Icon name="chevron" size="md" color={t.tokens.subtle} />
                )
              }
            />
          ))}
        </Card>
        {dialog}
      </View>
      <TodayFoods />
    </>
  );
}

/** Food ideas for today, as its own section under the tasks (user request 2026-11-23): only suggestions — nothing to tick, no categories; "Neden?" opens the reason and its source. */
function TodayFoods() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const startedAt = useProfileStore((s) => s.profile.createdAt);
  const [openId, setOpenId] = useState<string | null>(null);
  const dayIdx = nutritionDayIndex(toDateKey(new Date(startedAt)), toDateKey(), NUTRITION_DAYS);
  const foods = nutritionTasksForDay(NUTRITION_PLAN, CHALLENGES, dayIdx);
  if (!foods.length) return null;
  return (
    <View style={{ gap: t.space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
        <IconTile icon="leaf" tone="campus" />
        <AppText variant="title2" accessibilityRole="header" style={{ flex: 1 }}>
          {tr('today.tasks.foods')}
        </AppText>
      </View>
      <Card style={{ paddingHorizontal: t.space.lg, paddingBottom: t.space.md, gap: t.space.sm }}>
        <View accessibilityRole="list">
          {foods.map((f, i) => (
            <FoodRow key={f.id} food={f} first={i === 0} open={openId === f.id} onWhy={() => setOpenId(openId === f.id ? null : f.id)} />
          ))}
        </View>
        <AppText variant="caption" muted>
          {tr('today.tasks.foodsNote')}
        </AppText>
      </Card>
    </View>
  );
}

function Check({ done }: { done: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: t.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: done ? t.tokens.primary : 'transparent',
        borderWidth: t.border.medium,
        borderColor: done ? t.tokens.primary : t.tokens.subtle,
      }}
    >
      {done ? <Icon name="check" size={14} color={t.tokens.primaryForeground} /> : null}
    </View>
  );
}

/** A task: the tick and title are one button; `aside` (e.g. "Neden?") sits next to it, never inside it. */
function TaskRow({ title, subtitle, done, first, onPress, trailing, aside, expanded }: { title: string; subtitle?: string; done: boolean; first: boolean; onPress?: () => void; trailing?: ReactNode; aside?: ReactNode; expanded?: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm, borderTopWidth: first ? 0 : t.border.thin, borderTopColor: t.tokens.border }}>
      <ScalePressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityState={{ checked: done, disabled: !onPress, ...(expanded === undefined ? {} : { expanded }) }}
        accessibilityLabel={`${title}${done ? `, ${tr('today.goals.doneA11y')}` : ''}`}
        style={{ flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: t.space.md }}
      >
        <Check done={done} />
        <View style={{ flex: 1, gap: 1, paddingVertical: t.space.xs }}>
          <AppText variant="body" style={{ color: done ? t.tokens.mutedForeground : t.tokens.foreground, textDecorationLine: done ? 'line-through' : 'none' }}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="footnote" muted>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {trailing}
      </ScalePressable>
      {aside}
    </View>
  );
}

/** A suggested food: a leaf and the text, tap the row to see why and the source. */
function FoodRow({ food, first, open, onWhy }: { food: Challenge; first: boolean; open: boolean; onWhy: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ borderTopWidth: first ? 0 : t.border.thin, borderTopColor: t.tokens.border }}>
      <ScalePressable
        onPress={onWhy}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={tr('today.challengeWhyA11y', { task: food.text })}
        style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingVertical: t.space.xs }}
      >
        <Icon name="leaf" size="sm" color={t.tokens.primary} />
        <AppText variant="body" style={{ flex: 1 }}>
          {food.text}
        </AppText>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size="sm" color={t.tokens.subtle} />
      </ScalePressable>
      {open ? (
        <View style={{ gap: t.space.xs, padding: t.space.md, marginBottom: t.space.sm, borderRadius: t.radius.md, backgroundColor: t.tokens.muted }}>
          <AppText variant="callout">{food.why}</AppText>
          <ScalePressable
            onPress={() => void Linking.openURL(food.source.url)}
            accessibilityRole="link"
            accessibilityLabel={tr('today.challengeSource', { title: food.source.title })}
            style={{ minHeight: t.touch, justifyContent: 'center' }}
          >
            <AppText variant="footnote" muted style={{ textDecorationLine: 'underline' }}>
              {tr('today.challengeSource', { title: food.source.title })}
            </AppText>
          </ScalePressable>
        </View>
      ) : null}
    </View>
  );
}
