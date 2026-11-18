import { cigarettesNotSmoked, smokeFreeDuration, totalSmokeFreeDays } from '@/features/camp/engine/counters';
import { computeHSI, hsiLevel, showMedicationCard } from '@/features/camp/engine/hsi';
import { HEALTH_MILESTONES, milestoneToCelebrate, nextHealthMilestone, reachedMilestones } from '@/features/camp/engine/milestones';
import { reasonOfDay, remainingUnit, splitDuration } from '@/features/camp/engine/format';
import { checkinDue, learnings, moodAlert } from '@/features/camp/engine/checkin';
import { doctorSummary, summaryHtml, supporterText } from '@/features/camp/engine/summary';
import { checkinSlotDays, planCampNotifications } from '@/features/camp/engine/notifications';
import { canGraduate, cravingsPerDay, cumulativeSavings, earnedBadges, goalProgress, longestCheckinStreak, newBadges, smokeFreeCalendar, weeklyIntensity } from '@/features/camp/engine/stats';
import { diaryReport, hourRange, logsByDay, logsOfAttempt, todayCount, triggerFrequency } from '@/features/camp/engine/diary';
import { flipCard, gameWon, matchedPairs, newMatchGame, plansForTrigger, resistedCount, surfPromptIndex, waveAmplitude } from '@/features/camp/engine/sos';
import { checkinsPerDay, currentPhase, daysToNextPhase, programDay } from '@/features/camp/engine/phase';
import { autopilotLogs, cutDownPlan, missionForDay, riskyHours } from '@/features/camp/engine/plans';
import { estimatedSavings, moneySaved, priceAt } from '@/features/camp/engine/savings';
import { DAY_MS, HOUR_MS } from '@/features/camp/engine/time';
import { activateIfDue, campAttempt, currentAttempt, defaultCampState, endAsRelapse, newAttempt, quitDateIn, quitNow, sanitizeCampEvents, sanitizeCampState, validQuitDate } from '@/features/camp/state';
import type { CheckIn, CigaretteLog, CravingEvent, Mission, QuitAttempt } from '@/features/camp/types';
import { createMemoryCampRepo } from '@/features/camp/repo';
import { setCampRepo, useCampEventsStore, useCampStore } from '@/stores/campStore';

/** Local-time date helper (months 1-based). */
const L = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const iso = (d: Date) => d.toISOString();

const attempt = (over: Partial<QuitAttempt> = {}): QuitAttempt => ({
  id: 'a1',
  attemptNo: 1,
  startedAt: iso(L(2026, 11, 3, 9)),
  plannedQuitDate: iso(L(2026, 11, 10)),
  actualQuitDateTime: iso(L(2026, 11, 10)),
  status: 'active',
  ...over,
});
const slip = (at: Date, id = String(at.getTime())): CigaretteLog => ({ id, attemptId: 'a1', at: iso(at), isSlip: true });

describe('computeHSI', () => {
  it('scores cigarettes per day and time to first cigarette', () => {
    expect(computeHSI(5, 61)).toBe(0);
    expect(computeHSI(10, 61)).toBe(0);
    expect(computeHSI(11, 60)).toBe(2);
    expect(computeHSI(20, 30)).toBe(3);
    expect(computeHSI(25, 5)).toBe(5);
    expect(computeHSI(40, 5)).toBe(6);
  });
  it('maps to levels and the medication card', () => {
    expect([0, 2, 3, 4, 5, 6].map(hsiLevel)).toEqual(['low', 'low', 'mid', 'mid', 'high', 'high']);
    expect(showMedicationCard('low')).toBe(false);
    expect(showMedicationCard('mid')).toBe(true);
  });
});

describe('currentPhase', () => {
  const a = attempt();
  it.each([
    [L(2026, 11, 9, 23, 59), 'preparation'],
    [L(2026, 11, 10, 0, 0), 'quit_day'],
    [L(2026, 11, 10, 23, 59), 'quit_day'],
    [L(2026, 11, 11, 0, 1), 'critical_week'],
    [L(2026, 11, 17, 22), 'critical_week'],
    [L(2026, 11, 18, 1), 'strengthening'],
    [L(2026, 12, 10, 12), 'strengthening'],
    [L(2026, 12, 11, 12), 'maintenance'],
    [L(2027, 2, 8, 12), 'maintenance'],
    [L(2027, 2, 9, 12), 'freedom'],
  ])('%s → %s', (now, phase) => {
    expect(currentPhase(a, now)).toBe(phase);
  });
  it('treats a graduated attempt as freedom', () => {
    expect(currentPhase(attempt({ status: 'graduated' }), L(2026, 11, 12))).toBe('freedom');
  });
  it('counts preparation down to the quit day and later days from the quit', () => {
    const p = attempt({ actualQuitDateTime: undefined, status: 'preparing' });
    // Quit day is 10 November: on the 3rd it is 7 days away, on the 9th it is the eve (1).
    expect(programDay(p, L(2026, 11, 3, 22))).toEqual({ phase: 'preparation', day: 7 });
    expect(programDay(p, L(2026, 11, 9, 23, 55))).toEqual({ phase: 'preparation', day: 1 });
    expect(programDay(a, L(2026, 11, 12, 8))).toEqual({ phase: 'critical_week', day: 2 });
  });
  it('asks for more check-ins in the critical week', () => {
    expect(checkinsPerDay('critical_week')).toBe(2);
    expect(checkinsPerDay('strengthening')).toBe(1);
    expect(checkinsPerDay('maintenance')).toBeCloseTo(2 / 7);
  });
});

