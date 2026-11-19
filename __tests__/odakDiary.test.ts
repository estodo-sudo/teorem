import diaryJson from '@/content/camps/odak/diary.tr.json';
import sourcesJson from '@/content/camps/odak/sources.json';
import { byDay, diaryEntries, hourRange, SUMMARY_MIN, weekdayIndex, weeklySummary } from '@/features/camps/odak/engine/diary';
import { buildUrge, noDayy } from '@/features/camps/odak/engine/sos';
import { useOdakStore } from '@/features/camps/odak/store';
import type { BehaviorEvent, UrgeEvent } from '@/features/camps/odak/types';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('@/features/camps/odak/privacy/device', () => {
  const { createMemoryVaultBackend, createVault } = jest.requireActual('@/features/camps/odak/privacy/vault');
  const mockVault = createVault(createMemoryVaultBackend(), { seal: async (t: string) => `s:${Buffer.from(t).toString('base64')}`, open: async (s: string) => Buffer.from(s.slice(2), 'base64').toString() });
  return { odakVault: () => mockVault, wipeOdakSecrets: async () => mockVault.clear() };
});

// Wednesday 2026-11-18, 20:00 local.
const now = new Date(2026, 10, 18, 20, 0);
const at = (d: number, h: number) => new Date(2026, 10, d, h, 0);
let n = 0;
const urge = (d: Date, outcome: UrgeEvent['outcome'], tools: UrgeEvent['toolsUsed'] = [], trigger?: UrgeEvent['trigger']): UrgeEvent => ({
  ...buildUrge({ startedAt: d, endedAt: d, intensityBefore: 6, dayy: noDayy(), toolsUsed: tools, outcome, trigger }),
  id: `u${(n += 1)}`,
});
const beh = (d: Date, extra: Partial<BehaviorEvent> = {}): BehaviorEvent => ({ id: `b${(n += 1)}`, at: d.toISOString(), kind: 'porn', isSlip: true, ...extra });

describe('diary list', () => {
  it('merges urges and behaviours newest first and groups them by day', () => {
    const e = diaryEntries([urge(at(17, 23), 'managed')], [beh(at(18, 1)), beh(at(17, 9))]);
    expect(e.map((x) => x.type)).toEqual(['behavior', 'urge', 'behavior']);
    expect(byDay(e).map((d) => [d.day, d.entries.length])).toEqual([
      ['2026-11-18', 1],
      ['2026-11-17', 2],
    ]);
    expect(weekdayIndex(at(16, 12))).toBe(0);
    expect(weekdayIndex(at(22, 12))).toBe(6);
    expect(hourRange(23)).toBe('23:00–00:00');
  });
});

describe('weekly summary', () => {
  it('needs a few entries first', () => {
    const s = weeklySummary([urge(at(18, 9), 'managed')], [], now);
    expect(s).toMatchObject({ urges: 1, enough: false });
    expect(SUMMARY_MIN).toBe(3);
  });
  it('finds the riskiest hour and day, top situation, best tool and usual feelings', () => {
    const urges = [urge(at(16, 23), 'managed', ['surf'], 'night_bed'), urge(at(17, 23), 'managed', ['surf', 'breath'], 'night_bed'), urge(at(18, 14), 'slipped', ['breath'], 'stress'), urge(at(5, 23), 'managed', ['move'], 'boredom')];
    const events = [
      beh(at(16, 23), { trigger: 'night_bed', emotionBefore: 'lonely', emotionAfter: 'empty', satisfaction: 2 }),
      beh(at(17, 10), { emotionBefore: 'lonely', emotionAfter: 'guilty', satisfaction: 3 }),
      beh(at(16, 9), { emotionAfter: 'empty' }),
    ];
    const s = weeklySummary(urges, events, now);
    expect(s).toMatchObject({ urges: 3, managed: 2, behaviors: 3, enough: true, riskyHour: 23, riskyDay: 0, topTrigger: 'night_bed', bestTool: 'surf', emotionBefore: 'lonely', emotionAfter: 'empty', avgSatisfaction: 2.5 });
  });
  it('shows no best tool when nothing was managed', () => {
    expect(weeklySummary([urge(at(18, 9), 'slipped', ['surf']), urge(at(18, 10), 'still_hard', ['breath']), urge(at(18, 11), 'slipped')], [], now).bestTool).toBeNull();
  });
});

describe('detailed logs (encrypted store)', () => {
  it('keeps situation, feelings and satisfaction; drops empty fields', async () => {
    await useOdakStore.getState().wipe();
    await useOdakStore.getState().enrol({ profile: { reasons: [], createdAt: now.toISOString() } as never, goal: { porn: 'quit', mast: 'none', startedAt: at(10, 9).toISOString() }, plans: [], screenings: [] });
    const e = await useOdakStore.getState().logBehavior('both', at(18, 22), { trigger: 'stress', emotionBefore: 'stressed', emotionAfter: undefined, satisfaction: 2 });
    expect(e).toMatchObject({ kind: 'both', trigger: 'stress', emotionBefore: 'stressed', satisfaction: 2, isSlip: true });
    expect('emotionAfter' in e).toBe(false);
    await useOdakStore.getState().logUrge(urge(at(18, 21), 'managed', [], 'social_media'));
    useOdakStore.setState({ events: [], urges: [], ready: false });
    await useOdakStore.getState().hydrate();
    expect(useOdakStore.getState().events[0]).toMatchObject({ trigger: 'stress', satisfaction: 2 });
    expect(useOdakStore.getState().urges[0]?.trigger).toBe('social_media');
  });
});

describe('diary content', () => {
  it('is sourced, unreviewed and judgement-free', () => {
    expect(diaryJson.reviewed).toBe(false);
    const ids = new Set(sourcesJson.map((s) => s.id));
    for (const id of diaryJson.sourceIds) expect(ids.has(id)).toBe(true);
    const text = JSON.stringify(diaryJson);
    for (const b of [/başarısız/i, /kötü gün/i, /temiz/i, /kirli/i, /günah/i, /%\s?\d/]) expect(text).not.toMatch(b);
    expect(diaryJson.days).toHaveLength(7);
    expect(diaryJson.behavior.satisfactionScale).toHaveLength(5);
  });
});
