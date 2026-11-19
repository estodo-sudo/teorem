import fs from 'fs';
import path from 'path';

import { longestDayStreak, newBadges, thresholdBadges } from '@/features/camps/core/badgeEngine';
import { ALL_CAMPS_MAX, atTime, campNotifRequests, handleCampNotifResponse, type CampNotifier } from '@/features/camps/core/campNotifications';
import { cadenceDue, checkinSlotDays, lowMoodRun } from '@/features/camps/core/checkinEngine';
import { actionParser, checkScenario, fillVars, nodeBaseText, type CoachScenario } from '@/features/camps/core/coachEngine';
import { missionForDay } from '@/features/camps/core/missionScheduler';
import { daysToNext, missionDay, nextPhaseStart, phaseAt, phaseOrder, type PhaseModel } from '@/features/camps/core/phaseEngine';
import { activateIfDue, attemptLapses, endAsRelapse, graduate, inProgress, lastAttempt, shownAttempt, startAttempt, startNow } from '@/features/camps/core/slipFlow';
import { cleanDays, cleanDuration, lapsesSince, streaks } from '@/features/camps/core/streakEngine';
import { DAY_MS, HOUR_MS } from '@/features/camps/core/time';
import { CAMPS, campNotifiers } from '@/features/camps/registry';
import { SMOKING_CAMP } from '@/features/camps/smoking/definition';
import tr from '@/i18n/tr.json';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-notifications', () => ({ setNotificationCategoryAsync: jest.fn(), scheduleNotificationAsync: jest.fn(), SchedulableTriggerInputTypes: { DATE: 'date' } }));

const d = (s: string) => new Date(s);
const MODEL: PhaseModel<'before' | 'first' | 'rest' | 'after'> = [
  { id: 'before', untilDay: -1 },
  { id: 'first', untilDay: 6 },
  { id: 'rest', untilDay: 41 },
  { id: 'after', untilDay: Infinity },
];

describe('phase engine', () => {
  it('maps programme days to phases', () => {
    expect([-5, -1, 0, 6, 7, 41, 42, 500].map((x) => phaseAt(MODEL, x))).toEqual(['before', 'before', 'first', 'first', 'rest', 'rest', 'after', 'after']);
    expect(phaseOrder(MODEL)).toEqual(['before', 'first', 'rest', 'after']);
  });
  it('counts days to the next phase', () => {
    expect(nextPhaseStart(MODEL, 'first')).toBe(7);
    expect(nextPhaseStart(MODEL, 'after')).toBeNull();
    expect(daysToNext(MODEL, 'before', -3)).toBe(3);
    expect(daysToNext(MODEL, 'rest', 10)).toBe(32);
  });
  it('mission day counts down before the start', () => {
    expect([-7, -1, 0, 5].map(missionDay)).toEqual([7, 1, 0, 5]);
  });
});

describe('mission scheduler', () => {
  const ms = [
    { id: 'p1', phase: 'before', day: 1 },
    { id: 'f0', phase: 'first', day: 0 },
    { id: 'f3', phase: 'first', day: 3 },
  ];
  it('picks the exact day, else the latest open one; countdown phases never catch up', () => {
    expect(missionForDay(ms, 'first', 3, [])?.id).toBe('f3');
    expect(missionForDay(ms, 'first', 5, [])?.id).toBe('f3');
    expect(missionForDay(ms, 'first', 5, ['f3'])?.id).toBe('f0');
    expect(missionForDay(ms, 'before', 2, [], ['before'])).toBeNull();
  });
});

describe('streak engine (several targets)', () => {
  const now = d('2026-11-20T12:00:00');
  it('counts each target separately', () => {
    const r = streaks(
      [
        { id: 'a', start: '2026-11-10T12:00:00', lapses: [{ at: '2026-11-15T09:00:00' }] },
        { id: 'b', start: '2026-11-18T12:00:00', lapses: [] },
        { id: 'c', start: '2026-11-25T12:00:00', lapses: [] },
      ],
      now,
    );
    expect(r).toEqual([
      { id: 'a', sinceLastMs: 5 * DAY_MS + 3 * HOUR_MS, cleanDays: 9, lapses: 1 },
      { id: 'b', sinceLastMs: 2 * DAY_MS, cleanDays: 2, lapses: 0 },
      { id: 'c', sinceLastMs: 0, cleanDays: 0, lapses: 0 },
    ]);
  });
  it('ignores lapses before the start and in the future', () => {
    const ls = lapsesSince('2026-11-10T00:00:00', [{ at: '2026-11-12T00:00:00' }, { at: '2026-11-01T00:00:00' }, { at: '2026-11-11T00:00:00' }]);
    expect(ls.map((l) => l.at)).toEqual(['2026-11-11T00:00:00', '2026-11-12T00:00:00']);
    expect(cleanDuration('2026-11-19T12:00:00', [{ at: '2026-11-21T00:00:00' }], now)).toBe(DAY_MS);
    expect(cleanDays('2026-11-19T12:00:00', [{ at: '2026-11-21T00:00:00' }], now)).toBe(1);
  });
});