describe('smoke-free counters', () => {
  const a = attempt();
  it('is zero before the quit', () => {
    expect(smokeFreeDuration(a, [], L(2026, 11, 9))).toBe(0);
    expect(totalSmokeFreeDays(a, [], L(2026, 11, 9))).toBe(0);
    expect(cigarettesNotSmoked(20, a, [], L(2026, 11, 9))).toBe(0);
  });
  it('counts from the quit start', () => {
    const now = L(2026, 11, 13, 6);
    expect(smokeFreeDuration(a, [], now)).toBe(3 * DAY_MS + 6 * HOUR_MS);
    expect(totalSmokeFreeDays(a, [], now)).toBe(3);
    expect(cigarettesNotSmoked(20, a, [], now)).toBe(65);
  });
  it('a slip resets "since the last cigarette" but not the total days', () => {
    const logs = [slip(L(2026, 11, 12, 23, 30))];
    const now = L(2026, 11, 15, 12);
    expect(smokeFreeDuration(a, logs, now)).toBe(2 * DAY_MS + 12.5 * HOUR_MS);
    // 5 whole days since the quit, minus the 1 day with a slip.
    expect(totalSmokeFreeDays(a, logs, now)).toBe(4);
    expect(cigarettesNotSmoked(20, a, logs, now)).toBe(110 - 1);
  });
  it('counts two slips on the same day as one lost day across midnight', () => {
    const logs = [slip(L(2026, 11, 12, 23, 50), 's1'), slip(L(2026, 11, 12, 23, 55), 's2'), slip(L(2026, 11, 13, 0, 5), 's3')];
    expect(totalSmokeFreeDays(a, logs, L(2026, 11, 15, 12))).toBe(5 - 2);
  });
  it('ignores preparation logs, other attempts and future slips', () => {
    const logs: CigaretteLog[] = [{ id: 'p', attemptId: 'a1', at: iso(L(2026, 11, 12)), isSlip: false }, { id: 'o', attemptId: 'other', at: iso(L(2026, 11, 12)), isSlip: true }, slip(L(2026, 11, 20))];
    expect(totalSmokeFreeDays(a, logs, L(2026, 11, 15))).toBe(5);
  });
});

describe('money saved', () => {
  const a = attempt();
  const prices = [{ from: iso(L(2026, 11, 3)), packPriceTRY: 100, packSize: 20 }];
  it('values cigarettes not smoked at the pack price', () => {
    expect(moneySaved(prices, 20, a, [], L(2026, 11, 12))).toBe(200);
    expect(moneySaved(prices, 20, a, [slip(L(2026, 11, 11))], L(2026, 11, 12))).toBe(195);
    expect(moneySaved([], 20, a, [], L(2026, 11, 12))).toBe(0);
  });
  it('keeps earlier periods at their old price', () => {
    const history = [...prices, { from: iso(L(2026, 11, 12)), packPriceTRY: 120, packSize: 20 }];
    // 2 days at 5 TL/cig + 1 day at 6 TL/cig.
    expect(moneySaved(history, 20, a, [], L(2026, 11, 13))).toBe(200 + 120);
    expect(priceAt(history, L(2026, 11, 11))!.packPriceTRY).toBe(100);
    expect(priceAt(history, L(2026, 11, 12, 1))!.packPriceTRY).toBe(120);
  });
  it('estimates monthly and yearly savings', () => {
    expect(estimatedSavings(20, prices[0]!)).toEqual({ month: 3044, year: 36500 });
  });
});

describe('health milestones', () => {
  const q = iso(L(2026, 11, 10, 8));
  it('finds the next milestone and progress towards it', () => {
    const n = nextHealthMilestone(q, L(2026, 11, 10, 8, 10))!;
    expect(n.id).toBe('min20');
    expect(n.progress).toBeCloseTo(0.5);
    expect(nextHealthMilestone(q, L(2026, 11, 10, 12))!.id).toBe('h12');
    expect(reachedMilestones(q, L(2026, 11, 10, 21))).toEqual(['min20', 'h12']);
  });
  it('returns null after the last one', () => {
    expect(nextHealthMilestone(q, L(2042, 1, 1))).toBeNull();
    expect(reachedMilestones(q, L(2042, 1, 1))).toHaveLength(HEALTH_MILESTONES.length);
  });
});

