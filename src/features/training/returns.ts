import { addDays } from '@/lib/date';
import type { TrainingState } from '@/types';

import { applyReturn } from './plan';
import { missedDaysPolicy, refreshFreezes } from './schedule';

/**
 * Daily check on app open (SPEC_KEGEL_V2 §6.6), pure:
 *  - refills the 2 monthly streak freezes;
 *  - a missed day or two is covered by freezes (streak kept, no message needed beyond a note);
 *  - 3–6 missed days → level −1 and "we start a bit softer"; 7+ → level −2, a short Quick re-warm;
 *  - vacation days never count.
 * Runs once per day.
 */
export function dailyCheck(t: TrainingState, today: string, completedDates: Iterable<string>): TrainingState {
  if (t.lastReturnCheck === today) return t;
  const done = new Set(completedDates);
  let next: TrainingState = { ...t, ...refreshFreezes(t, today), lastReturnCheck: today };
  if (next.returnNotice && next.returnNotice.date !== today) delete next.returnNotice;

  // Last day with a finished session (or the last plan advance).
  const last =
    [...done]
      .filter((d) => d < today)
      .sort()
      .at(-1) ?? t.lastAdvancedDate;
  if (!last) return next;
  const frozen = new Set(next.frozenDays ?? []);
  const inVacation = (d: string) => Boolean(next.vacation && d >= next.vacation.from && d <= next.vacation.to);
  const missed: string[] = [];
  for (let d = addDays(last, 1); d < today; d = addDays(d, 1)) if (!done.has(d) && !frozen.has(d) && !inVacation(d)) missed.push(d);
  if (!missed.length) return next;

  // Short gaps: freezes keep the streak (only when they cover the whole gap).
  if (missed.length <= next.freezeTokens) {
    next = { ...next, freezeTokens: next.freezeTokens - missed.length, frozenDays: [...(next.frozenDays ?? []), ...missed].slice(-62), returnNotice: { kind: 'frozen', date: today, days: missed.length } };
    return next;
  }

  const policy = missedDaysPolicy(last, today, next.vacation);
  if (policy.kind === 'none') return next;
  next = { ...applyReturn(next, policy.levelDelta), returnNotice: { kind: policy.kind, date: today, days: policy.missedDays } };
  if (policy.kind === 'rewarm') next.nextPresetOnce = 'quick';
  return next;
}

/** Days that keep the streak alive without a session: freezes and vacation (for computeStreak). */
export function protectedDays(t: Pick<TrainingState, 'frozenDays' | 'vacation'>): string[] {
  const out = [...(t.frozenDays ?? [])];
  if (t.vacation) for (let d = t.vacation.from; d <= t.vacation.to; d = addDays(d, 1)) out.push(d);
  return out;
}
