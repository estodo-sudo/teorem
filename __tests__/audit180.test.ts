import { absoluteDay, CYCLE_FOCUS, learnedMoves, MOVE_PROGRAM, moveRows, NEW_MOVE_TYPES, withLearned, type MoveId } from '@/features/training/moves';
import { dailyContractionCap, getLevel, sessionContractionCap } from '@/features/training/levels';
import { applySessionResult, defaultTraining, migrateTraining, todayPlanDay } from '@/features/training/plan';
import { isPlanDeloadDay, sessionAllowed } from '@/features/training/schedule';
import { buildTodaySession, lessonRoute } from '@/features/training/service';
import type { GeneratedSession } from '@/features/training/types';
import { addDays } from '@/lib/date';
import type { TrainingState } from '@/types';

const START = '2027-01-01';
const LESSON_DAYS = new Map(MOVE_PROGRAM.map((m) => [m.day, m.id]));
const has = (s: GeneratedSession, id: string) => s.blocks.some((b) => b.type === id);
const newIn = (s: GeneratedSession) => s.blocks.filter((b) => NEW_MOVE_TYPES.has(b.type)).map((b) => b.type);
const cycles = (s: GeneratedSession) => s.blocks.filter((b) => b.type === 'quick_flick').length;

/** Learns the lesson the route points at (what "Hazırım" does). */
function learn(t: TrainingState, route: NonNullable<ReturnType<typeof lessonRoute>>): TrainingState {
  if (route.pathname === '/workout/round2-intro') return { ...t, round2IntroDone: true };
  return { ...t, movesLearned: withLearned(t, route.params.move as MoveId) };
}

/** One normal day: Tur 1, the lesson if one is due (learned), Tur 2. */
function liveDay(t: TrainingState, date: string) {
  const tur1 = buildTodaySession(t, date, { round: 1, strengthFalling: false });
  let next = applySessionResult(t, { date, feedback: 'ok' });
  const route = lessonRoute(next, 'w', date);
  if (route) next = learn(next, route);
  const again = lessonRoute(next, 'w', date);
  const tur2 = buildTodaySession(next, date, { round: 2, strengthFalling: false });
  return { tur1, tur2, route, again, next };
}