describe('plans', () => {
  it('builds an even cut-down plan of 2–4 weeks', () => {
    expect(cutDownPlan(20, 4).map((w) => w.perDay)).toEqual([16, 12, 8, 4]);
    expect(cutDownPlan(10, 2).map((w) => w.perDay)).toEqual([7, 3]);
    expect(cutDownPlan(2, 9)).toHaveLength(4);
    expect(cutDownPlan(2, 4).every((w) => w.perDay >= 1)).toBe(true);
  });
  it('picks the mission for the day or the latest open one', () => {
    const m = (id: string, phase: Mission['phase'], day: number): Mission => ({ id, phase, day, title: id, body: '', durationMin: 2, bctCodes: [], type: 'action', reviewed: false });
    const all = [m('p1', 'preparation', 1), m('p2', 'preparation', 2), m('k31', 'maintenance', 31), m('k33', 'maintenance', 33)];
    expect(missionForDay(all, 'preparation', 2, [])!.id).toBe('p2');
    // No catch-up in preparation (days count down).
    expect(missionForDay(all, 'preparation', 5, [])).toBeNull();
    expect(missionForDay(all, 'maintenance', 32, [])!.id).toBe('k31');
    expect(missionForDay(all, 'maintenance', 32, ['k31'])).toBeNull();
    expect(missionForDay(all, 'freedom', 100, [])).toBeNull();
  });
  it('finds the riskiest hours and autopilot cigarettes', () => {
    const at = (h: number, need?: 1 | 2 | 3 | 4 | 5): CigaretteLog => ({ id: `${h}-${Math.random()}`, attemptId: 'a1', at: iso(L(2026, 11, 4, h, 15)), isSlip: false, need });
    const logs = [at(8, 5), at(8, 1), at(13, 2), at(21), at(21), at(21)];
    expect(riskyHours(logs, 2)).toEqual([
      { hour: 21, count: 3 },
      { hour: 8, count: 2 },
    ]);
    expect(autopilotLogs(logs)).toHaveLength(2);
  });
});

describe('attempts', () => {
  const now = L(2026, 11, 3, 9);
  it('allows quit days 3–14 days ahead', () => {
    expect(new Date(quitDateIn(1, now)).getDate()).toBe(6);
    expect(new Date(quitDateIn(30, now)).getDate()).toBe(17);
    expect(validQuitDate(quitDateIn(7, now), now)).toBe(true);
    expect(validQuitDate(iso(L(2026, 11, 4)), now)).toBe(false);
  });
  it('prepares, activates on the quit day and records relapses', () => {
    const a = newAttempt([], { plannedQuitDate: iso(L(2026, 11, 10)) }, now);
    expect(a).toMatchObject({ attemptNo: 1, status: 'preparing' });
    expect(activateIfDue(a, L(2026, 11, 9, 23))).toBe(a);
    expect(activateIfDue(a, L(2026, 11, 10, 0, 1))).toMatchObject({ status: 'active', actualQuitDateTime: a.plannedQuitDate });
    expect(quitNow(a, L(2026, 11, 5, 14)).actualQuitDateTime).toBe(iso(L(2026, 11, 5, 14)));
    expect(endAsRelapse(a, now)).toMatchObject({ status: 'relapsed', endedAt: iso(now) });
  });
  it('starts "already quit" users as active from their last cigarette', () => {
    const a = newAttempt([], { plannedQuitDate: iso(now), quitAt: iso(L(2026, 10, 30, 22)) }, now);
    expect(a.status).toBe('active');
    expect(currentPhase(a, now)).toBe('critical_week');
  });
});

describe('sanitize', () => {
  it('falls back to defaults', () => {
    expect(sanitizeCampState(null)).toEqual(defaultCampState());
    expect(sanitizeCampEvents('x')).toEqual({ cigarettes: [], cravings: [], checkins: [] });
  });
  it('keeps only one attempt in progress and drops broken rows', () => {
    const s = sanitizeCampState({
      attempts: [attempt({ id: 'old' }), attempt({ id: 'new', attemptNo: 2 }), { id: 3 }],
      prices: [
        { from: 'x', packPriceTRY: 1, packSize: 20 },
        { from: iso(now()), packPriceTRY: 90, packSize: 0 },
      ],
      rewards: [{ id: 'r', title: 'Kulaklık', amountTRY: 3500 }],
    });
    expect(s.attempts.map((a) => a.status)).toEqual(['relapsed', 'active']);
    expect(currentAttempt(s)!.id).toBe('new');
    expect(s.prices).toEqual([]);
    expect(s.rewards).toHaveLength(1);
    const e = sanitizeCampEvents({ cravings: [{ id: 'c', at: iso(now()), intensityBefore: 5, toolUsed: [], outcome: 'nope', durationSec: 1 }], checkins: [{ id: 'k', at: iso(now()), smoked: false, cravingCount: 1, mood: 9, symptoms: [] }] });
    expect(e.cravings).toEqual([]);
    expect(e.checkins).toEqual([]);
  });
  function now() {
    return L(2026, 11, 3);
  }
});

