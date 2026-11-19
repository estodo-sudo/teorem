import { makeId } from '@/lib/random';

import { ms } from './time';

/**
 * Attempt lifecycle shared by every camp. A slip keeps the attempt going (it is logged, the
 * "since last" counter restarts); a relapse ends the attempt and a new one can start, keeping the
 * old data ("Deneme #2"). Reaching the end of the programme graduates the attempt.
 */
export type AttemptStatus = 'preparing' | 'active' | 'relapsed' | 'graduated';

export interface CampAttempt {
  id: string;
  attemptNo: number;
  /** When the attempt (and its preparation) began. */
  startedAt: string;
  /** Planned start of the programme proper (quit day / goal start). */
  plannedQuitDate: string;
  /** Set when it actually begins. */
  actualQuitDateTime?: string;
  status: AttemptStatus;
  endedAt?: string;
}

export const ATTEMPT_STATUS: AttemptStatus[] = ['preparing', 'active', 'relapsed', 'graduated'];

/** When the programme proper starts (or is planned to). */
export const attemptStart = (a: CampAttempt) => a.actualQuitDateTime ?? a.plannedQuitDate;

/** The attempt in progress (preparing or active), if any. */
export const inProgress = <A extends CampAttempt>(attempts: A[]): A | null => attempts.find((a) => a.status === 'preparing' || a.status === 'active') ?? null;

/** The attempt to show: the one in progress, else a graduated one. */
export const shownAttempt = <A extends CampAttempt>(attempts: A[]): A | null => inProgress(attempts) ?? attempts.filter((a) => a.status === 'graduated').pop() ?? null;

/** The latest attempt of any status. */
export const lastAttempt = <A extends CampAttempt>(attempts: A[]): A | null => attempts[attempts.length - 1] ?? null;

/** A new attempt: `startAt` → active now from that moment; otherwise it prepares until `plannedStart`. */
export function startAttempt(attempts: CampAttempt[], opts: { plannedStart: string; startAt?: string }, now: Date): CampAttempt {
  return {
    id: makeId('att'),
    attemptNo: attempts.length + 1,
    startedAt: now.toISOString(),
    plannedQuitDate: opts.startAt ?? opts.plannedStart,
    actualQuitDateTime: opts.startAt,
    status: opts.startAt ? 'active' : 'preparing',
  };
}

/** A preparing attempt becomes active once its start day begins. */
export function activateIfDue<A extends CampAttempt>(a: A, now: Date): A {
  if (a.status !== 'preparing') return a;
  if (now.getTime() < ms(a.plannedQuitDate)) return a;
  return { ...a, status: 'active', actualQuitDateTime: a.plannedQuitDate };
}

/** Start right now (before the planned day). */
export const startNow = <A extends CampAttempt>(a: A, now: Date): A => ({ ...a, status: 'active', actualQuitDateTime: now.toISOString(), plannedQuitDate: now.toISOString() });

/** Relapse: the attempt ends; its data stays. */
export const endAsRelapse = <A extends CampAttempt>(a: A, now: Date): A => ({ ...a, status: 'relapsed', endedAt: now.toISOString() });

/** Programme completed. */
export const graduate = <A extends CampAttempt>(a: A, now: Date): A => ({ ...a, status: 'graduated', endedAt: now.toISOString() });

/** Lapses of one attempt (by attempt id) at/after its start. */
export const attemptLapses = <L extends { at: string; attemptId: string }>(a: CampAttempt, lapses: L[]): L[] => {
  const start = ms(attemptStart(a));
  return lapses.filter((l) => l.attemptId === a.id && ms(l.at) >= start).sort((x, y) => ms(x.at) - ms(y.at));
};
