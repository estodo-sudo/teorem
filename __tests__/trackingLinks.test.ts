import fs from 'fs';
import path from 'path';

import { completedDates } from '@/features/gamification/service';
import { createMemoryRepo, type HistoryRepo } from '@/features/data/repo';
import { heatMap } from '@/features/progress/stats';
import { generateSession } from '@/features/training/generateSession';
import { defaultTraining, todayPlanDay } from '@/features/training/plan';
import { recordWorkout, submitFeedback } from '@/features/training/service';
import { countsAsSession, dailyProgress, dayStatus, targetDays } from '@/features/training/summary';
import { weekCount, weekDays } from '@/features/today/week';
import { toDateKey } from '@/lib/date';
import { setHistoryRepo, useHistoryStore } from '@/stores/historyStore';
import { useTrainingStore } from '@/stores/trainingStore';

const read = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const session = generateSession({ level: 1, seed: 'x' });
const outcomes = (done: boolean, skipped = false) => session.blocks.map(() => ({ completed: done, skipped }));
const today = toDateKey();

beforeEach(() => {
  setHistoryRepo(createMemoryRepo());
  useHistoryStore.getState().replaceAll({ workouts: [], strengthTests: [], fitnessLogs: [], notes: [] });
  useTrainingStore.getState().replace(defaultTraining());
});

