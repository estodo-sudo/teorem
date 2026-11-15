import { toDateKey } from '@/lib/date';
import { makeId } from '@/lib/random';
import { useHistoryStore } from '@/stores/historyStore';
import { useTrainingStore } from '@/stores/trainingStore';
import type { Feedback, TrainingState, WorkoutSession } from '@/types';

import { generateSession } from './generateSession';
import { applySessionResult, todayPlanDay } from './plan';
import type { PlayerResult } from './player/WorkoutPlayer';
import type { GeneratedSession } from './types';

/** Today's deterministic session for the current training state. */
export function buildTodaySession(training: TrainingState, today = toDateKey()): GeneratedSession {
  return generateSession(training.level, todayPlanDay(training, today), today);
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
    completed: !result.endedEarly,
  };
  useHistoryStore.getState().saveWorkout(w);
  return w;
}

/** Stores feedback, adapts the level and advances the plan. */
export function submitFeedback(workoutId: string, feedback: Feedback) {
  const history = useHistoryStore.getState();
  const w = history.workouts.find((x) => x.id === workoutId);
  if (!w) return;
  const updated: WorkoutSession = { ...w, feedback };
  history.saveWorkout(updated);
  const training = useTrainingStore.getState();
  training.replace(applySessionResult(training.training, { date: w.date, feedback }));
  afterFeedbackHooks.forEach((h) => {
    try {
      h(updated);
    } catch {
      // never block the flow on a side effect
    }
  });
}
