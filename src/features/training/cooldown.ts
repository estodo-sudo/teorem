import { toDateKey } from '@/lib/date';
import type { WorkoutSession } from '@/types';

/**
 * Kegel rest lock (user decision 2026-11-25): the day is Tur 1 + Tur 2; after both, one more session
 * is allowed, so at most 3 rounds. When the 3rd is finished, Kegel is locked for 10 hours — only Kegel;
 * the rest of the app stays open. The countdown shows only on the "Başla" button, as numbers.
 *
 * A round is a finished main-session workout (Tur 1, Tur 2 or the extra session). Rounds are
 * counted per day and start again from zero when a lock ends. Pure: derived from the history.
 */
export const ROUNDS_BEFORE_LOCK = 3;
export const LOCK_HOURS = 10;
const LOCK_MS = LOCK_HOURS * 3600 * 1000;

export interface KegelLock {
  /** End of the lock, or null when Kegel is open. */
  until: Date | null;
  /** Rounds counted towards the next lock (0..2). */
  rounds: number;
}

/**
 * A finished round of the main session — the same rounds the day rule counts (summary.dayStatus).
 * Release sessions are `isMicro`. A round finished with skipped exercises (0 contractions) counts too:
 * it already makes the day "tamam", so it must count for the rest as well (bug 2026-11-25).
 */
const isRound = (w: WorkoutSession) => w.completed && !w.isMicro;

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
