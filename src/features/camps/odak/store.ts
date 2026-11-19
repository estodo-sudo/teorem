import { create } from 'zustand';

import { makeId } from '@/lib/random';

import { isSlip } from './engine/goals';
import { odakVault, wipeOdakSecrets } from './privacy/device';
import { useOdakLockStore } from './privacy/lockStore';
import { defaultBoundaries } from './engine/boundaries';
import { defaultRebuild, type RebuildState } from './engine/rebuild';
import type { BehaviorEvent, BehaviorKind, BoundaryConfig, FutureSelfLetter, GoalConfig, OdakCheckIn, OdakPlan, OdakProfile, ScreeningResult, UrgeEvent } from './types';

/**
 * Odak Kampı data in memory, loaded from (and written through to) the encrypted vault. Not persisted
 * by zustand: there is no plain-text copy anywhere. Only the neutral "enrolled" flag is stored
 * outside the vault (lock store), so the lock knows whether there is anything to protect.
 */
interface OdakData {
  profile: OdakProfile | null;
  goal: GoalConfig | null;
  plans: OdakPlan[];
  screenings: ScreeningResult[];
  events: BehaviorEvent[];
  urges: UrgeEvent[];
  letter: FutureSelfLetter | null;
  checkins: OdakCheckIn[];
  /** When the relapse flow was last completed. */
  relapseHandledAt: string | null;
  boundaries: BoundaryConfig;
  missionsDone: { id: string; at: string }[];
  skillsDone: { id: string; at: string; quizScore?: number }[];
  libraryRead: { id: string; at: string }[];
  rebuild: RebuildState;
  badges: { id: string; at: string }[];
}

interface OdakStore extends OdakData {
  ready: boolean;
  hydrate: () => Promise<void>;
  enrol: (d: { profile: OdakProfile; goal: GoalConfig; plans: OdakPlan[]; screenings: ScreeningResult[] }) => Promise<void>;
  /** Logs a behaviour now; returns it (isSlip says whether it went against the goal). */
  logBehavior: (kind: BehaviorKind, at?: Date, details?: Pick<BehaviorEvent, 'trigger' | 'emotionBefore' | 'emotionAfter' | 'satisfaction'>) => Promise<BehaviorEvent>;
  logUrge: (u: UrgeEvent) => Promise<void>;
  saveLetter: (text: string) => Promise<void>;
  logCheckin: (c: OdakCheckIn) => Promise<void>;
  updateGoal: (g: GoalConfig) => Promise<void>;
  addPlan: (p: OdakPlan) => Promise<void>;
  markRelapseHandled: (at?: Date) => Promise<void>;
  saveBoundaries: (b: BoundaryConfig) => Promise<void>;
  completeMission: (id: string) => Promise<void>;
  completeLesson: (id: string, quizScore?: number) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  saveRebuild: (r: RebuildState) => Promise<void>;
  /** Stores newly earned badges (earned ones are never removed). */
  unlockBadges: (ids: string[]) => Promise<void>;
  updateProfile: (patch: Partial<OdakProfile>) => Promise<void>;
  wipe: () => Promise<void>;
}

const empty = (): OdakData => ({
  profile: null,
  goal: null,
  plans: [],
  screenings: [],
  events: [],
  urges: [],
  letter: null,
  checkins: [],
  relapseHandledAt: null,
  boundaries: defaultBoundaries(),
  missionsDone: [],
  skillsDone: [],
  libraryRead: [],
  rebuild: defaultRebuild(),
  badges: [],
});

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const byAt = <T extends { at?: string; createdAt?: string }>(a: T, b: T) => Date.parse(a.at ?? a.createdAt ?? '') - Date.parse(b.at ?? b.createdAt ?? '');

function sanitizeRebuild(v: unknown): RebuildState {
  if (!isObj(v)) return defaultRebuild();
  const strs = (x: unknown) => (Array.isArray(x) ? x.filter((y): y is string => typeof y === 'string') : []);
  const activities: Record<string, string[]> = {};
  if (isObj(v.activities)) for (const [k, list] of Object.entries(v.activities)) activities[k] = strs(list);
  return { activities, sleep: strs(v.sleep), connectionWeeks: strs(v.connectionWeeks) };
}

