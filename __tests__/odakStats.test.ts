import fs from 'fs';
import path from 'path';

import badgesJson from '@/content/camps/odak/badges.tr.json';
import statsJson from '@/content/camps/odak/stats.tr.json';
import summaryJson from '@/content/camps/odak/summary.tr.json';
import supportJson from '@/content/camps/odak/support.tr.json';
import sourcesJson from '@/content/camps/odak/sources.json';
import { summaryHtml } from '@/features/camps/core/summaryHtml';
import { defaultBoundaries } from '@/features/camps/odak/engine/boundaries';
import { bpsProgress, earnedOdakBadges, emotionPairs, fitCalendar, riskyHeatmap, summaryNumbers, topTriggers, weeklyUrges } from '@/features/camps/odak/engine/stats';
import { useOdakStore } from '@/features/camps/odak/store';
import type { BehaviorEvent, GoalConfig, OdakCheckIn, UrgeEvent } from '@/features/camps/odak/types';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('@/features/camps/odak/privacy/device', () => {
  const { createMemoryVaultBackend, createVault } = jest.requireActual('@/features/camps/odak/privacy/vault');
  const mockVault = createVault(createMemoryVaultBackend(), { seal: async (t: string) => `s:${Buffer.from(t).toString('base64')}`, open: async (s: string) => Buffer.from(s.slice(2), 'base64').toString() });
  return { odakVault: () => mockVault, wipeOdakSecrets: async () => mockVault.clear() };
});

// Programme starts Monday 2026-11-02; "now" is Wednesday 2026-11-18 20:00.
const d = (day: number, h = 21) => new Date(2026, 10, day, h, 0);
const now = d(18, 20);
const goal: GoalConfig = { porn: 'quit', mast: 'none', startedAt: d(2, 9).toISOString() };
let n = 0;
const ev = (day: number, extra: Partial<BehaviorEvent> = {}): BehaviorEvent => ({ id: `e${(n += 1)}`, at: d(day).toISOString(), kind: 'porn', isSlip: true, ...extra });
const urge = (day: number, outcome: UrgeEvent['outcome'], extra: Partial<UrgeEvent> = {}): UrgeEvent => ({
  id: `u${(n += 1)}`,
  at: d(day).toISOString(),
  intensityBefore: 6,
  dayy: { tired: false, hungry: false, lonely: false, loaded: false },
  toolsUsed: ['surf'],
  outcome,
  durationSec: 60,
  ...extra,
});
const chk = (day: number, extra: Partial<OdakCheckIn> = {}): OdakCheckIn => ({ id: `c${(n += 1)}`, at: d(day).toISOString(), onGoal: true, urgeCount: 0, mood: 3, sleep: 3, loneliness: 2, ...extra });

describe('statistics (spec 5.12)', () => {
  it('calendar: fit days, grey slip days, nothing before the start, future cells empty', () => {
    const cal = fitCalendar(goal, [ev(5)], [], now, 4);
    expect(cal).toHaveLength(4);
    const flat = cal.flat();
    // Weeks: Mon 26 Oct … Sun 22 Nov.
    expect(flat.slice(0, 7).every((c) => c === 'none')).toBe(true);
    expect(cal[1]![3]).toBe('slip'); // Thursday 5 Nov
    expect(cal[1]![0]).toBe('fit');
    expect(cal[3]![2]).toBe('fit'); // today
    expect(cal[3]![3]).toBe('future');
    expect(fitCalendar(goal, [], [chk(10, { onGoal: false })], now, 4)[2]![1]).toBe('slip');
  });
  it('weekly urges, heatmap, triggers, emotion pairs and BPS days', () => {
    const urges = [urge(16, 'managed', { intensityBefore: 8 }), urge(17, 'slipped', { intensityBefore: 4, trigger: 'stress' }), urge(3, 'managed')];
    const w = weeklyUrges(urges, now, 3);
    expect(w.map((x) => x.count)).toEqual([1, 0, 2]);
    expect(w[2]!.avg).toBe(6);
    const heat = riskyHeatmap(urges, [ev(16)]);
    expect(heat[0]![7]).toBe(2); // Monday 21:00 block
    expect(topTriggers(urges, [ev(16, { trigger: 'stress' }), ev(17, { trigger: 'night_bed' })])[0]).toEqual({ id: 'stress', count: 2 });
    expect(emotionPairs([ev(5, { emotionBefore: 'lonely', emotionAfter: 'empty' }), ev(6, { emotionBefore: 'lonely', emotionAfter: 'empty' })])).toEqual([{ before: 'lonely', after: 'empty', count: 2 }]);
    expect(bpsProgress([{ id: 's', at: d(2, 10).toISOString(), type: 'BPS', score: 5, answers: [] }], goal)).toEqual([{ day: 0, score: 5 }]);
  });
});

