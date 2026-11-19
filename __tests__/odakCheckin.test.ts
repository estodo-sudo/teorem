import checkinJson from '@/content/camps/odak/checkin.tr.json';
import referralJson from '@/content/camps/odak/referral.tr.json';
import relapseJson from '@/content/camps/odak/relapse.tr.json';
import slipJson from '@/content/camps/odak/slip.tr.json';
import sourcesJson from '@/content/camps/odak/sources.json';
import { buildCheckin, checkedInToday, lowMoodAlert, odakCheckinDue, programStart, referralReason, relapseActive, restartAtBoundaries, slipDays } from '@/features/camps/odak/engine/checkin';
import { goalCounter } from '@/features/camps/odak/engine/goals';
import { odakPhase, programDay } from '@/features/camps/odak/engine/phase';
import { useOdakStore } from '@/features/camps/odak/store';
import type { BehaviorEvent, GoalConfig, OdakCheckIn, ScreeningResult, Score5 } from '@/features/camps/odak/types';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('@/features/camps/odak/privacy/device', () => {
  const { createMemoryVaultBackend, createVault } = jest.requireActual('@/features/camps/odak/privacy/vault');
  const mockVault = createVault(createMemoryVaultBackend(), { seal: async (t: string) => `s:${Buffer.from(t).toString('base64')}`, open: async (s: string) => Buffer.from(s.slice(2), 'base64').toString() });
  return { odakVault: () => mockVault, wipeOdakSecrets: async () => mockVault.clear() };
});

const at = (d: number, h = 21) => new Date(2026, 10, d, h, 0);
const goal = (g: Partial<GoalConfig> = {}): GoalConfig => ({ porn: 'quit', mast: 'none', startedAt: at(1, 10).toISOString(), ...g });
let n = 0;
const chk = (d: Date, o: Partial<OdakCheckIn> = {}): OdakCheckIn => ({ id: `c${(n += 1)}`, at: d.toISOString(), onGoal: true, urgeCount: 0, mood: 3, sleep: 3, loneliness: 2, ...o });
const slip = (d: Date): BehaviorEvent => ({ id: `e${(n += 1)}`, at: d.toISOString(), kind: 'porn', isSlip: true });

describe('daily check-in', () => {
  it('core programme: once a day, from the evening', () => {
    const g = goal();
    expect(odakCheckinDue([], g, at(10, 12))).toBe(false);
    expect(odakCheckinDue([], g, at(10, 18))).toBe(true);
    expect(odakCheckinDue([chk(at(10, 18))], g, at(10, 20))).toBe(false);
    expect(checkedInToday([chk(at(10, 9))], at(10, 22))).toBe(true);
  });
  it('consolidation: about three times a week', () => {
    const g = goal({ startedAt: at(1, 10).toISOString() });
    const day50 = new Date(2026, 10, 50, 9);
    expect(odakPhase(programStart(g), day50)).toBe('consolidation');
    expect(odakCheckinDue([chk(new Date(2026, 10, 49, 9))], g, day50)).toBe(false);
    expect(odakCheckinDue([chk(new Date(2026, 10, 48, 9))], g, day50)).toBe(true);
  });
  it('builds a check-in and trims the value text', () => {
    const c = buildCheckin({ onGoal: false, urgeCount: 2.4, mood: 2, sleep: 4, loneliness: 3, valueAction: '  Yürüdüm  ' }, at(10));
    expect(c).toMatchObject({ onGoal: false, urgeCount: 2, valueAction: 'Yürüdüm' });
    expect('valueAction' in buildCheckin({ onGoal: true, urgeCount: 0, mood: 3, sleep: 3, loneliness: 3, valueAction: '  ' }, at(10))).toBe(false);
  });
  it('safety rule: three days in a row of the lowest mood', () => {
    const low = [8, 9, 10].map((d) => chk(at(d), { mood: 1 as Score5 }));
    expect(lowMoodAlert(low, at(10, 22))).toBe(true);
    expect(lowMoodAlert(low.slice(1), at(10, 22))).toBe(false);
  });
});

