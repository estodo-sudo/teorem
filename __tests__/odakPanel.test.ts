import panelJson from '@/content/camps/odak/panel.tr.json';
import sourcesJson from '@/content/camps/odak/sources.json';
import { fill } from '@/features/camps/odak/content';
import { goalCounter, goalCounters, isSlip, targetsOf, weekStart } from '@/features/camps/odak/engine/goals';
import { daysToNextOdakPhase, odakCadence, odakPhase, programDay, programProgress, screeningDue } from '@/features/camps/odak/engine/phase';
import { CAMPS } from '@/features/camps/registry';
import type { BehaviorEvent, BehaviorKind, GoalConfig } from '@/features/camps/odak/types';
import { useOdakStore } from '@/features/camps/odak/store';
import tr from '@/i18n/tr.json';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('@/features/camps/odak/privacy/device', () => {
  const { createMemoryVaultBackend, createVault } = jest.requireActual('@/features/camps/odak/privacy/vault');
  const mockVault = createVault(createMemoryVaultBackend(), { seal: async (t: string) => `x${t.length}:${Buffer.from(t).toString('base64')}`, open: async (s: string) => Buffer.from(s.slice(s.indexOf(':') + 1), 'base64').toString() });
  return { odakVault: () => mockVault, wipeOdakSecrets: async () => mockVault.clear() };
});

// Wednesday 2026-11-04 local, 10:00.
const start = new Date(2026, 10, 4, 10, 0).toISOString();
const at = (y: number, m: number, d: number, h = 21) => new Date(y, m, d, h, 0);
let n = 0;
const ev = (kind: BehaviorKind, d: Date): BehaviorEvent => ({ id: `e${(n += 1)}`, at: d.toISOString(), kind, isSlip: true });
const goal = (g: Partial<GoalConfig>): GoalConfig => ({ porn: 'undecided', mast: 'undecided', startedAt: start, ...g });

describe('Odak phase engine', () => {
  it('counts programme days from 1 and maps the six phases', () => {
    expect(programDay(start, at(2026, 10, 4))).toBe(1);
    expect(programDay(start, at(2026, 10, 3))).toBe(1);
    const phaseOn = (day: number) => odakPhase(start, at(2026, 10, 3 + day));
    expect([1, 7, 8, 14, 15, 28, 29, 42, 43, 90, 91].map(phaseOn)).toEqual(['awareness', 'awareness', 'boundaries', 'boundaries', 'skills', 'skills', 'rebuild', 'rebuild', 'consolidation', 'consolidation', 'maintenance']);
    expect(daysToNextOdakPhase(start, at(2026, 10, 4))).toBe(7);
    expect(daysToNextOdakPhase(start, at(2026, 10, 3 + 91))).toBeNull();
    expect(programProgress(start, at(2026, 10, 3 + 45))).toBeCloseTo(0.5);
    expect(programProgress(start, at(2027, 5, 1))).toBe(1);
  });
  it('asks for check-ins daily in the core, about 3×/week in consolidation, monthly after', () => {
    expect(odakCadence('skills')).toBe('daily');
    expect(odakCadence('consolidation')).toEqual({ everyDays: 2 });
    expect(odakCadence('maintenance')).toEqual({ everyDays: 30 });
  });
  it('repeats the short screen on day 42 and 90', () => {
    expect(screeningDue(start, [], at(2026, 10, 3 + 41))).toBeNull();
    expect(screeningDue(start, [], at(2026, 10, 3 + 42))).toBe(42);
    expect(screeningDue(start, [at(2026, 10, 3 + 43).toISOString()], at(2026, 10, 3 + 50))).toBeNull();
    expect(screeningDue(start, [at(2026, 10, 3 + 43).toISOString()], at(2026, 10, 3 + 95))).toBe(90);
  });
});