/** Accepts decrypted vault contents; malformed parts fall back to empty. */
export function sanitizeOdak(docs: Record<string, unknown>, lists: Record<string, unknown[]>): OdakData {
  const p = docs.profile;
  const g = docs.goal;
  const profile = isObj(p) && Array.isArray(p.reasons) && typeof p.createdAt === 'string' ? (p as unknown as OdakProfile) : null;
  const goal = isObj(g) && typeof g.porn === 'string' && typeof g.mast === 'string' && typeof g.startedAt === 'string' ? (g as unknown as GoalConfig) : null;
  const plans = (lists.plans ?? []).filter((x): x is OdakPlan => isObj(x) && typeof x.id === 'string' && typeof x.thenText === 'string').sort(byAt);
  const screenings = (lists.screenings ?? []).filter((x): x is ScreeningResult => isObj(x) && typeof x.id === 'string' && typeof x.score === 'number').sort(byAt);
  const KINDS = ['porn', 'mast', 'both'];
  const events = (lists.events ?? []).filter((x): x is BehaviorEvent => isObj(x) && typeof x.id === 'string' && typeof x.at === 'string' && !Number.isNaN(Date.parse(x.at)) && KINDS.includes(x.kind as string)).sort(byAt);
  const OUTCOMES = ['managed', 'still_hard', 'slipped'];
  const urges = (lists.urges ?? [])
    .filter((x): x is UrgeEvent => isObj(x) && typeof x.id === 'string' && typeof x.at === 'string' && typeof x.intensityBefore === 'number' && OUTCOMES.includes(x.outcome as string) && Array.isArray(x.toolsUsed))
    .sort(byAt);
  const l = docs.letter;
  const letter = isObj(l) && typeof l.text === 'string' && typeof l.updatedAt === 'string' ? (l as unknown as FutureSelfLetter) : null;
  const checkins = (lists.checkins ?? []).filter((x): x is OdakCheckIn => isObj(x) && typeof x.id === 'string' && typeof x.at === 'string' && typeof x.onGoal === 'boolean' && typeof x.mood === 'number').sort(byAt);
  const r = docs.relapse;
  const relapseHandledAt = isObj(r) && typeof r.handledAt === 'string' ? r.handledAt : null;
  const bd = docs.boundaries;
  const boundaries: BoundaryConfig = isObj(bd) && Array.isArray(bd.checklist) && isObj(bd.reminder) && Array.isArray(bd.reminder.packages) ? { ...defaultBoundaries(), ...(bd as unknown as BoundaryConfig) } : defaultBoundaries();
  const done = (k: string) => (lists[k] ?? []).filter((x): x is { id: string; at: string } => isObj(x) && typeof x.id === 'string' && typeof x.at === 'string');
  return {
    profile,
    goal,
    plans,
    screenings,
    events,
    urges,
    letter,
    checkins,
    relapseHandledAt,
    boundaries,
    missionsDone: done('missionsDone'),
    skillsDone: done('skillsDone'),
    libraryRead: done('libraryRead'),
    rebuild: sanitizeRebuild(docs.rebuild),
    badges: done('badges'),
  };
}

