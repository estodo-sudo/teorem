import { PLAN_LENGTH_DAYS } from '@/config/app';
import type { Feedback, TrainingState } from '@/types';

import { adjustLevel } from './adjustLevel';
import { clampLevel } from './levels';

/** The plan day (0-based) that today's main session belongs to. */
export function todayPlanDay(t: TrainingState, today: string): number {
  if (t.lastAdvancedDate === today) {
    // Already advanced today → extra sessions replay today's day.
    return t.planDayIndex === 0 ? PLAN_LENGTH_DAYS - 1 : t.planDayIndex - 1;
  }
  return t.planDayIndex;
}

/** Whether the plan was already advanced (main session done) today. */
export function advancedToday(t: TrainingState, today: string): boolean {
  return t.lastAdvancedDate === today;
}

/**
 * Applies a finished session's feedback to the training state:
 * level adjustment + (once per day) advancing the 30-day plan.
 * A "failed" session does not advance the plan (day is repeated).
 */
export function applySessionResult(
  t: TrainingState,
  result: { date: string; feedback: Feedback },
): TrainingState {
  const adj = adjustLevel({ level: t.level, consecutiveOk: t.consecutiveOk }, result.feedback);
  const next: TrainingState = { ...t, level: adj.level, consecutiveOk: adj.consecutiveOk };
  if (adj.repeatDay) {
    next.repeatNextDay = true;
    return next;
  }
  if (t.lastAdvancedDate !== result.date) {
    let day = t.planDayIndex + 1;
    let plan = t.planNumber;
    if (day >= PLAN_LENGTH_DAYS) {
      day = 0;
      plan += 1;
    }
    next.planDayIndex = day;
    next.planNumber = plan;
    next.lastAdvancedDate = result.date;
    next.repeatNextDay = false;
  }
  return next;
}

/** Manual level change from settings. */
export function setManualLevel(t: TrainingState, level: number): TrainingState {
  return { ...t, level: clampLevel(level), consecutiveOk: 0 };
}
