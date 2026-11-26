import { toDateKey } from '@/lib/date';
import { makeId } from '@/lib/random';
import { useHistoryStore } from '@/stores/historyStore';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { Feedback, TrainingState, WorkoutSession } from '@/types';

import { generateSession } from './generateSession';
import { absoluteDay, cycleMoves, learnedMoves, lessonDue, roundMoves, type MoveId } from './moves';
import { advancedToday, advancePlan, applySessionResult, isCycle, todayPlanDay, todayPlanPosition, todayWeekIndex } from './plan';
import { adjustLevel } from './adjustLevel';
import { deloadDue, levelLocked, painPolicy, strengthFallingTwoWeeks } from './schedule';
import { sessionSummary } from './summary';
import type { PlayerResult } from './player/WorkoutPlayer';
import type { GeneratedSession } from './types';

/**
 * Today's deterministic session (Tur 1, or Tur 2 with `round: 2`) for the current training state. In
 * plan week 4 ("Toparlanma", or an early deload after falling strength tests) Tur 1 is one cycle shorter.
 * The moves learned so far are added (moves.ts).
 */
export function buildTodaySession(training: TrainingState, today = toDateKey(), opts: { round?: 1 | 2; strengthFalling?: boolean } = {}): GeneratedSession {
  const strengthFalling = opts.strengthFalling ?? strengthFallingTwoWeeks(useHistoryStore.getState().strengthTests);
  const pos = todayPlanPosition(training, today);
  const deload = deloadDue({ ...pos, lastDeloadWeek: training.lastDeloadWeek, strengthFalling });
  const round = opts.round ?? 1;
  // The learned moves of the 180-day plan: the latest in both rounds, earlier ones in turns in Tur 2.
  // After the 180 days, the moves of the 7-day cycle's day.
  const learned = learnedMoves(training);
  const moves = isCycle(pos.planNumber) ? cycleMoves(learned, pos.planDay, round) : roundMoves(learned, absoluteDay(pos.planNumber, pos.planDay), round);
  return generateSession({ level: training.level, seed: today, round, dayIndex: todayPlanDay(training, today), weekIndex: todayWeekIndex(training, today), deload, moves });
}

/** The move lesson due after today's Tur 1 (180-day plan), or null. */
export function todayLesson(training: TrainingState, today = toDateKey()): MoveId | null {
  const pos = todayPlanPosition(training, today);
  return lessonDue(training, absoluteDay(pos.planNumber, pos.planDay));
}

/**
 * Where "Tur 2" goes today: its lesson first when one is due (Yavaş Sıkma's own lesson the first time,
 * a new move's lesson on its day), else null = straight to Tur 2. `first` = today's Tur 1 workout.
 */
export function lessonRoute(training: TrainingState, first?: string, today = toDateKey()): { pathname: '/workout/round2-intro' | '/workout/move-intro'; params: Record<string, string> } | null {
  const due = todayLesson(training, today);
  if (!due) return null;
  const params: Record<string, string> = first ? { first } : {};
  return due === 'elevator' ? { pathname: '/workout/round2-intro', params } : { pathname: '/workout/move-intro', params: { ...params, move: due } };
}

type Hook = (w: WorkoutSession) => void;
const afterFeedbackHooks: Hook[] = [];

/** Lets other features (streak, achievements, reminders) react to a finished workout. */
export function onWorkoutFinalized(hook: Hook) {
  afterFeedbackHooks.push(hook);
}

function runHooks(w: WorkoutSession) {
  afterFeedbackHooks.forEach((h) => {
    try {
      h(w);
    } catch {
      // never block the flow on a side effect
    }
  });
}

/**
 * Persists a finished (or ended-early) session without feedback yet. `round2Locked`: Tur 2 needs premium
 * the user does not have, so a finished Tur 1 completes the day on its own.
 */
export function recordWorkout(session: GeneratedSession, result: PlayerResult, now = new Date(), opts: { round2Locked?: boolean } = {}): WorkoutSession {
  const w: WorkoutSession = {
    id: makeId('w_'),
    date: toDateKey(now),
    finishedAt: now.toISOString(),
    level: session.level,
    plannedSec: session.plannedSec,
    actualSec: result.actualSec,
    exercises: session.exercises.map((e, i) => ({ type: e.type, completed: result.outcomes[i]?.completed ?? false, skipped: result.outcomes[i]?.skipped ?? false })),
    // Done when it ran to the end (2026-11-23: also with skipped exercises — those only keep the level
    // from rising). Ended early with "Bitir" = not done.
    completed: !result.endedEarly,
    track: session.track,
    durationPreset: session.durationPreset,
    pauses: result.pauses ?? 0,
    skippedBlocks: result.outcomes.filter((o) => o.skipped).length,
    completionRate: completionRate(result),
    isMicro: session.isMicro,
    // Done, not planned: only finished blocks count (daily cap and the summary).
    ...doneSummary(session, result),
    deload: session.deload,
    ...(session.round === 2 ? { round: 2 as const } : {}),
    ...(opts.round2Locked && session.round !== 2 && !session.isMicro ? { round2Locked: true } : {}),
  };
  // A finished main session moves the plan on right away (once a day), without waiting for "Nasıldı?".
  const training = useTrainingStore.getState();
  const moves = w.completed && !session.isMicro && session.round !== 2 && !advancedToday(training.training, w.date);
  if (moves) w.advancedPlan = true;
  useHistoryStore.getState().saveWorkout(w);
  if (moves) training.replace(advancePlan(training.training, w.date));
  // Trophies and the like follow the finished session too (they used to wait for the answers).
  runHooks(w);
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
    training.replace(applySessionResult(training.training, { date: w.date, feedback, completionRate: w.completionRate, pauses: w.pauses, skippedBlocks: w.skippedBlocks, deload: w.deload, advancedPlan: w.advancedPlan }));
  }
  runHooks(updated);
  const t1 = useTrainingStore.getState().training;
  return { before: t0.level, after: t1.level, suggestShorter: false, locked, wouldRise: wouldRise && !w.isMicro, struggled: feedback === 'hard' || feedback === 'failed' };
}