describe('check-in engine', () => {
  it('follows the cadence', () => {
    expect(cadenceDue([], 'twice_daily', d('2026-11-20T09:00:00'))).toEqual({ due: true, slot: 'morning' });
    expect(cadenceDue([{ at: '2026-11-20T08:00:00' }], 'twice_daily', d('2026-11-20T09:00:00'))).toEqual({ due: false, slot: 'morning' });
    expect(cadenceDue([{ at: '2026-11-20T08:00:00' }], 'twice_daily', d('2026-11-20T20:00:00'))).toEqual({ due: true, slot: 'evening' });
    expect(cadenceDue([{ at: '2026-11-20T08:00:00' }], 'daily', d('2026-11-20T20:00:00'))).toEqual({ due: false, slot: 'daily' });
    expect(cadenceDue([{ at: '2026-11-18T08:00:00' }], { everyDays: 3 }, d('2026-11-20T20:00:00')).due).toBe(false);
    expect(cadenceDue([{ at: '2026-11-17T08:00:00' }], { everyDays: 3 }, d('2026-11-20T20:00:00'))).toEqual({ due: true, slot: 'periodic' });
    expect(cadenceDue([], 'none', d('2026-11-20T20:00:00'))).toEqual({ due: false, slot: null });
  });
  it('spots a run of low moods ending today or yesterday', () => {
    const low = ['2026-11-17', '2026-11-18', '2026-11-19'].map((x) => ({ at: `${x}T20:00:00`, mood: 1 }));
    expect(lowMoodRun(low, d('2026-11-20T10:00:00'), 3)).toBe(true);
    expect(lowMoodRun([...low, { at: '2026-11-19T21:00:00', mood: 3 }], d('2026-11-20T10:00:00'), 3)).toBe(false);
    expect(lowMoodRun(low, d('2026-11-22T10:00:00'), 3)).toBe(false);
  });
  it('splits check-ins into morning / evening days', () => {
    expect(checkinSlotDays([{ at: '2026-11-20T08:00:00' }, { at: '2026-11-20T16:00:00' }])).toEqual({ morning: ['2026-11-20'], evening: ['2026-11-20'] });
  });
});

describe('slip flow', () => {
  const now = d('2026-11-20T10:00:00');
  it('runs the attempt lifecycle', () => {
    const a = startAttempt([], { plannedStart: '2026-11-25T00:00:00.000Z' }, now);
    expect(a).toMatchObject({ attemptNo: 1, status: 'preparing' });
    expect(activateIfDue(a, now)).toBe(a);
    expect(activateIfDue(a, d('2026-11-26T00:00:00Z'))).toMatchObject({ status: 'active', actualQuitDateTime: '2026-11-25T00:00:00.000Z' });
    expect(startNow(a, now)).toMatchObject({ status: 'active', actualQuitDateTime: now.toISOString() });
    const r = endAsRelapse(startNow(a, now), now);
    const b = startAttempt([r], { plannedStart: now.toISOString(), startAt: now.toISOString() }, now);
    expect(b).toMatchObject({ attemptNo: 2, status: 'active' });
    expect(inProgress([r, b])).toBe(b);
    const g = graduate(b, now);
    expect(inProgress([r, g])).toBeNull();
    expect(shownAttempt([r, g])).toBe(g);
    expect(lastAttempt([r, g])).toBe(g);
  });
  it('keeps only the attempt’s own lapses after its start', () => {
    const a = { ...startNow(startAttempt([], { plannedStart: '2026-11-10T00:00:00Z' }, now), d('2026-11-10T00:00:00Z')) };
    const ls = [
      { at: '2026-11-12T00:00:00Z', attemptId: a.id },
      { at: '2026-11-09T00:00:00Z', attemptId: a.id },
      { at: '2026-11-12T00:00:00Z', attemptId: 'other' },
    ];
    expect(attemptLapses(a, ls)).toEqual([ls[0]]);
  });
});

describe('coach engine', () => {
  const parse = actionParser(['sos', 'end'] as const, ['skill'] as const);
  it('parses actions of a camp', () => {
    expect(parse('sos')).toEqual({ kind: 'sos' });
    expect(parse('skill:values')).toEqual({ kind: 'skill', id: 'values' });
    expect(parse('library:x')).toBeNull();
    expect(actionParser(['end'] as const, [] as const)('skill:x')).toBeNull();
  });
  it('fills variables and phase overrides', () => {
    expect(fillVars('{a} ve {b} {c}', { a: 1, b: 'iki' })).toBe('1 ve iki {c}');
    expect(nodeBaseText({ text: 'genel', byPhase: { first: 'ilk' }, replies: [] }, 'first')).toBe('ilk');
    expect(nodeBaseText({ text: 'genel', byPhase: { first: 'ilk' }, replies: [] }, null)).toBe('genel');
  });
  it('checks scenarios', () => {
    const s: CoachScenario = {
      id: 'x',
      emoji: '',
      title: '',
      start: 'a',
      nodes: {
        a: {
          text: '',
          replies: [
            { label: '1', action: 'skill:nope' },
            { label: '2', action: 'zap' },
            { label: '3', next: 'b' },
          ],
        },
        b: { text: '', replies: [{ label: 'ok', action: 'end' }] },
      },
    };
    expect(checkScenario(s, parse, { skill: { ids: ['values'], label: 'skill' } })).toEqual(['x.a: unknown skill "nope"', 'x.a: unknown action "zap"']);
  });
});

