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
    // Tur 1 is the first half of the day (2026-11-25): the streak waits for Tur 2, the calendar shows "Yarım".
    expect(completedDates(workouts)).not.toContain(today);
    expect(heatMap(workouts, today, 1).flat().find((c) => c.date === today)?.intensity).toBe(1);
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

describe('a day is Tur 1 + Tur 2 (2026-11-25; micro sets removed, old ones count for nothing)', () => {
  const day = '2026-11-19';
  const tur1 = { date: day, completed: true };
  const tur2 = { date: day, completed: true, round: 2 as const };
  const micro = { date: day, completed: true, isMicro: true };
  const release = { date: day, completed: true, isMicro: true, track: 'relax' };

  it('Tur 1 is the first half, Tur 2 the second; a micro set is never half a day', () => {
    expect(dayStatus([tur1], day)).toMatchObject({ full: false, counted: 1, mainDone: true, round2Done: false, target: 2 });
    expect(dayStatus([tur1, tur2], day)).toMatchObject({ full: true, counted: 2 });
    expect(dayStatus([tur1, micro], day)).toMatchObject({ full: false, counted: 1, microDone: true });
    expect(dayStatus([micro, micro], day)).toMatchObject({ full: false, counted: 0, mainDone: false });
    expect(targetDays([tur1])).toEqual({ full: [], partial: [day] });
    expect(targetDays([tur1, tur2])).toEqual({ full: [day], partial: [] });
    expect(targetDays([micro])).toEqual({ full: [], partial: [] });
  });

  it('a release session does not count anywhere', () => {
    expect(countsAsSession(release)).toBe(false);
    expect(dayStatus([tur1, release], day)).toMatchObject({ full: false, counted: 1, microDone: false });
  });

  it('the week: half after Tur 1, done after Tur 2; the streak counts full days only', () => {
    const half = targetDays([tur1]);
    expect(weekDays(day, half.full, [], half.partial).find((d) => d.key === day)?.state).toBe('todayPartial');
    expect(weekCount(weekDays(day, half.full, [], half.partial)).done).toBe(0);
    const full = targetDays([tur1, tur2]);
    expect(weekDays(day, full.full, [], full.partial).find((d) => d.key === day)?.state).toBe('todayDone');
    const w = (x: { date: string; completed: boolean; round?: 1 | 2; isMicro?: boolean }, i: number) => ({ id: String(i), finishedAt: `${x.date}T10:00:00Z`, level: 1, plannedSec: 120, actualSec: 120, exercises: [], ...x });
    expect(completedDates([tur1].map(w))).toEqual([]);
    expect(completedDates([tur1, tur2].map(w))).toEqual([day]);
  });

  it('the calendar: half, done, done with an extra; a micro set alone marks nothing', () => {
    const cell = (list: { date: string; completed: boolean; round?: 1 | 2; isMicro?: boolean }[]) => heatMap(list.map((w, i) => ({ id: String(i), finishedAt: `${w.date}T10:00:00Z`, level: 1, plannedSec: 120, actualSec: 120, exercises: [], ...w })), day, 1).flat().find((c) => c.date === day)?.intensity;
    expect(cell([tur1])).toBe(1);
    expect(cell([tur1, tur2])).toBe(2);
    expect(cell([tur1, tur2, micro])).toBe(3);
    expect(cell([micro])).toBe(0);
  });

  it('the card counts halves and, after Tur 1, starts Tur 2; the tasks are Tur 1, Tur 2 and the test', () => {
    const card = read('src/features/today/WorkoutCard.tsx');
    expect(card).toMatch(/const dayDone = status\.mainDone && status\.round2Done;/);
    expect(card).toMatch(/const target = status\.target;/);
    expect(card).toMatch(/const nextIsRound2 = status\.mainDone && !status\.round2Done;/);
    expect(card).toMatch(/go\('round2', round2\.contractions\)/);
    const tasks = read('src/features/today/DailyGoalCard.tsx');
    expect(tasks).toMatch(/title: tr\('today\.goals\.round1'\), done: status\.mainDone/);
    expect(tasks).toMatch(/title: tr\('today\.goals\.round2'\), done: status\.round2Done/);
    expect(tasks).not.toMatch(/microExtra|go\('micro'/);
    expect(tasks).toMatch(/if \(testDoneToday \|\| strengthTestDue\(tests, today\)\)/);
    expect(tasks).toMatch(/const \{ go, dialog \} = useSessionStarter\(\);/);
    expect(tasks).not.toMatch(/pathname: '\/workout\/\[sessionId\]'/);
    expect(read('src/features/training/useSessionStarter.tsx')).toMatch(/sessionId === 'round2' \? lessonRoute\(useTrainingStore\.getState\(\)\.training\) : null/);
    expect(read('app/settings/training.tsx')).not.toMatch(/settings\.training\.perDay'/);
  });

  it('the feedback summary uses the same count', () => {
    expect(dailyProgress([micro, micro], day)).toEqual({ done: 0, target: 2, reached: false });
    expect(dailyProgress([tur1], day)).toEqual({ done: 1, target: 2, reached: false });
    expect(dailyProgress([tur1, tur2], day)).toEqual({ done: 2, target: 2, reached: true });
  });
});