describe('camp stores', () => {
  beforeEach(() => {
    setCampRepo(createMemoryCampRepo());
    useCampStore.getState().reset();
    useCampEventsStore.getState().clearAll();
  });
  it('enrols, logs events and relapses into a new attempt', () => {
    const st = useCampStore.getState();
    st.enrol(
      { products: ['cigarette'], perDay: 15, firstCigMinutes: 30, hsiScore: 3, hsiLevel: 'mid', years: 5, ageRange: '25to39', reasons: [], triggers: [], pastAttempts: 0, relapseCauses: [], method: 'quit_day', createdAt: new Date().toISOString() },
      { packPriceTRY: 100, packSize: 20 },
      { plannedQuitDate: quitDateIn(7, new Date()) },
    );
    expect(currentAttempt(useCampStore.getState())!.status).toBe('preparing');
    const ev = useCampEventsStore.getState();
    ev.logCigarette({ attemptId: currentAttempt(useCampStore.getState())!.id, isSlip: false, need: 2 });
    ev.logCraving({ intensityBefore: 8, toolUsed: ['surf'], outcome: 'resisted', durationSec: 180 });
    expect(useCampEventsStore.getState().cigarettes).toHaveLength(1);
    useCampStore.getState().relapse(quitDateIn(3, new Date()));
    const s = useCampStore.getState();
    expect(s.attempts.map((a) => [a.attemptNo, a.status])).toEqual([
      [1, 'relapsed'],
      [2, 'preparing'],
    ]);
    // A mission completes once.
    s.completeMission('m1');
    useCampStore.getState().completeMission('m1');
    expect(useCampStore.getState().missions).toHaveLength(1);
  });
});

describe('panel helpers (K3)', () => {
  it('shows remaining time in one readable unit', () => {
    expect(remainingUnit(0)).toEqual({ value: 1, unit: 'min' });
    expect(remainingUnit(19.2 * 60_000)).toEqual({ value: 20, unit: 'min' });
    expect(remainingUnit(5.5 * HOUR_MS)).toEqual({ value: 6, unit: 'hour' });
    expect(remainingUnit(10.2 * DAY_MS)).toEqual({ value: 11, unit: 'day' });
    expect(remainingUnit(200 * DAY_MS)).toEqual({ value: 7, unit: 'month' });
    expect(remainingUnit(3 * 365 * DAY_MS)).toEqual({ value: 3, unit: 'year' });
  });
  it('splits a duration into days, hours and minutes', () => {
    expect(splitDuration(2 * DAY_MS + 5 * HOUR_MS + 7 * 60_000 + 30_000)).toEqual({ days: 2, hours: 5, minutes: 7 });
    expect(splitDuration(-5)).toEqual({ days: 0, hours: 0, minutes: 0 });
  });
  it('keeps the reason of the day stable within a day', () => {
    const reasons = [{ id: 'health' as const }, { id: 'money' as const }, { id: 'custom' as const, text: 'Kızım' }];
    expect(reasonOfDay(reasons, L(2026, 11, 17, 8))).toEqual(reasonOfDay(reasons, L(2026, 11, 17, 23)));
    const week = Array.from({ length: 14 }, (_, i) => reasonOfDay(reasons, L(2026, 11, 1 + i))!.id);
    expect(new Set(week).size).toBeGreaterThan(1);
    expect(reasonOfDay([], L(2026, 11, 17))).toBeNull();
  });
  it('counts days to the next phase', () => {
    const a = attempt();
    expect(daysToNextPhase(attempt({ actualQuitDateTime: undefined, status: 'preparing' }), L(2026, 11, 7))).toBe(3);
    expect(daysToNextPhase(a, L(2026, 11, 10, 9))).toBe(1);
    expect(daysToNextPhase(a, L(2026, 11, 12))).toBe(6);
    expect(daysToNextPhase(a, L(2026, 11, 18))).toBe(23);
    expect(daysToNextPhase(a, L(2027, 3, 1))).toBeNull();
  });
  it('celebrates the latest unseen milestone only', () => {
    expect(milestoneToCelebrate(['min20', 'h12', 'w2'], [])).toBe('w2');
    expect(milestoneToCelebrate(['min20', 'h12'], ['min20', 'h12'])).toBeNull();
    expect(milestoneToCelebrate(['min20', 'h12'], ['min20'])).toBe('h12');
  });
  it('keeps seen milestones through sanitize', () => {
    expect(sanitizeCampState({ seenMilestoneIds: ['min20', 3] }).seenMilestoneIds).toEqual(['min20']);
  });
});