describe('relapse', () => {
  it('several slip days in a row (from logs or check-ins) start the relapse flow once', () => {
    expect([...slipDays([slip(at(8))], [chk(at(9), { onGoal: false })])].sort()).toEqual(['2026-11-08', '2026-11-09']);
    const events = [slip(at(8)), slip(at(9))];
    const checkins = [chk(at(10), { onGoal: false })];
    expect(relapseActive(events, checkins, at(10, 22))).toBe(true);
    expect(relapseActive(events, checkins, at(11, 9))).toBe(true);
    expect(relapseActive(events, [], at(10, 22))).toBe(false);
    expect(relapseActive(events, checkins, at(10, 22), at(10, 22).toISOString())).toBe(false);
    expect(relapseActive(events, checkins, at(10, 22), at(5).toISOString())).toBe(true);
  });
  it('back to phase 2 keeps the counters', () => {
    const g = goal();
    const events = [slip(at(9)), slip(at(10))];
    const r = restartAtBoundaries(g, at(20, 9));
    expect(programDay(programStart(r), at(20, 9))).toBe(8);
    expect(odakPhase(programStart(r), at(20, 9))).toBe('boundaries');
    expect(r.startedAt).toBe(g.startedAt);
    expect(goalCounter({ target: 'porn', mode: 'quit' }, r.startedAt, events, at(20, 9)).total).toBe(18);
  });
});

describe('specialist card', () => {
  const bps = (score: number): ScreeningResult => ({ id: `s${(n += 1)}`, at: at(1).toISOString(), type: 'BPS', score, answers: [] });
  const phq = (score: number): ScreeningResult => ({ id: `s${(n += 1)}`, at: at(1).toISOString(), type: 'PHQ2', score, answers: [] });
  it('shows for 3+ slip days in 14 days, a high screen with a high mood score, or a low-mood run', () => {
    expect(referralReason({ events: [slip(at(2)), slip(at(5)), slip(at(12))], checkins: [], screenings: [], now: at(14) })).toBe('slips');
    expect(referralReason({ events: [slip(at(1)), slip(at(5)), slip(at(12))], checkins: [], screenings: [], now: at(20) })).toBeNull();
    expect(referralReason({ events: [], checkins: [], screenings: [bps(6), phq(4)], now: at(14) })).toBe('screen');
    expect(referralReason({ events: [], checkins: [], screenings: [bps(6), phq(1)], now: at(14) })).toBeNull();
    expect(referralReason({ events: [], checkins: [8, 9, 10].map((d) => chk(at(d), { mood: 1 as Score5 })), screenings: [], now: at(10, 22) })).toBe('mood');
  });
});

describe('store', () => {
  it('keeps check-ins, a changed goal, new plans and the relapse mark after reload', async () => {
    await useOdakStore.getState().wipe();
    await useOdakStore.getState().enrol({ profile: { reasons: [], createdAt: at(1).toISOString() } as never, goal: goal(), plans: [], screenings: [] });
    await useOdakStore.getState().logCheckin(chk(at(10), { onGoal: false }));
    await useOdakStore.getState().updateGoal(restartAtBoundaries(goal({ porn: 'reduce', pornWeeklyMax: 2 }), at(10)));
    await useOdakStore.getState().addPlan({ id: 'p1', trigger: 'stress', ifText: 'x', thenText: 'y', createdAt: at(10).toISOString() });
    await useOdakStore.getState().markRelapseHandled(at(10));
    useOdakStore.setState({ checkins: [], goal: null, plans: [], relapseHandledAt: null, ready: false });
    await useOdakStore.getState().hydrate();
    const s = useOdakStore.getState();
    expect(s.checkins).toHaveLength(1);
    expect(s.goal).toMatchObject({ porn: 'reduce', pornWeeklyMax: 2 });
    expect(s.goal?.programStartedAt).toBeDefined();
    expect(s.plans.map((p) => p.id)).toEqual(['p1']);
    expect(s.relapseHandledAt).toBe(at(10).toISOString());
  });
});

describe('check-in, slip and relapse content (anti-shame)', () => {
  const all = [checkinJson, slipJson, relapseJson, referralJson];
  it('is sourced, unreviewed and judgement-free', () => {
    const ids = new Set(sourcesJson.map((s) => s.id));
    for (const c of all) {
      expect(c.reviewed).toBe(false);
      for (const id of c.sourceIds) expect(ids.has(id)).toBe(true);
      const text = JSON.stringify(c);
      for (const b of [/başarısız/i, /pes ettin/i, /sıfırdan başla/i, /temiz gün/i, /kirli/i, /günah/i, /zayıf irade/i, /%\s?\d/]) expect(text).not.toMatch(b);
    }
    expect(slipJson.notErased.title).toBe('Bir kayma, bütün emeğin silindiği anlamına gelmez');
    expect(relapseJson.intro.title).toBe('Yeniden başlamak bir beceridir');
    expect(slipJson.compassion.seconds).toBe(60);
  });
});