describe('180-day audit (round 3, 2026-11-26)', () => {
  it('lives through all 180 days and into plan 2: lessons on exactly the right days, once; the right moves every day', () => {
    let t = defaultTraining();
    let date = START;
    const lessons: [number, string][] = [];
    for (let day = 1; day <= 190; day++) {
      const abs = absoluteDay(t.planNumber, todayPlanDay(t, date));
      expect(abs).toBe(day);
      const learnedBefore = learnedMoves(t);
      const { tur1, tur2, route, again, next } = liveDay(t, date);
      // lessons: only on their day, never twice
      if (route) lessons.push([day, route.pathname === '/workout/round2-intro' ? 'elevator' : route.params.move!]);
      expect(again).toBeNull();
      expect(Boolean(route)).toBe(LESSON_DAYS.has(day));
      // Tur 1 has the latest move learned before today (none on day 1); after day 180 the cycle day's move
      const focus = day > 180 ? CYCLE_FOCUS[(day - 181) % 7]! : undefined;
      const latest1 = focus ?? learnedBefore.at(-1);
      if (latest1) expect(has(tur1, latest1)).toBe(true);
      expect(newIn(tur1).length).toBeLessThanOrEqual(1);
      // Tur 2 has the latest move including today's lesson (Yavaş Sıkma is always in Tur 2)
      const learnedNow = learnedMoves(next);
      expect(has(tur2, focus ?? learnedNow.at(-1)!)).toBe(true);
      expect(has(tur2, 'elevator')).toBe(true);
      expect(newIn(tur2).length).toBeLessThanOrEqual(2);
      for (const b of [...newIn(tur1), ...newIn(tur2)]) expect(learnedNow).toContain(b);
      // light week of each stage: Tur 1 one cycle shorter, the move stays
      const light = day <= 180 ? isPlanDeloadDay(day - 1) : (day - 181) % 7 === 6;
      expect(cycles(tur1)).toBe(getLevel(tur1.level).cycles - (light ? 1 : 0));
      // the day stays within the contraction cap and a sensible length
      expect(tur1.contractions + tur2.contractions).toBeLessThanOrEqual(sessionContractionCap(tur1.level));
      expect(tur1.plannedSec + tur2.plannedSec).toBeLessThan(13 * 60);
      t = next;
      date = addDays(date, 1);
    }
    expect(lessons).toEqual(MOVE_PROGRAM.map((m) => [m.day, m.id]));
    // 190 days done: the 180-day plan and 10 days of cycles (cycle 2, day 4 next)
    expect(t).toMatchObject({ planNumber: 3, planDayIndex: 3 });
    expect(learnedMoves(t)).toEqual(MOVE_PROGRAM.map((m) => m.id));
  });

  it('"Tur 2\'yi sonra yap" on day 11: the move is not learned; the lesson comes after the next Tur 1', () => {
    let t: TrainingState = { ...defaultTraining(), planDayIndex: 10, round2IntroDone: true };
    t = applySessionResult(t, { date: START, feedback: 'ok' });
    expect(lessonRoute(t, 'w', START)).toMatchObject({ params: { move: 'step_up' } });
    // skipped: Tur 2 later today still offers the lesson first
    expect(lessonRoute(t, undefined, START)).toMatchObject({ params: { move: 'step_up' } });
    const next = addDays(START, 1);
    const tur1 = buildTodaySession(t, next, { strengthFalling: false });
    expect(newIn(tur1)).toEqual([]);
    expect(has(tur1, 'elevator')).toBe(true);
    t = applySessionResult(t, { date: next, feedback: 'ok' });
    expect(lessonRoute(t, 'w', next)).toMatchObject({ params: { move: 'step_up' } });
  });

  it('a repeated day ("Tamamlayamadım") and an extra session the same day do not move or repeat lessons', () => {
    let t: TrainingState = { ...defaultTraining(), planDayIndex: 15, round2IntroDone: true, movesLearned: ['step_up'] };
    // day 16 failed: the plan stays on day 16, the lesson is not due until Tur 1 counts
    const failed = applySessionResult(t, { date: START, feedback: 'failed' });
    expect(todayPlanDay(failed, addDays(START, 1))).toBe(15);
    t = applySessionResult(t, { date: START, feedback: 'ok' });
    t = learn(t, lessonRoute(t, 'w', START)!);
    expect(learnedMoves(t)).toContain('step_down');
    // an extra Tur 1 later the same day replays day 16: no new lesson, step_down already in it
    expect(lessonRoute(t, 'w', START)).toBeNull();
    expect(has(buildTodaySession(t, START, { strengthFalling: false }), 'step_down')).toBe(true);
  });

  it('days follow the plan, not the calendar: missed days do not skip a lesson', () => {
    let t: TrainingState = { ...defaultTraining(), planDayIndex: 9, round2IntroDone: true, lastAdvancedDate: '2026-12-01' };
    // two weeks away, then day 10 and day 11 of the plan
    let date = '2026-12-15';
    t = applySessionResult(t, { date, feedback: 'ok' });
    expect(lessonRoute(t, 'w', date)).toBeNull();
    date = addDays(date, 1);
    t = applySessionResult(t, { date, feedback: 'ok' });
    expect(lessonRoute(t, 'w', date)).toMatchObject({ params: { move: 'step_up' } });
  });

  it('someone already far along (an old 30-day plan carried over) learns the moves one a day, in order', () => {
    let t = migrateTraining({ level: 10, planNumber: 3, planDayIndex: 5, round2IntroDone: true });
    expect(absoluteDay(t.planNumber, t.planDayIndex)).toBe(66);
    let date = START;
    const got: string[] = [];
    for (let i = 0; i < 8; i++) {
      t = applySessionResult(t, { date, feedback: 'ok' });
      const r = lessonRoute(t, 'w', date);
      if (r) {
        got.push(r.params.move!);
        t = learn(t, r);
      }
      date = addDays(date, 1);
    }
    expect(got).toEqual(['step_up', 'step_down', 'double_peak', 'half_quick', 'half_hold', 'wave']);
  });

  it('İlerleme lists all seven moves by state for any day', () => {
    const rows = moveRows(['elevator', 'step_up'], 13);
    expect(rows.map((r) => r.state)).toEqual(['learned', 'current', 'next', 'locked', 'locked', 'locked', 'locked']);
    expect(rows[2]).toMatchObject({ id: 'step_down', day: 16, daysLeft: 3 });
    expect(moveRows([], 1)[0]).toMatchObject({ id: 'elevator', state: 'next', daysLeft: 0 });
    expect(moveRows(MOVE_PROGRAM.map((m) => m.id), 200).filter((r) => r.state === 'current').map((r) => r.id)).toEqual(['wave']);
  });

  it('after day 180 a 7-day cycle repeats for ever: each day its move, every move twice a week, day 7 light', () => {
    const all = MOVE_PROGRAM.map((m) => m.id);
    let t: TrainingState = { ...defaultTraining(), planDayIndex: 179, round2IntroDone: true, movesLearned: all.filter((id) => id !== 'elevator') };
    let date = START;
    t = applySessionResult(t, { date, feedback: 'ok' });
    expect(t).toMatchObject({ planNumber: 2, planDayIndex: 0 });
    const weeks: string[][] = [];
    for (let w = 0; w < 3; w++) {
      const seen: string[] = [];
      for (let d = 0; d < 7; d++) {
        date = addDays(date, 1);
        expect(todayPlanDay(t, date)).toBe(d);
        const tur1 = buildTodaySession(t, date, { strengthFalling: false });
        const tur2 = buildTodaySession(t, date, { round: 2, strengthFalling: false });
        expect(has(tur1, CYCLE_FOCUS[d]!)).toBe(true);
        expect(tur1.deload).toBe(d === 6);
        seen.push(...newIn(tur1), ...newIn(tur2));
        if (d === 6) expect(newIn(tur2)).toEqual([]);
        expect(lessonRoute(t, 'w', date)).toBeNull();
        t = applySessionResult(t, { date, feedback: 'ok' });
      }
      weeks.push(seen.sort());
      // each of the six new moves: in Tur 1 and Tur 2 on its day, and once more as Tur 2's repeat
      for (const id of NEW_MOVE_TYPES) expect([id, seen.filter((x) => x === id).length]).toEqual([id, 3]);
    }
    expect(weeks[1]).toEqual(weeks[0]);
    expect(weeks[2]).toEqual(weeks[0]);
    expect(t.planNumber).toBe(5);
  });

  it('someone who skipped some lessons gets only learned moves in the cycle and the missing lessons still come', () => {
    const t: TrainingState = { ...defaultTraining(), planNumber: 2, planDayIndex: 1, round2IntroDone: true, movesLearned: ['step_up'] };
    // cycle day 2 is Basamaklı Bırakma's day: not learned, so the latest learned move instead
    const tur1 = buildTodaySession(t, START, { strengthFalling: false });
    expect(newIn(tur1)).toEqual(['step_up']);
    expect(lessonRoute(applySessionResult(t, { date: START, feedback: 'ok' }), 'w', START)).toMatchObject({ params: { move: 'step_down' } });
  });
});

