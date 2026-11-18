import { makeId } from '@/lib/random';

import { calendarDaysBetween, ms } from './engine/time';
import type { CampBadge, CampEvents, CampProfile, CheckIn, CigaretteLog, CravingEvent, IfThenPlan, MissionProgress, PriceEntry, QuitAttempt, RewardGoal, SkillProgress } from './types';

/** Persisted (MMKV) part of the camp. Event logs live in SQLite (see CampEvents). */
export interface CampState {
  profile: CampProfile | null;
  prices: PriceEntry[];
  attempts: QuitAttempt[];
  plans: IfThenPlan[];
  missions: MissionProgress[];
  skills: SkillProgress[];
  rewards: RewardGoal[];
  badges: CampBadge[];
  /** Health milestones already celebrated. */
  seenMilestoneIds: string[];
  /** Quit-day checklist ticks, for one attempt. */
  quitDayChecks: { attemptId: string; ids: string[] } | null;
  /** Camp notifications on/off (main app reminders have their own switch). */
  notifyEnabled: boolean;
}

export const defaultCampState = (): CampState => ({ profile: null, prices: [], attempts: [], plans: [], missions: [], skills: [], rewards: [], badges: [], seenMilestoneIds: [], quitDayChecks: null, notifyEnabled: true });
export const emptyCampEvents = (): CampEvents => ({ cigarettes: [], cravings: [], checkins: [] });

/** Preparation before the quit day: 3–14 days (default 7). After a relapse it is shortened to 3. */
export const MIN_PREP_DAYS = 3;
export const MAX_PREP_DAYS = 14;
export const DEFAULT_PREP_DAYS = 7;
export const RELAPSE_PREP_DAYS = 3;

/** The attempt in progress (preparing or active), if any. */
export const currentAttempt = (s: CampState): QuitAttempt | null => s.attempts.find((a) => a.status === 'preparing' || a.status === 'active') ?? null;

/** The attempt the camp screens show: the one in progress, else a graduated one (freedom phase). */
export const campAttempt = (s: CampState): QuitAttempt | null => currentAttempt(s) ?? s.attempts.filter((a) => a.status === 'graduated').pop() ?? null;

/** The latest attempt of any status (for the graduated / relapsed screens). */
export const latestAttempt = (s: CampState): QuitAttempt | null => s.attempts[s.attempts.length - 1] ?? null;

/** Quit day N calendar days from now, clamped to 3–14, at local midnight. */
export function quitDateIn(days: number, now: Date): string {
  const d = Math.min(MAX_PREP_DAYS, Math.max(MIN_PREP_DAYS, Math.round(days)));
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + d).toISOString();
}

/** Is a chosen quit day within the allowed 3–14 days? */
export const validQuitDate = (iso: string, now: Date) => {
  const d = calendarDaysBetween(now, new Date(iso));
  return d >= MIN_PREP_DAYS && d <= MAX_PREP_DAYS;
};

/**
 * A new attempt. "Already quit" users pass `quitAt` (their last cigarette) and start active;
 * everyone else prepares until `plannedQuitDate`. Earlier attempts are kept ("Deneme #2").
 */
export function newAttempt(attempts: QuitAttempt[], opts: { plannedQuitDate: string; quitAt?: string }, now: Date): QuitAttempt {
  const nowIso = now.toISOString();
  return {
    id: makeId('att'),
    attemptNo: attempts.length + 1,
    startedAt: nowIso,
    plannedQuitDate: opts.quitAt ?? opts.plannedQuitDate,
    actualQuitDateTime: opts.quitAt,
    status: opts.quitAt ? 'active' : 'preparing',
  };
}

/** A preparing attempt becomes active once its quit day starts (or when the user quits early). */
export function activateIfDue(a: QuitAttempt, now: Date): QuitAttempt {
  if (a.status !== 'preparing') return a;
  if (now.getTime() < ms(a.plannedQuitDate)) return a;
  return { ...a, status: 'active', actualQuitDateTime: a.plannedQuitDate };
}

/** Quit right now (before the planned day). */
export const quitNow = (a: QuitAttempt, now: Date): QuitAttempt => ({ ...a, status: 'active', actualQuitDateTime: now.toISOString(), plannedQuitDate: now.toISOString() });

/** Relapse ("smoking regularly again"): the attempt ends; its data stays. */
export const endAsRelapse = (a: QuitAttempt, now: Date): QuitAttempt => ({ ...a, status: 'relapsed', endedAt: now.toISOString() });