describe('badges (spec 5.13)', () => {
  const base = { goal, events: [] as BehaviorEvent[], urges: [] as UrgeEvent[], checkins: [] as OdakCheckIn[], plans: [], boundaries: defaultBoundaries(), mainLessonsDone: 0, now };
  it('day badges count total fitting days, so a slip never takes one back', () => {
    const earned = earnedOdakBadges({ ...base, events: [ev(17)] });
    expect(earned).toEqual(expect.arrayContaining(['days-1', 'days-3', 'days-7', 'days-14']));
    expect(earned).not.toContain('days-30');
  });
  it('comeback: 7 fitting days after a slip; plus urges, plan, boundaries, check-ins, lessons, graduation', () => {
    expect(earnedOdakBadges({ ...base, events: [ev(5)] })).toContain('comeback');
    expect(earnedOdakBadges({ ...base, events: [ev(14)] })).not.toContain('comeback');
    const many = Array.from({ length: 10 }, (_, i) => urge(3 + i, 'managed'));
    const all = earnedOdakBadges({
      ...base,
      urges: many,
      plans: [{ id: 'p', trigger: 'stress', ifText: 'x', thenText: 'y', createdAt: d(2).toISOString() }],
      boundaries: { ...defaultBoundaries(), iosWebFilter: true },
      checkins: Array.from({ length: 7 }, (_, i) => chk(10 + i)),
      mainLessonsDone: 16,
    });
    expect(all).toEqual(expect.arrayContaining(['urges-10', 'first-plan', 'boundaries', 'checkin-7', 'all-skills']));
    expect(all).not.toContain('graduate');
    expect(earnedOdakBadges({ ...base, now: new Date(2027, 1, 1) })).toContain('graduate');
  });
  it('every badge in the content has a rule and the other way round', () => {
    expect(badgesJson.items.map((b) => b.id)).toEqual(['days-1', 'days-3', 'days-7', 'days-14', 'days-30', 'days-60', 'days-90', 'urges-10', 'urges-50', 'urges-100', 'first-plan', 'boundaries', 'checkin-7', 'all-skills', 'comeback', 'graduate']);
  });
  it('stores badges once and keeps them after reload', async () => {
    await useOdakStore.getState().wipe();
    await useOdakStore.getState().unlockBadges(['days-1', 'days-3']);
    await useOdakStore.getState().unlockBadges(['days-1', 'days-7']);
    useOdakStore.setState({ badges: [], ready: false });
    await useOdakStore.getState().hydrate();
    expect(
      useOdakStore
        .getState()
        .badges.map((b) => b.id)
        .sort(),
    ).toEqual(['days-1', 'days-3', 'days-7']);
  });
});

describe('specialist summary', () => {
  it('counts fitting days, urges, slip days and recent mood', () => {
    const s = summaryNumbers({ goal, events: [ev(10), ev(17)], urges: [urge(16, 'managed', { trigger: 'stress' }), urge(17, 'slipped')], checkins: [chk(15, { mood: 2, sleep: 4 }), chk(16, { mood: 4, sleep: 4 })], now });
    expect(s).toMatchObject({ fitTotal: 15, current: 1, urges: 2, managed: 1, urgeIntensity: 6, slipDays14: 2, slipDays30: 2, triggers: ['stress'], tools: ['surf'], mood14: 3, sleep14: 4 });
  });
  it('the printable page escapes text and keeps the note', () => {
    const html = summaryHtml(summaryJson.title, summaryJson.subtitle, [['<b>', 'a & b']], summaryJson.note);
    expect(html).toContain('&lt;b&gt;');
    expect(html).toContain('a &amp; b');
    expect(html).toContain('Tanı aracı değildir');
    expect(summaryJson.title).not.toMatch(/porno|mastürbasyon|cinsel/i);
  });
});

describe('support screen (spec 5.11)', () => {
  it('112 always first, 115 and MHRS 182 flagged for checking, neutral supporter messages, privacy warning', () => {
    expect(supportJson.emergency.phone).toBe('112');
    expect(supportJson.help.map((h) => [h.id, h.phone, h.needsVerification])).toEqual([
      ['yedam', '115', true],
      ['mhrs', '182', true],
    ]);
    for (const h of supportJson.help) expect(h.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const m of supportJson.supporter.templates) expect(m).not.toMatch(/porno|mastürbasyon|cinsel|dürtü/i);
    expect(supportJson.summary.privacy).toMatch(/şifresizdir/);
    const ids = new Set(sourcesJson.map((s) => s.id));
    for (const id of supportJson.sourceIds) expect(ids.has(id)).toBe(true);
  });
  it('support and SOS-related screens are never behind the paywall; stats use no red for slips', () => {
    const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', 'app', 'odak', f), 'utf8');
    // Help lines are always free; only the specialist summary export is premium (spec 8).
    const support = read('support.tsx');
    expect(support.match(/\bpremium (\?|&&)/g)).toHaveLength(1);
    expect(support).toMatch(/premium \? <Button label=\{S\.summary\.button\}/);
    expect(read('stats.tsx')).not.toMatch(/colors\.danger/);
    expect(statsJson.calendarLegend).toMatch(/Gri/);
  });
});