describe('a finished session reaches every tracker (2026-11-23 fixes)', () => {
  it('the Today ring, the week, the calendar and the plan day all move when the session ends — without the "Nasıldı?" answers', () => {
    const w = recordWorkout(session, { actualSec: 120, endedEarly: false, outcomes: outcomes(true) });
    const workouts = useHistoryStore.getState().workouts;
    expect(workouts.filter((x) => x.date === today && countsAsSession(x))).toHaveLength(1);
    expect(dailyProgress(workouts, today, 2).done).toBe(1);
    expect(completedDates(workouts)).toContain(today);
    expect(heatMap(workouts, today, 1).flat().find((c) => c.date === today)?.intensity).toBe(2);
    // Plan: today is done ("Gün 1" stays the day shown today), tomorrow is day 2.
    const t = useTrainingStore.getState().training;
    expect([t.planDayIndex, t.lastAdvancedDate, w.advancedPlan]).toEqual([1, today, true]);
    expect(todayPlanDay(t, today)).toBe(0);
  });

  it('a session taken to the end with skipped exercises still counts as done; "Bitir" does not', () => {
    expect(recordWorkout(session, { actualSec: 10, endedEarly: false, outcomes: outcomes(false, true) }).completed).toBe(true);
    expect(recordWorkout(session, { actualSec: 10, endedEarly: true, outcomes: outcomes(false) }).completed).toBe(false);
  });

  it('the plan moves on once a day; Tur 2 and micro sets do not move it', () => {
    recordWorkout(session, { actualSec: 120, endedEarly: false, outcomes: outcomes(true) });
    const round2 = generateSession({ level: 1, seed: 'x', round: 2 });
    recordWorkout(round2, { actualSec: 120, endedEarly: false, outcomes: round2.blocks.map(() => ({ completed: true, skipped: false })) });
    recordWorkout(session, { actualSec: 120, endedEarly: false, outcomes: outcomes(true) });
    expect(useTrainingStore.getState().training.planDayIndex).toBe(1);
  });

  it('answering "Tamamlayamadım" takes this session\'s advance back, so the day repeats; "Uygun" keeps it', () => {
    const w = recordWorkout(session, { actualSec: 120, endedEarly: false, outcomes: outcomes(true) });
    submitFeedback(w.id, 'failed');
    const t = useTrainingStore.getState().training;
    expect([t.planDayIndex, t.lastAdvancedDate, t.repeatNextDay]).toEqual([0, null, true]);

    useTrainingStore.getState().replace(defaultTraining());
    const w2 = recordWorkout(session, { actualSec: 120, endedEarly: false, outcomes: outcomes(true) });
    submitFeedback(w2.id, 'ok');
    expect(useTrainingStore.getState().training.planDayIndex).toBe(1);
  });

  it('a database write that fails never keeps the session off the screen', () => {
    const broken: HistoryRepo = {
      ...createMemoryRepo(),
      upsertWorkout: () => {
        throw new Error('disk');
      },
    };
    setHistoryRepo(broken);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    recordWorkout(session, { actualSec: 120, endedEarly: false, outcomes: outcomes(true) });
    expect(useHistoryStore.getState().workouts).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('camp logs are saved the same way; a Kasık Fitness routine taken to the end is logged however short', () => {
    expect(read('src/stores/campStore.ts')).toMatch(/set\(\(s\) => \(\{ cravings: \[\.\.\.s\.cravings, c\]\.sort\(byAt\) \}\)\);\s*saveEvent\('craving'/);
    expect(read('app/fitness/[routineId].tsx')).toMatch(/if \(!state\.endedEarly \|\| sec >= 30\)/);
  });
});

describe('the daily target decides when a day is done (2026-11-23)', () => {
  const day = '2026-11-19';
  const one = [{ date: day, completed: true }];
  const tur1and2 = [...one, { date: day, completed: true, round: 2 as const }];
  const two = [...one, { date: day, completed: true, isMicro: true }];

  it('one session of a target of two: the day is half done, not done (Tur 2 does not make it two)', () => {
    expect(targetDays(one, 2)).toEqual({ full: [], partial: [day] });
    expect(targetDays(tur1and2, 2)).toEqual({ full: [], partial: [day] });
    expect(targetDays(two, 2)).toEqual({ full: [day], partial: [] });
    expect(targetDays(one, 1)).toEqual({ full: [day], partial: [] });
  });

  it('the week strip shows such a day half filled and does not count it', () => {
    const split = targetDays(one, 2);
    const days = weekDays(day, split.full, [], split.partial);
    expect(days.find((d) => d.key === day)?.state).toBe('todayPartial');
    expect(weekCount(days).done).toBe(0);
    const full = targetDays(two, 2);
    expect(weekDays(day, full.full, [], full.partial).find((d) => d.key === day)?.state).toBe('todayDone');
  });

  it('the calendar uses the same rule: half, done, above the target', () => {
    const cell = (list: { date: string; completed: boolean; round?: 1 | 2; isMicro?: boolean }[]) => heatMap(list.map((w, i) => ({ id: String(i), finishedAt: `${w.date}T10:00:00Z`, level: 1, plannedSec: 120, actualSec: 120, exercises: [], ...w })), day, 1, 2).flat().find((c) => c.date === day)?.intensity;
    expect(cell(one)).toBe(1);
    expect(cell(tur1and2)).toBe(1);
    expect(cell(two)).toBe(2);
    expect(cell([...two, { date: day, completed: true }])).toBe(3);
  });

  it('the card keeps "Başla" until the target is reached; only then "tamam" and "Bir seans daha"', () => {
    const card = read('src/features/today/WorkoutCard.tsx');
    expect(card).toMatch(/const status = dayStatus\(workouts, today, training\.dailyTarget\);/);
    expect(card).toMatch(/const dayDone = status\.full;/);
    expect(card).toMatch(/\{dayDone \? tr\('today\.workout\.doneTitle'\) : tr\('today\.workout\.title'\)\}/);
    expect(card).not.toMatch(/mainDone/);
  });
});

describe('"Bugün" tasks, the card, the week and the calendar follow one rule (2026-11-23)', () => {
  const day = '2026-11-19';
  const main = { date: day, completed: true };
  const micro = { date: day, completed: true, isMicro: true };
  const release = { date: day, completed: true, isMicro: true, track: 'relax' };

  it('main + micro set: done; two main sessions: done; two micro sets: not done (the main one is missing)', () => {
    expect(dayStatus([main, micro], day, 2)).toMatchObject({ full: true, counted: 2, mainDone: true, microDone: true });
    expect(dayStatus([main, main], day, 2)).toMatchObject({ full: true, counted: 2, microDone: false });
    expect(dayStatus([micro, micro], day, 2)).toMatchObject({ full: false, counted: 1, mainDone: false });
    expect(targetDays([micro, micro], 2)).toEqual({ full: [], partial: [day] });
  });

  it('a release session does not count anywhere', () => {
    expect(countsAsSession(release)).toBe(false);
    expect(dayStatus([main, release], day, 2)).toMatchObject({ full: false, counted: 1, microDone: false });
  });

  it('the task list: the second task is ticked when the target is reached either way; the test task stays ticked after the test; tasks start through the same checks as "Başla"', () => {
    const src = read('src/features/today/DailyGoalCard.tsx');
    expect(src).toMatch(/done: status\.microDone \|\| status\.full/);
    expect(src).toMatch(/if \(testDoneToday \|\| strengthTestDue\(tests, today\)\)/);
    expect(src).toMatch(/const \{ go, dialog \} = useSessionStarter\(\);/);
    expect(src).not.toMatch(/pathname: '\/workout\/\[sessionId\]'/);
  });

  it('the feedback summary uses the same count', () => {
    expect(dailyProgress([micro, micro], day, 2)).toEqual({ done: 1, target: 2, reached: false });
    expect(dailyProgress([main, micro], day, 2)).toEqual({ done: 2, target: 2, reached: true });
  });
});
