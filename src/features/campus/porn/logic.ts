/**
 * Özgür Zihin Kampüsü (problematic pornography use) — pure logic.
 *
 * - Counter: time since the last lapse (or the start), towards a 7/30/90-day goal.
 * - Lapse chain analysis: each lapse records device, feeling and first step; with the
 *   hour of the lapse these build a personal risk map and matching recommendations.
 * - ACT values compass: up to three values, shown as a reminder of what matters.
 * - Brief Pornography Screen: 5 items scored 0–2, total 0–10, 4+ = possible problematic use.
 */
export const DAY_MS = 24 * 60 * 60 * 1000;
export const PC_GOALS = [7, 15, 30, 60, 90] as const;
/** Favourite everyday activities to pick at enrolment (shown first at urge time). */
export const MIN_ACTIVITIES = 3;
export const BPS_QUESTIONS = 5;
export const BPS_POSITIVE = 4;
export const MAX_VALUES = 3;

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export interface PcLapse {
  at: string;
  deviceId: string | null;
  feelingId: string | null;
  firstStepId: string | null;
}

export interface PcUrge {
  at: string;
  /** The activity done instead (null when none was picked). */
  activityId: string | null;
}

export interface PcState {
  setupDone: boolean;
  /** Start of the current plan (ISO). */
  startedAt: string | null;
  firstStartedAt: string | null;
  goalDays: number;
  /** BPS answers (0–2 each); null when skipped. */
  bps: number[] | null;
  /** "Mostly a conflict with my values" answer. */
  valuesConflict: boolean | null;
  valueIds: string[];
  envDoneIds: string[];
  stepDoneIds: string[];
  lapses: PcLapse[];
  /** Favourite everyday activities, shown first on the urge screen. */
  activityIds: string[];
  /** Urges ridden out on the urge screen, with the activity that helped. */
  urges: PcUrge[];
}

export const defaultPcState = (): PcState => ({
  setupDone: false,
  startedAt: null,
  firstStartedAt: null,
  goalDays: 30,
  bps: null,
  valuesConflict: null,
  valueIds: [],
  envDoneIds: [],
  stepDoneIds: [],
  lapses: [],
  activityIds: [],
  urges: [],
});

export const pcPhase = (s: PcState): 'setup' | 'active' => (s.setupDone && s.startedAt ? 'active' : 'setup');

const time = (iso: string) => new Date(iso).getTime();

/** Time since the last lapse after the start (or since the start). */
export function cleanMs(s: PcState, now: Date): number {
  if (!s.startedAt) return 0;
  const start = time(s.startedAt);
  const last = s.lapses.map((l) => time(l.at)).filter((t) => t >= start).sort((a, b) => b - a)[0];
  return Math.max(0, now.getTime() - (last ?? start));
}
export const cleanDays = (s: PcState, now: Date) => Math.floor(cleanMs(s, now) / DAY_MS);
export const goalReached = (s: PcState, now: Date) => cleanDays(s, now) >= s.goalDays;

/** Longest stretch without a lapse since the first start, in whole days. */
export function longestCleanDays(s: PcState, now: Date): number {
  if (!s.firstStartedAt) return 0;
  const start = time(s.firstStartedAt);
  const points = [start, ...s.lapses.map((l) => time(l.at)).filter((t) => t >= start).sort((a, b) => a - b), now.getTime()];
  let best = 0;
  for (let i = 1; i < points.length; i++) best = Math.max(best, points[i]! - points[i - 1]!);
  return Math.floor(best / DAY_MS);
}

export const bpsScore = (answers: number[] | null) => (answers ? answers.reduce((a, b) => a + b, 0) : 0);
export const bpsPositive = (answers: number[] | null) => !!answers && bpsScore(answers) >= BPS_POSITIVE;

export function bpsBand<B extends { id: string; max: number }>(score: number, bands: B[]): B | undefined {
  return [...bands].sort((a, b) => a.max - b.max).find((b) => score <= b.max) ?? bands[bands.length - 1];
}

