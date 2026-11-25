import { toDateKey } from '@/lib/date';
import type { WorkoutSession } from '@/types';

/**
 * Kegel rest lock (user request 2026-11-23): a full session is Tur 1 + Tur 2; after it the user may do
 * one more full session (Tur 1 + Tur 2), so at most 4 rounds. When the 4th round is finished, Kegel is
 * locked for 10 hours — only Kegel (main session and micro set); the rest of the app stays open.
 *
 * A round is a finished, non-micro workout with contractions (release sessions have none). Rounds are
 * counted per day and start again from zero when a lock ends. Pure: derived from the history.
 */
export const ROUNDS_BEFORE_LOCK = 4;
export const LOCK_HOURS = 10;
const LOCK_MS = LOCK_HOURS * 3600 * 1000;

export interface KegelLock {
  /** End of the lock, or null when Kegel is open. */
  until: Date | null;
  /** Rounds counted towards the next lock (0..3). */
  rounds: number;
}

const isRound = (w: WorkoutSession) => w.completed && !w.isMicro && (w.contractions ?? 0) > 0;

export function kegelLock(workouts: WorkoutSession[], now: Date = new Date()): KegelLock {
  const rounds = workouts.filter(isRound).sort((a, b) => a.finishedAt.localeCompare(b.finishedAt));
  let count = 0;
  let day: string | null = null;
  let lockEnd = 0;
  for (const w of rounds) {
    const at = Date.parse(w.finishedAt);
    if (!Number.isFinite(at)) continue;
    if (lockEnd && at >= lockEnd) {
      lockEnd = 0;
      count = 0;
    }
    if (w.date !== day) {
      day = w.date;
      count = 0;
    }
    count++;
    if (count >= ROUNDS_BEFORE_LOCK) {
      lockEnd = at + LOCK_MS;
      count = 0;
    }
  }
  const nowMs = now.getTime();
  if (lockEnd > nowMs) return { until: new Date(lockEnd), rounds: 0 };
  return { until: null, rounds: day === toDateKey(now) ? count : 0 };
}

/** "09:59:12" — time left until `until` (never negative). */
export function formatLockLeft(until: Date, now: Date = new Date()): string {
  const s = Math.max(0, Math.ceil((until.getTime() - now.getTime()) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