describe('SOS (K4)', () => {
  it('counts resisted cravings only', () => {
    const c = (outcome: 'resisted' | 'still_hard' | 'smoked') => ({ id: outcome, at: iso(L(2026, 11, 12)), intensityBefore: 7, toolUsed: [], outcome, durationSec: 60 });
    expect(resistedCount([c('resisted'), c('still_hard'), c('smoked'), c('resisted')])).toBe(2);
  });
  it('spreads surf prompts over the session', () => {
    expect(surfPromptIndex(0, 180, 8)).toBe(0);
    expect(surfPromptIndex(90, 180, 8)).toBe(4);
    expect(surfPromptIndex(500, 180, 8)).toBe(7);
  });
  it('shapes the wave: builds to a peak, then fades', () => {
    const at = (x: number) => waveAmplitude(x * 180, 180);
    expect(at(0)).toBeCloseTo(0.15);
    expect(at(0.4)).toBeCloseTo(1);
    expect(at(0.2)).toBeLessThan(at(0.4));
    expect(at(0.8)).toBeLessThan(at(0.6));
    expect(at(1)).toBeCloseTo(0.15);
  });
  it('shows the plans for the chosen trigger', () => {
    const p = { id: 'p', trigger: 'stress' as const, ifText: 'a', thenText: 'b', createdAt: '', usedCount: 0 };
    expect(plansForTrigger([p], 'stress')).toHaveLength(1);
    expect(plansForTrigger([p], 'coffee_tea')).toHaveLength(0);
    expect(plansForTrigger([p], null)).toHaveLength(0);
  });
  it('plays the matching game', () => {
    let g = newMatchGame(['🍎', '🌙'], () => 0);
    expect(g.cards).toHaveLength(4);
    const first = g.cards[0]!.symbol;
    const pair = g.cards.findIndex((c, i) => i > 0 && c.symbol === first);
    const other = g.cards.findIndex((c) => c.symbol !== first);
    // Mismatch stays open until the next tap.
    g = flipCard(flipCard(g, 0), other);
    expect(g.open).toEqual([0, other]);
    expect(g.moves).toBe(1);
    g = flipCard(g, 0);
    expect(g.open).toEqual([0]);
    g = flipCard(g, pair);
    expect(g.open).toEqual([]);
    expect(matchedPairs(g)).toBe(1);
    // Matched cards can't be turned again.
    expect(flipCard(g, 0)).toBe(g);
    const rest = g.cards.map((c, i) => (c.matched ? -1 : i)).filter((i) => i >= 0);
    g = flipCard(flipCard(g, rest[0]!), rest[1]!);
    expect(gameWon(g)).toBe(true);
  });
});

describe('diary and trigger map (K5)', () => {
  const log = (d: number, h: number, extra: Partial<CigaretteLog> = {}): CigaretteLog => ({ id: `${d}-${h}-${Math.random()}`, attemptId: 'a1', at: iso(L(2026, 11, d, h, 10)), isSlip: false, ...extra });
  it('groups by day and counts today', () => {
    const logs = [log(4, 8), log(4, 21), log(5, 9), log(5, 23, { attemptId: 'b' })];
    expect(todayCount(logs, L(2026, 11, 4, 23))).toBe(2);
    expect(logsByDay(logs).map((g) => [g.day, g.logs.length])).toEqual([
      ['2026-11-05', 2],
      ['2026-11-04', 2],
    ]);
    expect(logsByDay(logs)[0]!.logs[0]!.at).toBe(iso(L(2026, 11, 5, 23, 10)));
    expect(logsOfAttempt(logs, 'a1')).toHaveLength(3);
  });
  it('builds the preparation report', () => {
    const logs = [log(4, 8, { trigger: 'coffee_tea', need: 2 }), log(4, 8, { trigger: 'coffee_tea', need: 5 }), log(4, 13, { trigger: 'after_meal', need: 1 }), log(5, 8, { trigger: 'coffee_tea' }), log(5, 22, { trigger: 'stress', need: 4 })];
    const r = diaryReport(logs);
    expect(r).toMatchObject({ total: 5, days: 2, perDay: 2.5, autopilot: 2, avgNeed: 3 });
    expect(r.autopilotShare).toBeCloseTo(0.4);
    expect(r.hours[8]).toBe(3);
    expect(r.topHours[0]).toEqual({ hour: 8, count: 3 });
    expect(r.topTriggers[0]).toEqual({ trigger: 'coffee_tea', count: 3 });
    expect(diaryReport([])).toMatchObject({ total: 0, perDay: 0, avgNeed: null, autopilotShare: 0 });
  });
  it('orders the trigger map by frequency, then assessment order', () => {
    const logs = [log(4, 8, { trigger: 'stress' }), log(4, 9, { trigger: 'stress' }), log(4, 10, { trigger: 'alcohol' })];
    const cravings = [{ id: 'c', at: iso(L(2026, 11, 4)), intensityBefore: 5, trigger: 'alcohol' as const, toolUsed: [], outcome: 'resisted' as const, durationSec: 60 }];
    const map = triggerFrequency(['coffee_tea', 'stress', 'after_meal'], logs, cravings);
    expect(map.map((m) => [m.trigger, m.count, m.mine])).toEqual([
      ['stress', 2, true],
      ['alcohol', 2, false],
      ['coffee_tea', 0, true],
      ['after_meal', 0, true],
    ]);
  });
  it('labels hours', () => {
    expect(hourRange(8)).toBe('08:00–09:00');
    expect(hourRange(23)).toBe('23:00–00:00');
  });
});

