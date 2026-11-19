import { toDateKey } from '@/lib/date';
import { makeId } from '@/lib/random';
import { useHistoryStore } from '@/stores/historyStore';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { Feedback, TrainingState, WorkoutSession } from '@/types';

import { generateSession } from './generateSession';
import { applySessionResult, todayPlanDay, todayPlanPosition, todayWeekIndex } from './plan';
import { adjustLevel } from './adjustLevel';
import { deloadDue, levelLocked, painPolicy, strengthFallingTwoWeeks } from './schedule';
import { sessionSummary } from './summary';
import type { PlayerResult } from './player/WorkoutPlayer';
import type { GeneratedSession } from './types';

/** Today's deterministic session for the current training state. */
export function buildTodaySession(training: TrainingState, today = toDateKey(), opts: { hypertonic?: boolean; strengthFalling?: boolean; preset?: TrainingState['durationPreset'] } = {}): GeneratedSession {
  const hypertonic = opts.hypertonic ?? useKegelStore.getState().profile?.hypertonicFlag ?? false;
  const weekIndex = todayWeekIndex(training, today);
  const strengthFalling = opts.strengthFalling ?? strengthFallingTwoWeeks(useHistoryStore.getState().strengthTests);
  return generateSession({
    track: training.track,
    level: training.level,
    durationPreset: opts.preset ?? training.nextPresetOnce ?? training.durationPreset,
    dayIndex: todayPlanDay(training, today),
    weekIndex,
    hypertonic,
    seed: today,
    deload: deloadDue({ ...todayPlanPosition(training, today), lastDeloadWeek: training.lastDeloadWeek, strengthFalling }),
  });
}

type Hook = (w: WorkoutSession) => void;
const afterFeedbackHooks: Hook[] = [];

/** Lets other features (streak, achievements, reminders) react to a finished workout. */
export function onWorkoutFinalized(hook: Hook) {
  afterFeedbackHooks.push(hook);
}

/** Persists a finished (or ended-early) session without feedback yet. */
export function recordWorkout(session: GeneratedSession, result: PlayerResult, now = new Date()): WorkoutSession {
  const w: WorkoutSession = {
    id: makeId('w_'),
    date: toDateKey(now),
    finishedAt: now.toISOString(),
    level: session.level,
    plannedSec: session.plannedSec,
    actualSec: result.actualSec,
    exercises: session.exercises.map((e, i) => ({
      type: e.type,
      completed: result.outcomes[i]?.completed ?? false,
      skipped: result.outcomes[i]?.skipped ?? false,
    })),
    // Counts toward streak only if it ran to the end and wasn't skipped entirely.
    completed: !result.endedEarly && result.outcomes.some((o) => o.completed),
    track: session.track,
    durationPreset: session.durationPreset,
    pauses: result.pauses ?? 0,
    skippedBlocks: result.outcomes.filter((o) => o.skipped).length,
    completionRate: completionRate(result),
    isMicro: session.isMicro,
    // Done, not planned: only finished blocks count (daily cap and the summary).
    ...doneSummary(session, result),
    deload: session.deload,
  };
  useHistoryStore.getState().saveWorkout(w);
  return w;
}

/**
 * Pain / discomfort button (SPEC_KEGEL_V2 §11.1): stores a pain report and locks level increases for
 * 7 days. Returns whether to suggest a urologist / pelvic floor physiotherapist (2 reports in 7 days).
 */
export function reportPain(sessionId?: string, now = new Date()): { refer: boolean } {
  useKegelStore.getState().addPainReport({ at: now.toISOString(), ...(sessionId ? { sessionId } : {}) });
  const policy = painPolicy(useKegelStore.getState().painReports, toDateKey(now));
  if (policy.lockUntil) useTrainingStore.getState().update({ levelLockUntil: policy.lockUntil });
  return { refer: policy.refer };
}

function doneSummary(session: GeneratedSession, result: PlayerResult) {
  const s = sessionSummary(session, result.outcomes);
  return { contractions: s.contractions, holdSec: s.holdSec, longestHoldSec: s.longestHoldSec };
}

/** Share of blocks finished (0..1). */
export function completionRate(result: PlayerResult): number {
  if (!result.outcomes.length) return 0;
  return Math.round((result.outcomes.filter((o) => o.completed).length / result.outcomes.length) * 100) / 100;
}

/** Contractions already done today (daily cap, SPEC_KEGEL_V2 §11.5). */
export function contractionsToday(workouts: WorkoutSession[], today = toDateKey()): number {
  return workouts.filter((w) => w.date === today).reduce((n, w) => n + (w.contractions ?? 0), 0);
}

export interface FeedbackOutcome {
  before: number;
  after: number;
  suggestShorter: boolean;
  /** A pain report holds the level this week. */
  locked: boolean;
  /** Without the lock the level would have gone up. */
  wouldRise: boolean;
  /** Feedback was "hard" or "could not finish". */
  struggled: boolean;
}

/** Stores feedback (and the optional technique answer), adapts the level and advances the plan. */
export function submitFeedback(workoutId: string, feedback: Feedback, techniqueConfidence?: 'sure' | 'unsure'): FeedbackOutcome | undefined {
  const history = useHistoryStore.getState();
  const w = history.workouts.find((x) => x.id === workoutId);
  if (!w) return;
  const updated: WorkoutSession = { ...w, feedback, ...(techniqueConfidence ? { techniqueConfidence } : {}) };
  const t0 = useTrainingStore.getState().training;
  const locked = levelLocked(w.date, t0.levelLockUntil);
  const wouldRise = adjustLevel({ level: t0.level, consecutiveOk: t0.consecutiveOk, consecutiveHard: t0.consecutiveHard }, { feedback, completionRate: w.completionRate, pauses: w.pauses, skippedBlocks: w.skippedBlocks }).delta > 0;
  history.saveWorkout(updated);
  const training = useTrainingStore.getState();
  // Micro sets don't move the plan or the level.
  if (!w.isMicro) {
    training.replace(applySessionResult(training.training, { date: w.date, feedback, completionRate: w.completionRate, pauses: w.pauses, skippedBlocks: w.skippedBlocks, deload: w.deload }));
  }
  afterFeedbackHooks.forEach((h) => {
    try {
      h(updated);
    } catch {
      // never block the flow on a side effect
    }
  });
  const t1 = useTrainingStore.getState().training;
  return { before: t0.level, after: t1.level, suggestShorter: Boolean(t1.suggestShorter) && !w.isMicro, locked, wouldRise: wouldRise && !w.isMicro, struggled: feedback === 'hard' || feedback === 'failed' };
}