export const useOdakStore = create<OdakStore>()((set) => ({
  ...empty(),
  ready: false,
  hydrate: async () => {
    const { docs, lists } = await odakVault().load();
    set({ ...sanitizeOdak(docs, lists), ready: true });
  },
  enrol: async ({ profile, goal, plans, screenings }) => {
    const v = odakVault();
    await v.setDoc('profile', profile);
    await v.setDoc('goal', goal);
    for (const p of plans) await v.put('plans', p);
    for (const s of screenings) await v.put('screenings', s);
    set({ ...empty(), profile, goal, plans, screenings, ready: true });
    useOdakLockStore.getState().setEnrolled(true);
  },
  logBehavior: async (kind, at, details = {}) => {
    const when = at ?? new Date();
    const s = useOdakStore.getState();
    const extra = Object.fromEntries(Object.entries(details).filter(([, v]) => v !== undefined && v !== null));
    const e: BehaviorEvent = { id: makeId('evt'), at: when.toISOString(), kind, ...extra, isSlip: s.goal ? isSlip(s.goal, kind, s.events, when) : false };
    await odakVault().put('events', e);
    set((x) => ({ events: [...x.events, e] }));
    return e;
  },
  logUrge: async (u) => {
    await odakVault().put('urges', u);
    set((x) => ({ urges: [...x.urges, u] }));
  },
  saveLetter: async (text) => {
    const letter = { text: text.slice(0, 2000), updatedAt: new Date().toISOString() };
    await odakVault().setDoc('letter', letter);
    set({ letter });
  },
  logCheckin: async (c) => {
    await odakVault().put('checkins', c);
    set((x) => ({ checkins: [...x.checkins, c] }));
  },
  updateGoal: async (g) => {
    await odakVault().setDoc('goal', g);
    set({ goal: g });
  },
  addPlan: async (p) => {
    await odakVault().put('plans', p);
    set((x) => ({ plans: [...x.plans, p] }));
  },
  markRelapseHandled: async (at) => {
    const handledAt = (at ?? new Date()).toISOString();
    await odakVault().setDoc('relapse', { handledAt });
    set({ relapseHandledAt: handledAt });
  },
  saveBoundaries: async (b) => {
    await odakVault().setDoc('boundaries', b);
    set({ boundaries: b });
  },
  completeMission: async (id) => {
    if (useOdakStore.getState().missionsDone.some((m) => m.id === id)) return;
    const row = { id, at: new Date().toISOString() };
    await odakVault().put('missionsDone', row);
    set((x) => ({ missionsDone: [...x.missionsDone, row] }));
  },
  completeLesson: async (id, quizScore) => {
    const row = { id, at: new Date().toISOString(), ...(quizScore !== undefined ? { quizScore } : {}) };
    await odakVault().put('skillsDone', row);
    set((x) => ({ skillsDone: [...x.skillsDone.filter((s) => s.id !== id), row] }));
  },
  markRead: async (id) => {
    if (useOdakStore.getState().libraryRead.some((r) => r.id === id)) return;
    const row = { id, at: new Date().toISOString() };
    await odakVault().put('libraryRead', row);
    set((x) => ({ libraryRead: [...x.libraryRead, row] }));
  },
  unlockBadges: async (ids) => {
    const have = new Set(useOdakStore.getState().badges.map((b) => b.id));
    const at = new Date().toISOString();
    const rows = ids.filter((id) => !have.has(id)).map((id) => ({ id, at }));
    for (const r of rows) await odakVault().put('badges', r);
    if (rows.length) set((x) => ({ badges: [...x.badges, ...rows] }));
  },
  saveRebuild: async (r) => {
    await odakVault().setDoc('rebuild', r);
    set({ rebuild: r });
  },
  updateProfile: async (patch) => {
    const cur = useOdakStore.getState().profile;
    if (!cur) return;
    const profile = { ...cur, ...patch };
    await odakVault().setDoc('profile', profile);
    set({ profile });
  },
  wipe: async () => {
    await wipeOdakSecrets();
    set({ ...empty(), ready: true });
    useOdakLockStore.getState().reset();
  },
}));

/** Keeps the neutral notification plan (times only) in step with the decrypted data. */
useOdakStore.subscribe((s, prev) => {
  if (!s.ready || !s.goal) return;
  if (s.goal === prev.goal && s.profile === prev.profile && s.checkins === prev.checkins && prev.ready) return;
  const last = s.checkins[s.checkins.length - 1];
  useOdakLockStore.getState().setNotifPlan({ ranges: s.profile?.riskyHours ?? [], programStart: s.goal.programStartedAt ?? s.goal.startedAt, lastCheckinAt: last?.at ?? null });
});