describe('goal counters', () => {
  it('has a counter only for measurable goals', () => {
    expect(targetsOf(goal({}))).toEqual([]);
    expect(targetsOf(goal({ porn: 'quit', mast: 'pause', mastPauseDays: 30 }))).toEqual([
      { target: 'porn', mode: 'quit' },
      { target: 'mast', mode: 'pause', limit: 30 },
    ]);
    expect(targetsOf(goal({ porn: 'reduce', pornWeeklyMax: 2, mast: 'none' }))).toEqual([{ target: 'porn', mode: 'reduce', limit: 2 }]);
  });
  it('quit: a slip ends the run but keeps the total and the longest run', () => {
    const t = { target: 'porn' as const, mode: 'quit' as const };
    const events = [ev('porn', at(2026, 10, 9)), ev('mast', at(2026, 10, 12))];
    const c = goalCounter(t, start, events, at(2026, 10, 15, 12));
    // Days 4..15 = 12 days, one with porn (9th): run 4–8 (5), then 10–15 (6).
    expect(c).toMatchObject({ current: 6, longest: 6, total: 11 });
    const both = goalCounter(t, start, [...events, ev('both', at(2026, 10, 15, 9))], at(2026, 10, 15, 12));
    expect(both).toMatchObject({ current: 0, longest: 5, total: 10 });
  });
  it('reduce: days within the weekly limit fit; the week resets on Monday', () => {
    const t = { target: 'mast' as const, mode: 'reduce' as const, limit: 2 };
    // Week of Mon 2026-11-09: events on Mon, Tue, Wed → Wed is over the limit.
    const events = [ev('mast', at(2026, 10, 9)), ev('mast', at(2026, 10, 10)), ev('mast', at(2026, 10, 11)), ev('mast', at(2026, 10, 11, 23))];
    const wed = goalCounter(t, start, events, at(2026, 10, 11, 23));
    expect(wed.weekUsed).toBe(3);
    expect(wed.current).toBe(0);
    const nextMon = goalCounter(t, start, events, at(2026, 10, 16, 9));
    expect(nextMon.weekUsed).toBe(0);
    expect(nextMon.current).toBe(5);
    expect(nextMon.total).toBe(12);
    expect(weekStart(at(2026, 10, 15)).getDate()).toBe(9);
  });
  it('pause: done once the run reaches the length', () => {
    const c = goalCounter({ target: 'mast', mode: 'pause', limit: 7 }, start, [], at(2026, 10, 10));
    expect(c).toMatchObject({ current: 7, done: true });
    expect(goalCounter({ target: 'mast', mode: 'pause', limit: 7 }, start, [], at(2026, 10, 9)).done).toBe(false);
  });
  it('ignores events before the start and in the future', () => {
    const c = goalCounter({ target: 'porn', mode: 'quit' }, start, [ev('porn', at(2026, 10, 1)), ev('porn', at(2026, 10, 30))], at(2026, 10, 6));
    expect(c).toMatchObject({ current: 3, total: 3 });
  });
  it('tells whether a new log goes against the goal', () => {
    const g = goal({ porn: 'reduce', pornWeeklyMax: 1, mast: 'pause', mastPauseDays: 30 });
    expect(isSlip(g, 'porn', [], at(2026, 10, 10))).toBe(false);
    expect(isSlip(g, 'porn', [ev('porn', at(2026, 10, 9))], at(2026, 10, 10))).toBe(true);
    expect(isSlip(g, 'porn', [ev('porn', at(2026, 10, 10, 8))], at(2026, 10, 10))).toBe(false);
    expect(isSlip(g, 'mast', [], at(2026, 10, 10))).toBe(true);
    expect(isSlip(goal({}), 'both', [], at(2026, 10, 10))).toBe(false);
    expect(goalCounters(g, [], at(2026, 10, 4)).map((c) => c.target)).toEqual(['porn', 'mast']);
  });
});

describe('behaviour log (encrypted store)', () => {
  it('logs with the slip flag and keeps the events after reload', async () => {
    await useOdakStore.getState().wipe();
    await useOdakStore.getState().enrol({ profile: { reasons: [], createdAt: start } as never, goal: goal({ porn: 'quit' }), plans: [], screenings: [] });
    const e1 = await useOdakStore.getState().logBehavior('mast', at(2026, 10, 5));
    const e2 = await useOdakStore.getState().logBehavior('porn', at(2026, 10, 6));
    expect([e1.isSlip, e2.isSlip]).toEqual([false, true]);
    useOdakStore.setState({ events: [], ready: false });
    await useOdakStore.getState().hydrate();
    expect(useOdakStore.getState().events.map((e) => e.kind)).toEqual(['mast', 'porn']);
  });
});

describe('panel content and listing', () => {
  it('panel content is unreviewed, sourced and uses no banned words', () => {
    expect(panelJson.reviewed).toBe(false);
    const ids = new Set(sourcesJson.map((s) => s.id));
    for (const id of panelJson.sourceIds) expect(ids.has(id)).toBe(true);
    const text = JSON.stringify(panelJson);
    for (const b of [/başarısız/i, /sıfırdan başla/i, /temiz gün/i, /kirli/i, /günah/i, /%\s?\d/]) expect(text).not.toMatch(b);
    expect(fill(panelJson.counter.reduce, { used: 2, limit: 3 })).toBe('Bu hafta 2/3 gün');
    expect(fill('{a} {b}', { a: 1 })).toBe('1 {b}');
  });
  it('the camp is listed with a neutral name and is 18+ / high privacy', () => {
    const odak = CAMPS.find((c) => c.id === 'odak')!;
    expect(odak).toMatchObject({ ageRule: 'adults', privacy: 'high', route: '/odak' });
    const title = (tr as unknown as { odak: { title: string; card: Record<string, string>; panel: Record<string, string> } }).odak;
    for (const s of [title.title, ...Object.values(title.card), ...Object.values(title.panel)]) expect(s).not.toMatch(/porno|mastürbasyon|cinsel/i);
  });
});
