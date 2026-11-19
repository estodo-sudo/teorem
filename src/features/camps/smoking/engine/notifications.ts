import type { CampPhase, QuitAttempt } from '../types';

import { HEALTH_MILESTONES } from './milestones';
import { currentPhase, quitStart } from './phase';
import { atTime } from '@/features/camps/core/campNotifications';
import { checkinSlotDays } from '@/features/camps/core/checkinEngine';
import { DAY_MS, dayKey, MIN_MS, ms, startOfDay } from '@/features/camps/core/time';

/**
 * Sigarasız Kamp local notifications (pure planning; the app scheduler turns them into
 * expo-notifications). Phase-aware frequency (spec 4.16):
 *   preparation 1/day · quit-day morning · critical week: morning + evening check-in + risky hour ·
 *   strengthening: 1/day + risky hour · maintenance: about twice a week · plus health milestones and
 *   smoke-free day badges. Discreet mode uses neutral texts (no "sigara" on the lock screen).
 */
export const CAMP_HORIZON_DAYS = 7;
/** iOS keeps at most 64 scheduled notifications; the camp uses at most this many. */
export const CAMP_MAX = 30;
/** The risky-hour reminder fires this many minutes before the busiest diary hour. */
export const RISKY_LEAD_MIN = 10;
export const CAMP_TIMES = { prep: '20:00', quitMorning: '08:30', morning: '09:00', evening: '20:30', daily: '20:30', maintenance: '20:00', milestone: '10:00' } as const;
export const MAINTENANCE_EVERY_DAYS = 3;

export type CampNotifKind = 'prep' | 'quitMorning' | 'checkinMorning' | 'checkinEvening' | 'daily' | 'maintenance' | 'risky' | 'milestone' | 'dayBadge';

export interface PlannedCampNotif {
  id: string;
  kind: CampNotifKind;
  fireAt: Date;
  /** i18n keys under camp.notif.(explicit|discreet). */
  titleKey: string;
  bodyKey: string;
  params?: Record<string, string | number>;
  /** Where a tap opens. */
  route: '/camp' | '/camp/sos' | '/camp/checkin' | '/camp/health' | '/camp/quit-day' | '/camp/rewards';
}

export interface CampNotifInput {
  now: Date;
  enabled: boolean;
  discreet: boolean;
  attempt: QuitAttempt | null;
  /** Busiest hour of the preparation diary (0–23), if known. */
  riskyHour: number | null;
  /** Calendar days (YYYY-MM-DD) with a check-in in the morning / evening slot. */
  checkinMorningDays: string[];
  checkinEveningDays: string[];
  horizonDays?: number;
}

const DAY_BADGE_DAYS = [1, 3, 7, 14, 30, 60, 90] as const;

const at = atTime;
const key = dayKey;

export function planCampNotifications(input: CampNotifInput): PlannedCampNotif[] {
  const { now, attempt } = input;
  if (!input.enabled || !attempt || attempt.status === 'relapsed') return [];
  const style = input.discreet ? 'discreet' : 'explicit';
  const k = (name: string) => ({ titleKey: `camp.notif.${style}.${name}Title`, bodyKey: `camp.notif.${style}.${name}Body` });
  const out: PlannedCampNotif[] = [];
  const horizon = input.horizonDays ?? CAMP_HORIZON_DAYS;
  const quitDay = startOfDay(new Date(quitStart(attempt)));

  for (let i = 0; i < horizon; i += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const dk = key(day);
    // Phase of that day (evaluated at noon so the quit-day boundary is clear).
    const phase: CampPhase = currentPhase(attempt, at(day, '12:00'));
    const sinceQuit = Math.round((day.getTime() - quitDay.getTime()) / DAY_MS);
    const add = (n: Omit<PlannedCampNotif, 'id'>, suffix: string) => {
      if (n.fireAt.getTime() > now.getTime()) out.push({ ...n, id: `camp-${suffix}-${dk}` });
    };
    const risky = () => {
      if (input.riskyHour === null) return;
      const fire = new Date(at(day, `${String(input.riskyHour).padStart(2, '0')}:00`).getTime() - RISKY_LEAD_MIN * MIN_MS);
      add({ kind: 'risky', fireAt: fire, ...k('risky'), route: '/camp/sos' }, 'risky');
    };

    if (phase === 'preparation') add({ kind: 'prep', fireAt: at(day, CAMP_TIMES.prep), ...k('prep'), params: { days: -sinceQuit }, route: '/camp' }, 'prep');
    else if (phase === 'quit_day') add({ kind: 'quitMorning', fireAt: at(day, CAMP_TIMES.quitMorning), ...k('quit'), route: '/camp/quit-day' }, 'quit');
    else if (phase === 'critical_week') {
      if (!input.checkinMorningDays.includes(dk)) add({ kind: 'checkinMorning', fireAt: at(day, CAMP_TIMES.morning), ...k('morning'), route: '/camp/checkin' }, 'morning');
      if (!input.checkinEveningDays.includes(dk)) add({ kind: 'checkinEvening', fireAt: at(day, CAMP_TIMES.evening), ...k('evening'), route: '/camp/checkin' }, 'evening');
      risky();
    } else if (phase === 'strengthening') {
      if (!input.checkinMorningDays.includes(dk) && !input.checkinEveningDays.includes(dk)) add({ kind: 'daily', fireAt: at(day, CAMP_TIMES.daily), ...k('daily'), route: '/camp/checkin' }, 'daily');
      risky();
    } else if (phase === 'maintenance' && sinceQuit % MAINTENANCE_EVERY_DAYS === 0) {
      add({ kind: 'maintenance', fireAt: at(day, CAMP_TIMES.maintenance), ...k('maintenance'), route: '/camp' }, 'maint');
    }

    // Smoke-free day badges (1, 3, 7, … 90 days) on the morning they are reached.
    if (attempt.status === 'active' && (DAY_BADGE_DAYS as readonly number[]).includes(sinceQuit)) {
      add({ kind: 'dayBadge', fireAt: at(day, CAMP_TIMES.milestone), ...k('badge'), params: { days: sinceQuit }, route: '/camp/rewards' }, 'badge');
    }
  }

  // Health milestones that fall inside the horizon (from 2 weeks on; earlier ones are hours away).
  const start = ms(quitStart(attempt));
  const end = now.getTime() + horizon * DAY_MS;
  for (const m of HEALTH_MILESTONES) {
    const t = start + m.afterMs;
    if (m.afterMs >= 14 * DAY_MS && t > now.getTime() && t <= end) {
      out.push({ id: `camp-health-${m.id}`, kind: 'milestone', fireAt: new Date(t), ...k('health'), params: { id: m.id }, route: '/camp/health' });
    }
  }

  return out.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, CAMP_MAX);
}

/** Calendar days with a morning (before 15:00) / evening check-in. */
export { checkinSlotDays };
