import type { FitnessLog } from '@/types';

import { weekDays, type WeekDay } from '@/features/today/week';

/**
 * Kasık Fitness programme (user request 2026-11-23): the one standard routine done as a 7-week
 * programme, three sessions a week — like the Kegel plan, not an extra workout. Pure; date keys are
 * local YYYY-MM-DD. The programme starts on the day of the first session and never needs its own store:
 * everything is read from the fitness logs in the history.
 */
export const PROGRAM_WEEKS = 7;
export const SESSIONS_PER_WEEK = 3;
export const PROGRAM_SESSIONS = PROGRAM_WEEKS * SESSIONS_PER_WEEK;

const DAY = 86_400_000;
const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!);
};
const daysBetween = (a: string, b: string) => Math.round((fromKey(b) - fromKey(a)) / DAY);

export interface ProgramState {
  /** At least one session done. */
  started: boolean;
  /** Day of the first session (null before the first). */
  startKey: string | null;
  /** 1…7: the programme week today falls in (1 before the start). */
  week: number;
  /** Sessions (distinct days) in each programme week, index 0 = week 1. */
  perWeek: number[];
  /** Sessions counted towards the programme, at most three a week. */
  total: number;
  /** All seven weeks reached three sessions. */
  finished: boolean;
  /** Seven weeks have passed since the start. */
  over: boolean;
  todayDone: boolean;
  /** This calendar week, Monday → Sunday, with the days a session was done. */
  thisWeek: WeekDay[];
  thisWeekCount: number;
}

/** Distinct days with a fitness session (any length counts: the player only logs a real session). */
export function sessionDays(logs: Pick<FitnessLog, 'date'>[]): string[] {
  return [...new Set(logs.map((l) => l.date))].sort();
}

export function programState(logs: Pick<FitnessLog, 'date'>[], today: string): ProgramState {
  const days = sessionDays(logs).filter((d) => d <= today);
  const startKey = days[0] ?? null;
  const perWeek = Array.from({ length: PROGRAM_WEEKS }, () => 0);
  if (startKey) for (const d of days) {
    const w = Math.floor(daysBetween(startKey, d) / 7);
    if (w < PROGRAM_WEEKS) perWeek[w]! += 1;
  }
  const elapsed = startKey ? Math.floor(daysBetween(startKey, today) / 7) : 0;
  const total = perWeek.reduce((a, n) => a + Math.min(n, SESSIONS_PER_WEEK), 0);
  const thisWeek = weekDays(today, days);
  return {
    started: !!startKey,
    startKey,
    week: Math.min(PROGRAM_WEEKS, elapsed + 1),
    perWeek,
    total,
    finished: total >= PROGRAM_SESSIONS,
    over: elapsed >= PROGRAM_WEEKS,
    todayDone: days.includes(today),
    thisWeek,
    thisWeekCount: thisWeek.filter((d) => d.state === 'done' || d.state === 'todayDone').length,
  };
}

/** Week status for the list: done (3 sessions), current, missed (passed with fewer), upcoming. */
export type ProgramWeekStatus = 'done' | 'current' | 'missed' | 'upcoming';

export function weekStatus(s: ProgramState, index: number): ProgramWeekStatus {
  if ((s.perWeek[index] ?? 0) >= SESSIONS_PER_WEEK) return 'done';
  if (!s.over && index === s.week - 1) return 'current';
  return index < s.week - 1 || s.over ? 'missed' : 'upcoming';
}