describe('check-in, safety and learnings (K6)', () => {
  const ci = (d: Date, mood: 1 | 2 | 3 | 4 | 5 = 3): CheckIn => ({ id: String(d.getTime()), at: iso(d), smoked: false, cravingCount: 1, mood, symptoms: [] });
  it('asks morning and evening in the critical week', () => {
    const morning = L(2026, 11, 12, 9);
    expect(checkinDue([], 'critical_week', morning)).toEqual({ due: true, slot: 'morning' });
    expect(checkinDue([ci(L(2026, 11, 12, 8))], 'critical_week', morning).due).toBe(false);
    // The morning one doesn't cover the evening.
    expect(checkinDue([ci(L(2026, 11, 12, 8))], 'critical_week', L(2026, 11, 12, 20))).toEqual({ due: true, slot: 'evening' });
    expect(checkinDue([ci(L(2026, 11, 12, 8)), ci(L(2026, 11, 12, 19))], 'critical_week', L(2026, 11, 12, 22)).due).toBe(false);
  });
  it('asks daily, then about twice a week, never in preparation', () => {
    expect(checkinDue([ci(L(2026, 11, 20, 23, 50))], 'strengthening', L(2026, 11, 21, 0, 10)).due).toBe(true);
    expect(checkinDue([ci(L(2026, 11, 21, 7))], 'strengthening', L(2026, 11, 21, 22)).due).toBe(false);
    expect(checkinDue([ci(L(2026, 12, 20, 9))], 'maintenance', L(2026, 12, 22, 9)).due).toBe(false);
    expect(checkinDue([ci(L(2026, 12, 20, 9))], 'maintenance', L(2026, 12, 23, 9)).due).toBe(true);
    expect(checkinDue([], 'preparation', L(2026, 12, 23, 9))).toEqual({ due: false, slot: null });
  });
  it('raises the mood alert after 3 "very bad" days in a row', () => {
    const three = [ci(L(2026, 11, 10, 21), 1), ci(L(2026, 11, 11, 21), 1), ci(L(2026, 11, 12, 21), 1)];
    expect(moodAlert(three, L(2026, 11, 12, 22))).toBe(true);
    // Still shown the next morning before today's check-in.
    expect(moodAlert(three, L(2026, 11, 13, 8))).toBe(true);
    // A better latest mood on one day breaks the run.
    expect(moodAlert([...three, ci(L(2026, 11, 11, 22), 3)], L(2026, 11, 12, 22))).toBe(false);
    expect(moodAlert(three.slice(1), L(2026, 11, 12, 22))).toBe(false);
    expect(moodAlert(three, L(2026, 11, 15, 8))).toBe(false);
  });
  it('summarises what an attempt taught', () => {
    const a = attempt();
    const cravings: CravingEvent[] = [
      { id: '1', at: iso(L(2026, 11, 11)), intensityBefore: 8, trigger: 'stress', toolUsed: ['surf', 'breath'], outcome: 'resisted', durationSec: 200 },
      { id: '2', at: iso(L(2026, 11, 12)), intensityBefore: 6, trigger: 'stress', toolUsed: ['surf'], outcome: 'resisted', durationSec: 200 },
      { id: '3', at: iso(L(2026, 11, 13)), intensityBefore: 9, trigger: 'alcohol', toolUsed: ['delay'], outcome: 'smoked', durationSec: 60 },
    ];
    const logs: CigaretteLog[] = [{ ...slip(L(2026, 11, 13, 22)), trigger: 'alcohol' }];
    const plans = [
      { id: 'p1', trigger: 'stress' as const, ifText: '', thenText: '', createdAt: '', usedCount: 2 },
      { id: 'p2', trigger: 'coffee_tea' as const, ifText: '', thenText: '', createdAt: '', usedCount: 0 },
    ];
    const l = learnings(a, logs, cravings, plans, 4);
    expect(l.resisted).toBe(2);
    // Ties keep no particular order.
    expect(l.hardTriggers).toHaveLength(2);
    expect(l.hardTriggers).toEqual(
      expect.arrayContaining([
        { trigger: 'stress', count: 2 },
        { trigger: 'alcohol', count: 2 },
      ]),
    );
    expect(l.helpfulTools[0]).toEqual({ tool: 'surf', count: 2 });
    expect(l.usedPlans.map((p) => p.id)).toEqual(['p1']);
    expect(l.smokeFreeDays).toBe(4);
  });
});