describe('Kegel audit: caps and lengths at every level (round 3, 2026-11-26)', () => {
  it('Tur 1 + Tur 2 + the one extra round always fit the daily cap, on every day of the plan and the cycle', () => {
    const all = MOVE_PROGRAM.map((m) => m.id);
    for (const level of [1, 8, 15, 22, 30]) {
      let worst = 0;
      for (let day = 1; day <= 187; day++) {
        const pos = day <= 180 ? { planNumber: 1, planDayIndex: day - 1 } : { planNumber: 2, planDayIndex: day - 181 };
        const t: TrainingState = { ...defaultTraining(), ...pos, level, round2IntroDone: true, movesLearned: MOVE_PROGRAM.filter((m) => m.day <= day && m.id !== 'elevator').map((m) => m.id) };
        const tur1 = buildTodaySession(t, START, { strengthFalling: false });
        const tur2 = buildTodaySession(t, START, { round: 2, strengthFalling: false });
        const used = tur1.contractions + tur2.contractions + Math.max(tur1.contractions, tur2.contractions);
        worst = Math.max(worst, used);
        expect([level, day, used <= dailyContractionCap(level)]).toEqual([level, day, true]);
        expect(sessionAllowed(tur1.contractions + tur2.contractions, Math.max(tur1.contractions, tur2.contractions), level)).toBe(true);
        // a day (both rounds) stays under 12 minutes even at level 30
        expect([level, day, tur1.plannedSec + tur2.plannedSec < 12 * 60]).toEqual([level, day, true]);
      }
      expect(worst).toBeGreaterThan(0);
      expect(all.length).toBe(7);
    }
  });
});
