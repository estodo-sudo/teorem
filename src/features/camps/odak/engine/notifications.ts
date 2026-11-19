import { atTime } from '@/features/camps/core/campNotifications';
import { dayKey, MIN_MS } from '@/features/camps/core/time';

import type { TimeRange } from '../types';

import { odakCadence, odakPhase, programDay } from './phase';

/**
 * Odak Kampı local notifications (SPEC_ODAK_KAMPI 5.14), pure planning. Texts are always neutral and
 * can't be changed to show details; the screen layer fills them from i18n.
 *   · 15 minutes before each risky range: "Odak zamanı yaklaşıyor. Planın hazır mı?"
 *   · evening check-in on check-in days (core: daily · consolidation: every 2nd day · maintenance: monthly)
 *   · a weekly summary on Sunday evening.
 * The plan uses only times and the programme start (kept outside the vault, no content), so it can be
 * scheduled while the camp is locked.
 */
export const ODAK_HORIZON_DAYS = 7;
export const ODAK_MAX = 20;
export const RISKY_LEAD_MIN = 15;
export const ODAK_TIMES = { checkin: '20:30', weekly: '19:00' } as const;

export interface OdakNotifPlan {
  ranges: TimeRange[];
  programStart: string;
  lastCheckinAt: string | null;
}

export type OdakNotifKind = 'risky' | 'checkin' | 'weekly';

export interface PlannedOdakNotif {
  id: string;
  kind: OdakNotifKind;
  fireAt: Date;
  route: '/odak' | '/odak/checkin' | '/odak/diary';
}

/** Is a check-in expected on this calendar day? */
function checkinDay(programStart: string, day: Date): boolean {
  const noon = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12);
  const cadence = odakCadence(odakPhase(programStart, noon));
  if (cadence === 'daily' || cadence === 'twice_daily') return true;
  if (cadence === 'none') return false;
  return programDay(programStart, noon) % cadence.everyDays === 0;
}

export function planOdakNotifications(o: { now: Date; enabled: boolean; plan: OdakNotifPlan | null; horizonDays?: number }): PlannedOdakNotif[] {
  if (!o.enabled || !o.plan) return [];
  const { now, plan } = o;
  const out: PlannedOdakNotif[] = [];
  const add = (n: PlannedOdakNotif) => {
    if (n.fireAt.getTime() > now.getTime()) out.push(n);
  };
  const checkedToday = plan.lastCheckinAt !== null && dayKey(new Date(plan.lastCheckinAt)) === dayKey(now);
  for (let i = 0; i < (o.horizonDays ?? ODAK_HORIZON_DAYS); i += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const dk = dayKey(day);
    for (const r of plan.ranges) add({ id: `odak-risky-${dk}-${r.from}`, kind: 'risky', fireAt: new Date(atTime(day, r.from).getTime() - RISKY_LEAD_MIN * MIN_MS), route: '/odak' });
    if (checkinDay(plan.programStart, day) && !(i === 0 && checkedToday)) add({ id: `odak-checkin-${dk}`, kind: 'checkin', fireAt: atTime(day, ODAK_TIMES.checkin), route: '/odak/checkin' });
    if (day.getDay() === 0) add({ id: `odak-weekly-${dk}`, kind: 'weekly', fireAt: atTime(day, ODAK_TIMES.weekly), route: '/odak/diary' });
  }
  return out.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, ODAK_MAX);
}

/** A stored plan that can be used (persisted data may be broken). */
export const validPlan = (p: unknown): p is OdakNotifPlan =>
  typeof p === 'object' && p !== null && Array.isArray((p as OdakNotifPlan).ranges) && typeof (p as OdakNotifPlan).programStart === 'string' && !Number.isNaN(Date.parse((p as OdakNotifPlan).programStart));