describe('doctor summary and supporter messages (K10)', () => {
  const profile = {
    products: ['cigarette' as const],
    perDay: 20,
    firstCigMinutes: 30 as const,
    hsiScore: 3,
    hsiLevel: 'mid' as const,
    years: 8,
    ageRange: '25to39' as const,
    reasons: [],
    triggers: ['stress' as const],
    pastAttempts: 0 as const,
    relapseCauses: [],
    method: 'quit_day' as const,
    createdAt: iso(L(2026, 11, 3)),
  };
  const state = { ...defaultCampState(), profile, prices: [{ from: iso(L(2026, 11, 3)), packPriceTRY: 100, packSize: 20 }], attempts: [attempt()] };
  const ev = {
    cigarettes: [{ ...slip(L(2026, 11, 13, 21)), trigger: 'alcohol' as const }],
    cravings: [
      { id: 'c1', at: iso(L(2026, 11, 11)), intensityBefore: 8, intensityAfter: 3, trigger: 'stress' as const, toolUsed: ['surf' as const], outcome: 'resisted' as const, durationSec: 180 },
      { id: 'c2', at: iso(L(2026, 11, 12)), intensityBefore: 6, trigger: 'stress' as const, toolUsed: [], outcome: 'still_hard' as const, durationSec: 60 },
    ],
    checkins: [
      { id: 'k1', at: iso(L(2026, 11, 14, 9)), smoked: false, cravingCount: 2, mood: 3 as const, symptoms: ['irritable' as const, 'insomnia' as const] },
      { id: 'k2', at: iso(L(2026, 11, 15, 21)), smoked: false, cravingCount: 1, mood: 4 as const, symptoms: ['irritable' as const] },
    ],
  };
  it('summarises what the user entered', () => {
    const s = doctorSummary(state, ev, L(2026, 11, 16, 12))!;
    expect(s).toMatchObject({ attemptNo: 1, perDayBefore: 20, years: 8, hsiScore: 3, slips: 1, checkins: 2, moodLast7: 3.5, phase: 'critical_week' });
    expect(s.smokeFreeDays).toBe(6 - 1);
    expect(s.cravings).toEqual({ total: 2, resisted: 1, avgBefore: 7, avgAfter: 3 });
    expect(s.topSymptoms[0]).toEqual({ id: 'irritable', count: 2 });
    expect(s.topTriggers[0]).toEqual({ id: 'stress', count: 2 });
    expect(s.savedTRY).toBeGreaterThan(500);
    expect(doctorSummary(defaultCampState(), ev, L(2026, 11, 16))).toBeNull();
  });
  it('builds escaped printable HTML', () => {
    const html = summaryHtml(
      'Özet <test>',
      'alt',
      [
        ['Kayma', '1'],
        ['Not', '<b>x</b> & "y"'],
      ],
      'not',
    );
    expect(html).toContain('<th>Kayma</th><td>1</td>');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;');
    expect(html).toContain('<title>Özet &lt;test&gt;</title>');
  });
  it('fills supporter messages', () => {
    expect(supporterText('{supporter}, {days} gündür dumansızım! {date}', { supporter: 'Ayşe', days: 10, date: '24 Kasım' })).toBe('Ayşe, 10 gündür dumansızım! 24 Kasım');
  });
});

describe('stats, badges and graduation (K11)', () => {
  const a = attempt();
  it('draws the smoke-free calendar from the quit day', () => {
    const g = smokeFreeCalendar(a, [slip(L(2026, 11, 12, 21))], L(2026, 11, 14, 9), 2);
    expect(g[0]).toEqual(['free', 'free', 'slip', 'free', 'today', 'future', 'future']);
    expect(g[1]!.every((c) => c === 'future')).toBe(true);
  });
  it('counts cravings per day and weekly intensity', () => {
    const c = (d: Date, i: number) => ({ id: String(d.getTime()), at: iso(d), intensityBefore: i, toolUsed: [], outcome: 'resisted' as const, durationSec: 60 });
    const cr = [c(L(2026, 11, 13, 9), 8), c(L(2026, 11, 13, 20), 6), c(L(2026, 11, 14, 9), 4)];
    expect(cravingsPerDay(cr, L(2026, 11, 14, 22), 3).map((x) => x.count)).toEqual([0, 2, 1]);
    expect(weeklyIntensity(cr, L(2026, 11, 14, 22), 2)).toEqual([null, 6]);
  });
  it('accumulates savings day by day', () => {
    const prices = [{ from: iso(L(2026, 11, 3)), packPriceTRY: 100, packSize: 20 }];
    const pts = cumulativeSavings(prices, 20, a, [], L(2026, 11, 12, 12), 30);
    expect(pts.map((p) => p.amount)).toEqual([100, 200, 250]);
  });
  it('finds the longest check-in streak', () => {
    const ck = (d: number) => ({ id: String(d), at: iso(L(2026, 11, d, 9)), smoked: false, cravingCount: 0, mood: 3 as const, symptoms: [] });
    expect(longestCheckinStreak([ck(1), ck(2), ck(3), ck(5), ck(6)])).toBe(3);
    expect(longestCheckinStreak([])).toBe(0);
  });
  it('earns badges and only celebrates new ones', () => {
    const s = {
      ...defaultCampState(),
      profile: {
        products: ['cigarette' as const],
        perDay: 20,
        firstCigMinutes: 30 as const,
        hsiScore: 3,
        hsiLevel: 'mid' as const,
        years: 5,
        ageRange: '25to39' as const,
        reasons: [],
        triggers: [],
        pastAttempts: 0 as const,
        relapseCauses: [],
        method: 'quit_day' as const,
        createdAt: iso(L(2026, 11, 3)),
      },
      prices: [{ from: iso(L(2026, 11, 3)), packPriceTRY: 100, packSize: 20 }],
      attempts: [a],
      plans: [{ id: 'p', trigger: 'stress' as const, ifText: '', thenText: '', createdAt: '', usedCount: 0 }],
    };
    const ev = { cigarettes: [], cravings: [], checkins: [] };
    const got = earnedBadges(s, ev, ['values'], L(2026, 11, 18, 12));
    expect(got).toEqual(expect.arrayContaining(['days-1', 'days-3', 'days-7', 'first-plan']));
    expect(got).not.toContain('days-14');
    expect(got).not.toContain('saved-1000');
    expect(earnedBadges(s, ev, ['values'], L(2026, 12, 4, 12))).toContain('saved-1000');
    expect(newBadges(['days-1', 'days-3'], [{ id: 'days-1', unlockedAt: 'x' }])).toEqual(['days-3']);
  });
  it('allows graduation from day 90', () => {
    expect(canGraduate(a, L(2027, 2, 7, 12))).toBe(false);
    expect(canGraduate(a, L(2027, 2, 8, 12))).toBe(true);
    expect(canGraduate({ ...a, status: 'graduated' }, L(2027, 3, 1))).toBe(false);
    expect(goalProgress(1750, 3500)).toBe(0.5);
    expect(goalProgress(5000, 3500)).toBe(1);
  });
  it('keeps showing a graduated attempt', () => {
    const s = { ...defaultCampState(), attempts: [{ ...a, status: 'graduated' as const }] };
    expect(currentAttempt(s)).toBeNull();
    expect(campAttempt(s)!.id).toBe('a1');
  });
});