/** Local time of day: morning 05–12, afternoon 12–17, evening 17–22, night 22–05. */
export function dayPartOf(d: Date): DayPart {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

function topOf(ids: (string | null)[]): { id: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const id of ids) if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  let best: { id: string; count: number } | null = null;
  for (const [id, count] of counts) if (!best || count > best.count) best = { id, count };
  return best;
}

export interface RiskMap {
  total: number;
  device: { id: string; count: number } | null;
  time: { id: DayPart; count: number } | null;
  feeling: { id: string; count: number } | null;
  firstStep: { id: string; count: number } | null;
}

/** The most common device, time of day, feeling and first step across all lapses. */
export function riskMap(lapses: PcLapse[]): RiskMap {
  const t = topOf(lapses.map((l) => dayPartOf(new Date(l.at))));
  return {
    total: lapses.length,
    device: topOf(lapses.map((l) => l.deviceId)),
    time: t ? { id: t.id as DayPart, count: t.count } : null,
    feeling: topOf(lapses.map((l) => l.feelingId)),
    firstStep: topOf(lapses.map((l) => l.firstStepId)),
  };
}

/** Recommendation keys for a risk map, most specific first (first step, feeling, device, time). */
export function recommendationKeys(m: RiskMap): string[] {
  const keys: string[] = [];
  if (m.firstStep) keys.push(`first:${m.firstStep.id}`);
  if (m.feeling) keys.push(`feeling:${m.feeling.id}`);
  if (m.device) keys.push(`device:${m.device.id}`);
  if (m.time) keys.push(`time:${m.time.id}`);
  return keys;
}

export const PC_GUIDE_STEP_IDS = ['what', 'values', 'digital', 'urges', 'lapse', 'support'] as const;

export function listProgress(ids: string[], doneIds: string[]) {
  const done = ids.filter((id) => doneIds.includes(id)).length;
  return { done, total: ids.length, complete: ids.length > 0 && done === ids.length };
}

/** Guards imported data. */
export function sanitizePcState(raw: unknown): PcState {
  const d = defaultPcState();
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return d;
  const r = raw as Record<string, unknown>;
  const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const validIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(new Date(v).getTime());
  const startedAt = validIso(r.startedAt) ? r.startedAt : null;
  const str = (v: unknown) => (typeof v === 'string' ? v : null);
  return {
    setupDone: r.setupDone === true && startedAt !== null,
    startedAt,
    firstStartedAt: validIso(r.firstStartedAt) ? r.firstStartedAt : startedAt,
    goalDays: typeof r.goalDays === 'number' && (PC_GOALS as readonly number[]).includes(r.goalDays) ? r.goalDays : d.goalDays,
    bps: Array.isArray(r.bps) && r.bps.length === BPS_QUESTIONS && r.bps.every((x) => x === 0 || x === 1 || x === 2) ? (r.bps as number[]) : null,
    valuesConflict: typeof r.valuesConflict === 'boolean' ? r.valuesConflict : null,
    valueIds: strArr(r.valueIds).slice(0, MAX_VALUES),
    envDoneIds: strArr(r.envDoneIds),
    stepDoneIds: strArr(r.stepDoneIds),
    lapses: Array.isArray(r.lapses)
      ? r.lapses
          .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null && validIso((x as Record<string, unknown>).at))
          .map((x) => ({ at: x.at as string, deviceId: str(x.deviceId), feelingId: str(x.feelingId), firstStepId: str(x.firstStepId) }))
      : [],
    activityIds: strArr(r.activityIds),
    // Older backups stored only the times (urgesBeaten: string[]).
    urges: Array.isArray(r.urges)
      ? r.urges
          .filter((u): u is Record<string, unknown> => typeof u === 'object' && u !== null && validIso((u as Record<string, unknown>).at))
          .map((u) => ({ at: u.at as string, activityId: str(u.activityId) }))
      : strArr(r.urgesBeaten)
          .filter(validIso)
          .map((at) => ({ at, activityId: null })),
  };
}