describe('badge engine', () => {
  it('awards thresholds once', () => {
    expect(thresholdBadges('days', [1, 7, 30], 8)).toEqual(['days-1', 'days-7']);
    expect(newBadges(['days-1', 'days-7'], [{ id: 'days-1', unlockedAt: 'x' }, { id: 'days-7' }])).toEqual(['days-7']);
    expect(longestDayStreak([{ at: '2026-11-01T10:00:00' }, { at: '2026-11-02T10:00:00' }, { at: '2026-11-02T20:00:00' }, { at: '2026-11-04T10:00:00' }])).toBe(2);
  });
});

describe('camp notifications (all camps)', () => {
  const req = (id: string, iso: string) => ({ identifier: id, content: { title: id, body: '' }, date: new Date(iso) });
  const notifier = (reqs: ReturnType<typeof req>[], kind: string): CampNotifier => ({
    setup: async () => undefined,
    requests: () => reqs,
    handleResponse: (res) => (res.notification.request.content.data as { kind?: string }).kind === kind,
  });
  it('merges every camp, soonest first, capped', () => {
    const a = notifier([req('a2', '2026-11-22T10:00:00'), req('a1', '2026-11-21T10:00:00')], 'a');
    const b = notifier([req('b1', '2026-11-21T12:00:00')], 'b');
    expect(campNotifRequests([a, b]).map((r) => r.identifier)).toEqual(['a1', 'b1', 'a2']);
    const many = notifier(
      Array.from({ length: 60 }, (_, i) => req(`m${i}`, new Date(Date.UTC(2026, 10, 21) + i * HOUR_MS).toISOString())),
      'm',
    );
    expect(campNotifRequests([many])).toHaveLength(ALL_CAMPS_MAX);
  });
  it('routes a tap to the camp that owns it', () => {
    const res = (kind: string) => ({ notification: { request: { content: { data: { kind } } } } }) as never;
    const a = notifier([], 'a');
    expect(handleCampNotifResponse([a], res('a'))).toBe(true);
    expect(handleCampNotifResponse([a], res('b'))).toBe(false);
  });
  it('builds local times', () => {
    expect(atTime(new Date(2026, 10, 20, 23, 0), '08:30')).toEqual(new Date(2026, 10, 20, 8, 30, 0, 0));
  });
});

describe('camp registry', () => {
  const get = (key: string) => key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], tr);
  it('lists the Sigarasız Kamp and every camp is well formed', () => {
    expect(CAMPS.map((c) => c.id)).toContain('smoking');
    expect(new Set(CAMPS.map((c) => c.id)).size).toBe(CAMPS.length);
    for (const c of CAMPS) {
      expect(typeof get(c.titleKey)).toBe('string');
      expect(c.phases.length).toBeGreaterThan(1);
      expect(c.phases[c.phases.length - 1]!.untilDay).toBe(Infinity);
      for (let i = 1; i < c.phases.length; i += 1) expect(c.phases[i]!.untilDay).toBeGreaterThan(c.phases[i - 1]!.untilDay);
      for (const p of c.phases) expect(c.checkinCadence(p.id)).toBeDefined();
      for (const f of c.contentFiles) expect(fs.existsSync(path.join(__dirname, '..', 'src', 'content', f))).toBe(true);
      expect(typeof c.Card).toBe('function');
      expect(c.days).toBeGreaterThan(0);
    }
    expect(campNotifiers()).toContain(SMOKING_CAMP.notifier);
  });
  it('keeps the Sigarasız Kamp phases as before', () => {
    expect(SMOKING_CAMP.phases.map((p) => [p.id, p.untilDay])).toEqual([
      ['preparation', -1],
      ['quit_day', 0],
      ['critical_week', 7],
      ['strengthening', 30],
      ['maintenance', 90],
      ['freedom', Infinity],
    ]);
    expect(['preparation', 'quit_day', 'critical_week', 'strengthening', 'maintenance', 'freedom'].map((p) => SMOKING_CAMP.checkinCadence(p as never))).toEqual(['none', 'daily', 'twice_daily', 'daily', { everyDays: 3 }, 'none']);
  });
});
