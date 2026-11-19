import { cadenceDue, lowMoodRun } from '@/features/camps/core/checkinEngine';
import { DAY_MS, dayKey, startOfDay } from '@/features/camps/core/time';
import { makeId } from '@/lib/random';

import type { BehaviorEvent, GoalConfig, OdakCheckIn, ScreeningResult, Score5 } from '../types';

import { odakCadence, odakPhase } from './phase';
import { bpsHigh, phqGadFlags } from './screening';

/**
 * Daily check-in, safety and referral rules (SPEC_ODAK_KAMPI 5.5 / 5.6 / 0.3-7), all pure.
 *   Core programme: once a day, in the evening · consolidation: about three times a week · maintenance: monthly.
 *   Mood "çok kötü" on 3 days in a row → support card.
 *   Several slip days in a row → relapse flow ("yeniden başlamak bir beceridir").
 *   Specialist card: 3+ slip days within 14 days, or a high BPS together with a high PHQ-2 / GAD-2.
 */
export const EVENING_FROM = 17;
export const LOW_MOOD_DAYS = 3;
export const RELAPSE_DAYS = 3;
export const REFERRAL_WINDOW_DAYS = 14;
export const REFERRAL_SLIP_DAYS = 3;
export const VALUE_ACTION_MAX = 200;

/** Where the programme phases are counted from. */
export const programStart = (g: GoalConfig) => g.programStartedAt ?? g.startedAt;

export function odakCheckinDue(checkins: OdakCheckIn[], goal: GoalConfig, now: Date): boolean {
  const cadence = odakCadence(odakPhase(programStart(goal), now));
  if (cadence === 'daily') {
    const today = dayKey(now);
    return now.getHours() >= EVENING_FROM && !checkins.some((c) => dayKey(new Date(c.at)) === today);
  }
  return cadenceDue(checkins, cadence, now).due;
}

export const checkedInToday = (checkins: OdakCheckIn[], now: Date) => checkins.some((c) => dayKey(new Date(c.at)) === dayKey(now));

export const lowMoodAlert = (checkins: OdakCheckIn[], now: Date) => lowMoodRun(checkins, now, LOW_MOOD_DAYS);

/** Calendar days with a slip: a behaviour that went against the goal, or a check-in answered "no". */
export function slipDays(events: BehaviorEvent[], checkins: OdakCheckIn[]): Set<string> {
  return new Set([...events.filter((e) => e.isSlip).map((e) => dayKey(new Date(e.at))), ...checkins.filter((c) => !c.onGoal).map((c) => dayKey(new Date(c.at)))]);
}

/** Relapse: a slip on each of the last RELAPSE_DAYS days (ending today or yesterday), not dealt with since. */
export function relapseActive(events: BehaviorEvent[], checkins: OdakCheckIn[], now: Date, handledAt?: string | null): boolean {
  const days = slipDays(events, checkins);
  const start = days.has(dayKey(now)) ? startOfDay(now) : new Date(startOfDay(now).getTime() - DAY_MS);
  for (let i = 0; i < RELAPSE_DAYS; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() - i);
    if (!days.has(dayKey(d))) return false;
  }
  // Already worked through the relapse flow after the run started → do not ask again for this run.
  const runStart = new Date(start.getFullYear(), start.getMonth(), start.getDate() - (RELAPSE_DAYS - 1));
  return !(handledAt && Date.parse(handledAt) >= runStart.getTime());
}

export type ReferralReason = 'slips' | 'screen' | 'mood';

/** Why the gentle "profesyonel destek" card shows, or null. */
export function referralReason(o: { events: BehaviorEvent[]; checkins: OdakCheckIn[]; screenings: ScreeningResult[]; now: Date }): ReferralReason | null {
  if (lowMoodAlert(o.checkins, o.now)) return 'mood';
  const from = startOfDay(o.now).getTime() - (REFERRAL_WINDOW_DAYS - 1) * DAY_MS;
  const recent = [...slipDays(o.events, o.checkins)].filter((k) => {
    const [y, m, d] = k.split('-').map(Number) as [number, number, number];
    return new Date(y, m - 1, d).getTime() >= from;
  });
  if (recent.length >= REFERRAL_SLIP_DAYS) return 'slips';
  const last = (type: ScreeningResult['type']) => [...o.screenings].reverse().find((s) => s.type === type)?.score ?? null;
  if (bpsHigh(last('BPS')) && phqGadFlags(last('PHQ2'), last('GAD2')).any) return 'screen';
  return null;
}

/** Relapse: phases restart at day 8 (Sınırlar) while counters keep their start. */
export function restartAtBoundaries(goal: GoalConfig, now: Date): GoalConfig {
  const s = startOfDay(now);
  return { ...goal, programStartedAt: new Date(s.getFullYear(), s.getMonth(), s.getDate() - 7, 12).toISOString() };
}

export function buildCheckin(o: { onGoal: boolean; urgeCount: number; mood: Score5; sleep: Score5; loneliness: Score5; valueAction?: string }, now: Date): OdakCheckIn {
  const v = o.valueAction?.trim().slice(0, VALUE_ACTION_MAX);
  return { id: makeId('chk'), at: now.toISOString(), onGoal: o.onGoal, urgeCount: Math.max(0, Math.round(o.urgeCount)), mood: o.mood, sleep: o.sleep, loneliness: o.loneliness, ...(v ? { valueAction: v } : {}) };
}