/** Day 90 reached: graduation. */
export const graduate = (a: QuitAttempt, now: Date): QuitAttempt => ({ ...a, status: 'graduated', endedAt: now.toISOString() });

// ── Sanitizing (persisted / imported data) ──────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const list = <T>(v: unknown, ok: (x: Record<string, unknown>) => boolean): T[] => (Array.isArray(v) ? (v.filter((x) => isObj(x) && ok(x)) as T[]) : []);
const score5 = (v: unknown) => isNum(v) && v >= 1 && v <= 5 && Number.isInteger(v);

const ATTEMPT_STATUS = ['preparing', 'active', 'relapsed', 'graduated'];

function sanitizeProfile(v: unknown): CampProfile | null {
  if (!isObj(v)) return null;
  if (!Array.isArray(v.products) || !isNum(v.perDay) || !isNum(v.hsiScore) || !isIso(v.createdAt)) return null;
  return v as unknown as CampProfile;
}

/** Accepts persisted or imported data; malformed parts fall back to defaults. */
export function sanitizeCampState(raw: unknown): CampState {
  const d = defaultCampState();
  if (!isObj(raw)) return d;
  const attempts = list<QuitAttempt>(raw.attempts, (a) => isStr(a.id) && isNum(a.attemptNo) && isIso(a.startedAt) && isIso(a.plannedQuitDate) && ATTEMPT_STATUS.includes(a.status as string));
  // At most one attempt in progress: keep the latest, close older open ones.
  let open = false;
  for (let i = attempts.length - 1; i >= 0; i -= 1) {
    const a = attempts[i]!;
    if (a.status === 'preparing' || a.status === 'active') {
      if (open) attempts[i] = { ...a, status: 'relapsed', endedAt: a.endedAt ?? a.startedAt };
      open = true;
    }
  }
  return {
    profile: sanitizeProfile(raw.profile),
    prices: list<PriceEntry>(raw.prices, (p) => isIso(p.from) && isNum(p.packPriceTRY) && p.packPriceTRY >= 0 && isNum(p.packSize) && p.packSize > 0),
    attempts,
    plans: list<IfThenPlan>(raw.plans, (p) => isStr(p.id) && isStr(p.trigger) && isStr(p.ifText) && isStr(p.thenText)).map((p) => ({ ...p, usedCount: isNum(p.usedCount) ? p.usedCount : 0 })),
    missions: list<MissionProgress>(raw.missions, (m) => isStr(m.missionId) && isIso(m.completedAt)),
    skills: list<SkillProgress>(raw.skills, (m) => isStr(m.lessonId) && isIso(m.completedAt)),
    rewards: list<RewardGoal>(raw.rewards, (r) => isStr(r.id) && isStr(r.title) && isNum(r.amountTRY) && r.amountTRY > 0),
    badges: list<CampBadge>(raw.badges, (b) => isStr(b.id)),
    seenMilestoneIds: Array.isArray(raw.seenMilestoneIds) ? raw.seenMilestoneIds.filter(isStr) : [],
    notifyEnabled: raw.notifyEnabled !== false,
    quitDayChecks: isObj(raw.quitDayChecks) && isStr(raw.quitDayChecks.attemptId) && Array.isArray(raw.quitDayChecks.ids) ? { attemptId: raw.quitDayChecks.attemptId, ids: raw.quitDayChecks.ids.filter(isStr) } : null,
  };
}

export function sanitizeCampEvents(raw: unknown): CampEvents {
  if (!isObj(raw)) return emptyCampEvents();
  return {
    cigarettes: list<CigaretteLog>(raw.cigarettes, (l) => isStr(l.id) && isStr(l.attemptId) && isIso(l.at) && typeof l.isSlip === 'boolean' && (l.mood === undefined || score5(l.mood)) && (l.need === undefined || score5(l.need))),
    cravings: list<CravingEvent>(raw.cravings, (c) => isStr(c.id) && isIso(c.at) && isNum(c.intensityBefore) && Array.isArray(c.toolUsed) && ['resisted', 'still_hard', 'smoked'].includes(c.outcome as string) && isNum(c.durationSec)),
    checkins: list<CheckIn>(raw.checkins, (c) => isStr(c.id) && isIso(c.at) && typeof c.smoked === 'boolean' && isNum(c.cravingCount) && score5(c.mood) && Array.isArray(c.symptoms)),
  };
}
