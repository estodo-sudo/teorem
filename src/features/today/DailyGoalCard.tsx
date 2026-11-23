import { useState, type ReactNode } from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, ProgressBar, useTheme, type IconName } from '@/components';
import { Card, ScalePressable } from '@/components/ui';
import { CHALLENGES, NUTRITION_DAYS, NUTRITION_PLAN, type Challenge } from '@/features/content/data';
import { nutritionDayIndex, nutritionTasksForDay } from '@/features/content/daily';
import { strengthTestDue } from '@/features/progress/stats';
import { openGated } from '@/features/purchases/useGate';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useProgressStore } from '@/stores/progressStore';
import type { ChallengeCategory } from '@/types';

interface Goal {
  id: string;
  title: string;
  icon: IconName;
  done: boolean;
  onPress: () => void;
}

const FOOD_ICON: Record<ChallengeCategory, IconName> = { snack: 'leaf', fruit: 'sun', plate: 'layers' };

/**
 * "Bugün" — the day's tasks in one card (user request 2026-11-23): a progress line for everything, the
 * training tasks (main session, micro set, weekly strength test) and today's 3 foods from the 28-day
 * nutrition plan, which can now be ticked too. Training ticks come from the real history; food ticks are
 * stored per day (progress store `challengeLogs`). "Neden?" opens the reason and its source.
 */
export function DailyGoalCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const workouts = useHistoryStore((s) => s.workouts);
  const tests = useHistoryStore((s) => s.strengthTests);
  const startedAt = useProfileStore((s) => s.profile.createdAt);
  const logs = useProgressStore((s) => s.challengeLogs);
  const setLog = useProgressStore((s) => s.setChallengeLog);
  const [openId, setOpenId] = useState<string | null>(null);
  const [foodsOpen, setFoodsOpen] = useState(false);
  const today = toDateKey();
  const todays = workouts.filter((w) => w.date === today && w.completed);
  const mainDone = todays.some((w) => !w.isMicro);

  const goals: Goal[] = [{ id: 'main', icon: 'play', title: tr('today.goals.main'), done: mainDone, onPress: () => openGated('workout', { pathname: '/workout/[sessionId]', params: { sessionId: today } }) }];
  // The micro set is no longer a task here (2026-11-23); it stays on the workout card.
  const testDue = strengthTestDue(tests, today);

  const dayIdx = nutritionDayIndex(toDateKey(new Date(startedAt)), today, NUTRITION_DAYS);
  const foods = nutritionTasksForDay(NUTRITION_PLAN, CHALLENGES, dayIdx);
  const eaten = logs[today]?.completedIds ?? [];
  const toggleFood = (id: string) => {
    const next = eaten.includes(id) ? eaten.filter((x) => x !== id) : [...eaten, id];
    setLog({ date: today, challengeIds: foods.map((f) => f.id), completedIds: next });
  };

  const eatenCount = foods.filter((f) => eaten.includes(f.id)).length;
  const foodsDone = foods.length > 0 && eatenCount === foods.length;
  // Tasks: the main session, today's foods (one task, done when all three are ticked), the test when due.
  const total = 1 + (foods.length ? 1 : 0) + (testDue ? 1 : 0);
  const done = (mainDone ? 1 : 0) + (foodsDone ? 1 : 0);

  return (
    <View style={{ gap: t.space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <AppText variant="title2" accessibilityRole="header">
          {tr('today.checklist')}
        </AppText>
        <AppText variant="callout" weight="600" tabular color={done === total ? t.tokens.primary : t.tokens.mutedForeground}>
          {tr('today.tasks.count', { done, total })}
        </AppText>
      </View>
      <Card style={{ padding: t.space.lg, gap: t.space.md }}>
        <ProgressBar value={total ? done / total : 0} height={6} accessibilityLabel={tr('today.tasks.progressA11y', { done, total })} />

        {/* Order (2026-11-23): main session, today's foods as a drawer (in the micro set's place), the test. */}
        <View>
          {goals.map((g, i) => (
            <TaskRow key={g.id} first={i === 0} done={g.done} title={g.title} onPress={g.done ? undefined : g.onPress} trailing={!g.done ? <Icon name="chevron" size="md" color={t.tokens.subtle} /> : null} />
          ))}
          {foods.length ? (
            <View style={{ borderTopWidth: t.border.thin, borderTopColor: t.tokens.border }}>
              <TaskRow
                first
                done={foodsDone}
                title={tr('today.tasks.foods')}
                subtitle={tr('today.tasks.foodsMeta', { done: eatenCount, total: foods.length, day: dayIdx + 1, days: NUTRITION_DAYS })}
                onPress={() => setFoodsOpen((o) => !o)}
                expanded={foodsOpen}
                trailing={<Icon name={foodsOpen ? 'chevronUp' : 'chevronDown'} size="md" color={t.tokens.subtle} />}
              />
              {foodsOpen ? (
                <View style={{ marginLeft: t.space.xl, marginBottom: t.space.sm, paddingLeft: t.space.md, borderLeftWidth: t.border.medium, borderLeftColor: t.tokens.border }}>
                  {foods.map((f, i) => (
                    <FoodRow key={f.id} food={f} first={i === 0} done={eaten.includes(f.id)} open={openId === f.id} onToggle={() => toggleFood(f.id)} onWhy={() => setOpenId(openId === f.id ? null : f.id)} />
                  ))}
                  <AppText variant="caption" muted>
                    {tr('today.challengesNote')}
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}
          {testDue ? (
            <View style={{ borderTopWidth: t.border.thin, borderTopColor: t.tokens.border }}>
              <TaskRow first done={false} title={tr('today.goals.test')} onPress={() => openGated('strengthTest', '/strength-test')} trailing={<Icon name="chevron" size="md" color={t.tokens.subtle} />} />
            </View>
          ) : null}
        </View>
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

/** A food of the day: tick it when eaten; "Neden?" shows why and the source. */
function FoodRow({ food, first, done, open, onToggle, onWhy }: { food: Challenge; first: boolean; done: boolean; open: boolean; onToggle: () => void; onWhy: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ borderTopWidth: first ? 0 : t.border.thin, borderTopColor: t.tokens.border }}>
      <TaskRow
        first
        done={done}
        title={food.text}
        subtitle={tr(`challengeCategory.${food.category}`)}
        onPress={onToggle}
        aside={
          <ScalePressable
            onPress={onWhy}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel={tr('today.challengeWhyA11y', { task: food.text })}
            hitSlop={(t.touch - 32) / 2}
            style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs, paddingHorizontal: t.space.sm, minHeight: 32, borderRadius: t.radius.pill, backgroundColor: open ? t.tokens.primarySoft : t.tokens.muted }}
          >
            <Icon name={open ? 'chevronUp' : FOOD_ICON[food.category]} size="sm" color={open ? t.tokens.primary : t.tokens.mutedForeground} />
            <AppText variant="footnote" weight="500" color={open ? t.tokens.primary : t.tokens.foreground}>
              {tr('today.challengeWhy')}
            </AppText>
          </ScalePressable>
        }
      />
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