describe('camp notifications (K12)', () => {
  const base = { enabled: true, discreet: false, riskyHour: null, checkinMorningDays: [], checkinEveningDays: [] };
  const kinds = (xs: { kind: string }[]) => xs.map((x) => x.kind);
  it('reminds once a day during preparation, then the quit-day morning', () => {
    const p = attempt({ actualQuitDateTime: undefined, status: 'preparing' }); // quit day 10 Nov
    const plan = planCampNotifications({ ...base, now: L(2026, 11, 7, 9), attempt: p, horizonDays: 4 });
    expect(kinds(plan)).toEqual(['prep', 'prep', 'prep', 'quitMorning']);
    expect(plan[0]!.fireAt).toEqual(L(2026, 11, 7, 20));
    expect(plan[3]).toMatchObject({ fireAt: L(2026, 11, 10, 8, 30), route: '/camp/quit-day' });
  });
  it('asks morning and evening in the critical week, with the risky hour, skipping done check-ins', () => {
    const plan = planCampNotifications({ ...base, now: L(2026, 11, 12, 10), attempt: attempt(), riskyHour: 21, checkinMorningDays: ['2026-11-13'], horizonDays: 2 });
    // 12 Nov: morning already past → evening + risky (20:50); 13 Nov: morning done → badge, evening + risky.
    expect(plan.map((x) => [x.kind, x.fireAt.getDate(), x.fireAt.getHours(), x.fireAt.getMinutes()])).toEqual([
      ['checkinEvening', 12, 20, 30],
      ['risky', 12, 20, 50],
      // 13 Nov is day 3 since the quit: the "3 days" badge morning note.
      ['dayBadge', 13, 10, 0],
      ['checkinEvening', 13, 20, 30],
      ['risky', 13, 20, 50],
    ]);
    expect(plan.find((x) => x.kind === 'risky')!.route).toBe('/camp/sos');
  });
  it('slows down later and adds badges and health milestones', () => {
    const later = planCampNotifications({ ...base, now: L(2026, 11, 20, 7), attempt: attempt(), horizonDays: 7 });
    expect(later.filter((x) => x.kind === 'daily')).toHaveLength(7);
    expect(later.some((x) => x.kind === 'dayBadge' && x.params?.days === 14)).toBe(true);
    expect(later.some((x) => x.kind === 'milestone' && x.params?.id === 'w2')).toBe(true);
    const maint = planCampNotifications({ ...base, now: L(2026, 12, 12, 7), attempt: attempt(), horizonDays: 9 });
    expect(maint.filter((x) => x.kind === 'maintenance')).toHaveLength(3);
  });
  it('respects the switch, discreet texts and the cap', () => {
    expect(planCampNotifications({ ...base, enabled: false, now: L(2026, 11, 12), attempt: attempt() })).toEqual([]);
    expect(planCampNotifications({ ...base, now: L(2026, 11, 12), attempt: null })).toEqual([]);
    const d = planCampNotifications({ ...base, discreet: true, now: L(2026, 11, 12, 6), attempt: attempt(), riskyHour: 8, horizonDays: 30 });
    expect(d.every((x) => x.titleKey.startsWith('camp.notif.discreet.'))).toBe(true);
    expect(d.length).toBeLessThanOrEqual(30);
    expect(d.every((x) => x.fireAt.getTime() > L(2026, 11, 12, 6).getTime())).toBe(true);
  });
  it('splits check-ins into morning and evening days', () => {
    expect(checkinSlotDays([{ at: iso(L(2026, 11, 12, 9)) }, { at: iso(L(2026, 11, 12, 21)) }, { at: iso(L(2026, 11, 13, 16)) }])).toEqual({ morning: ['2026-11-12'], evening: ['2026-11-12', '2026-11-13'] });
  });
});
