import en from '@/i18n/en.json';
import tr from '@/i18n/tr.json';
import { PLAN_LENGTH_DAYS, PLAN_STAGE_DAYS } from '@/config/app';
import fs from 'fs';
import path from 'path';

import { generateMoveDemo, generateSession } from '@/features/training/generateSession';
import { phaseVibration } from '@/features/training/hapticPatterns';
import { sessionContractionCap } from '@/features/training/levels';
import { lessonRoute } from '@/features/training/service';
import { absoluteDay, learnedMoves, lessonDue, MOVE_PROGRAM, moveShape, NEW_MOVE_TYPES, plannedLearned, roundMoves, withLearned, type MoveId } from '@/features/training/moves';
import { advancePlan, defaultTraining, todayPlanDay } from '@/features/training/plan';
import { levelWord, scaleForLevel, sphereTarget } from '@/features/training/player/sphereMotion';
import { roadmapNodes, weekTheme } from '@/features/training/roadmap';
import { soundForPhaseStart } from '@/features/training/sounds';
import { isPlanDeloadDay, planStageOf } from '@/features/training/schedule';
import type { GeneratedSession, Phase } from '@/features/training/types';
import { addDays } from '@/lib/date';

// sounds.ts loads expo-audio, which has no native module in tests
jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn(), setAudioModeAsync: jest.fn(() => Promise.resolve()) }));

const NEW: Exclude<MoveId, 'elevator'>[] = ['step_up', 'step_down', 'double_peak', 'half_quick', 'half_hold', 'wave'];
const blockOf = (s: GeneratedSession, type: string) => s.blocks.findIndex((b) => b.type === type);
const phasesOf = (s: GeneratedSession, i: number) => s.phases.filter((p) => p.exerciseIndex === i && p.kind !== 'transition');

describe('the 180-day plan (2026-11-26)', () => {
  it('is 180 days in six 30-day stages, each ending with its light week', () => {
    expect(PLAN_LENGTH_DAYS).toBe(180);
    expect(PLAN_STAGE_DAYS * 6).toBe(PLAN_LENGTH_DAYS);
    expect([0, 29, 30, 179].map(planStageOf)).toEqual([0, 0, 1, 5]);
    for (let stage = 0; stage < 6; stage++) {
      const light = Array.from({ length: 30 }, (_, i) => stage * 30 + i).filter(isPlanDeloadDay);
      expect(light).toEqual(Array.from({ length: 9 }, (_, i) => stage * 30 + 21 + i));
    }
    expect(absoluteDay(1, 0)).toBe(1);
    expect(absoluteDay(2, 0)).toBe(181);
  });

  it('the plan advances day by day to 180, then plan 2 begins', () => {
    let t = defaultTraining();
    let date = '2026-01-01';
    for (let i = 0; i < 180; i++) {
      expect(todayPlanDay(t, date)).toBe(i);
      t = advancePlan(t, date);
      date = addDays(date, 1);
    }
    expect(t).toMatchObject({ planDayIndex: 0, planNumber: 2 });
  });

  it('the roadmap shows today’s 30-day stage; week titles count across the plan', () => {
    const t = { ...defaultTraining(), planDayIndex: 44 };
    const nodes = roadmapNodes(t, '2026-11-26').filter((n) => n.stage === 1);
    expect(nodes).toHaveLength(30);
    expect(nodes[0]!.day).toBe(30);
    expect(nodes.find((n) => n.state === 'today')!.day).toBe(44);
    expect(nodes.filter((n) => n.state === 'done')).toHaveLength(14);
    expect(weekTheme(0, 0).title).toMatch(/^1\. Hafta/);
    expect(weekTheme(0, 1).title).toBe('5. Hafta: Tazele');
    expect(weekTheme(3, 1).title).toMatch(/^8\. Hafta/);
    expect(weekTheme(3, 1).text).toMatch(/52\.–60\./);
    expect(weekTheme(3, 5).title).toMatch(/^24\. Hafta/);
  });
});

describe('the moves of the 180-day plan', () => {
  it('are taught on days 1, 11, 16, 24, 32, 45 and 55, in this order', () => {
    expect(MOVE_PROGRAM.map((m) => [m.id, m.day])).toEqual([
      ['elevator', 1],
      ['step_up', 11],
      ['step_down', 16],
      ['double_peak', 24],
      ['half_quick', 32],
      ['half_hold', 45],
      ['wave', 55],
    ]);
  });

  it('a lesson is due on its day after Tur 1, once, and one at a time for someone behind', () => {
    const t = { round2IntroDone: true };
    expect(lessonDue({}, 1)).toBe('elevator');
    expect(lessonDue(t, 10)).toBeNull();
    expect(lessonDue(t, 11)).toBe('step_up');
    const after = { ...t, movesLearned: withLearned(t, 'step_up') };
    expect(lessonDue(after, 11)).toBeNull();
    expect(lessonDue(after, 15)).toBeNull();
    expect(lessonDue(after, 16)).toBe('step_down');
    // far behind (e.g. an old plan carried over to day 60): the next one, not all at once
    expect(lessonDue(t, 60)).toBe('step_up');
    expect(learnedMoves({ round2IntroDone: true, movesLearned: ['wave', 'step_up'] })).toEqual(['elevator', 'step_up', 'wave']);
    // a later move implies Yavaş Sıkma (it always comes first)
    expect(learnedMoves({ movesLearned: ['step_up'] })).toEqual(['elevator', 'step_up']);
    expect(lessonDue({ movesLearned: ['step_up'] }, 16)).toBe('step_down');
  });

  it('the latest move is in both rounds; earlier new moves take turns in Tur 2, one a day in order', () => {
    expect(roundMoves([], 5, 1)).toEqual({});
    // Yavaş Sıkma latest: added to Tur 1, Tur 2 already has it
    expect(roundMoves(['elevator'], 5, 1)).toEqual({ latest: 'elevator' });
    expect(roundMoves(['elevator'], 5, 2)).toEqual({});
    expect(roundMoves(['elevator', 'step_up'], 12, 2)).toEqual({ latest: 'step_up' });
    const learned: MoveId[] = ['elevator', 'step_up', 'step_down', 'double_peak', 'half_quick'];
    const reviews = [40, 41, 42, 43, 44, 45].map((d) => roundMoves(learned, d, 2));
    expect(reviews.every((r) => r.latest === 'half_quick')).toBe(true);
    // Hızlı Yarım Sıkma came on day 32: from then on step_up, step_down, double_peak, step_up …
    expect(roundMoves(learned, 32, 2).review).toBe('step_up');
    expect(reviews.map((r) => r.review)).toEqual(['double_peak', 'step_up', 'step_down', 'double_peak', 'step_up', 'step_down']);
    expect(roundMoves(learned, 40, 1)).toEqual({ latest: 'half_quick' });
  });

  it('a 180-day run on schedule: every day has the right moves, every earlier move keeps coming back', () => {
    const lastSeen = new Map<string, number>();
    for (let day = 1; day <= 180; day++) {
      const tur1 = generateSession({ level: 15, seed: `d${day}`, moves: roundMoves(plannedLearned(day), day, 1) });
      // after Tur 1 the day's lesson (if any) is learned, then Tur 2
      const learned = MOVE_PROGRAM.filter((m) => m.day <= day).map((m) => m.id);
      const tur2 = generateSession({ level: 15, seed: `d${day}`, round: 2, moves: roundMoves(learned, day, 2) });
      const latestTur1 = plannedLearned(day).at(-1);
      const latestTur2 = learned.at(-1)!;
      if (latestTur1) expect(blockOf(tur1, latestTur1)).toBeGreaterThan(-1);
      expect(blockOf(tur2, latestTur2)).toBeGreaterThan(-1);
      // no move the person has not learned yet
      for (const s of [tur1, tur2]) for (const b of s.blocks) if (NEW_MOVE_TYPES.has(b.type)) expect(learned).toContain(b.type);
      // never more than the latest plus one review
      expect(tur1.blocks.filter((b) => NEW_MOVE_TYPES.has(b.type)).length).toBeLessThanOrEqual(1);
      expect(tur2.blocks.filter((b) => NEW_MOVE_TYPES.has(b.type)).length).toBeLessThanOrEqual(2);
      expect(tur1.contractions + tur2.contractions).toBeLessThanOrEqual(sessionContractionCap(15));
      for (const b of tur2.blocks) if (NEW_MOVE_TYPES.has(b.type)) lastSeen.set(b.type, day);
      // an earlier new move is never away for longer than the number of earlier moves (it rotates)
      const pool = learned.filter((id) => id !== 'elevator' && id !== latestTur2);
      for (const id of pool) {
        const learnedOn = MOVE_PROGRAM.find((m) => m.id === id)!.day;
        if (day - learnedOn > pool.length) expect(day - (lastSeen.get(id) ?? 0)).toBeLessThanOrEqual(pool.length);
      }
    }
    expect([...lastSeen.keys()].sort()).toEqual([...NEW].sort());
  });

  it('each move goes as described: its steps, levels and timing', () => {
    const levels = (id: Exclude<MoveId, 'elevator'>) => moveShape(id, 1).steps.map((s) => Number(s.level.toFixed(2)));
    expect(levels('step_up')).toEqual([0.33, 0.67, 1, 0]);
    expect(levels('step_down')).toEqual([1, 1, 0.67, 0.33, 0]);
    expect(moveShape('step_down', 1).steps[0]!.ramp).toBe(true);
    expect(levels('double_peak')).toEqual([1, 0.5, 1, 0]);
    expect(levels('half_quick')).toEqual([0.5, 0]);
    expect(moveShape('half_quick', 1).steps.map((s) => s.sec)).toEqual([1, 1]);
    expect(levels('half_hold')).toEqual([0.5, 0]);
    expect(moveShape('half_hold', 1).steps[0]!.sec).toBe(10);
    expect(moveShape('half_hold', 30).steps[0]!.sec).toBe(16);
    expect(levels('wave')).toEqual([1, 0.5, 1, 0.5, 0]);
    expect(moveShape('wave', 30).steps[3]!.sec).toBe(10);
    for (const id of NEW) {
      expect(moveShape(id, 30).reps).toBeGreaterThanOrEqual(moveShape(id, 1).reps);
      const s = generateSession({ level: 10, seed: 'x', moves: { latest: id } });
      const ph = phasesOf(s, blockOf(s, id));
      // every rep ends let go, and each step knows the level before it
      expect(ph.at(-1)!.kind).toBe('relax');
      ph.forEach((p, i) => {
        if (p.kind === 'contract') expect(p.level).toBeGreaterThan(0);
        expect(p.fromLevel).toBe(i === 0 || ph[i - 1]!.kind === 'relax' ? 0 : ph[i - 1]!.level);
      });
    }
  });

  it('shows the step on screen, sizes the circle and vibrates more softly for a partial squeeze', () => {
    const words = (id: Exclude<MoveId, 'elevator'>) => {
      const s = generateSession({ level: 1, seed: 'x', moves: { latest: id } });
      return phasesOf(s, blockOf(s, id))
        .slice(0, moveShape(id, 1).steps.length)
        .map((p) => levelWord(p as Phase, 0));
    };
    expect(words('step_up')).toEqual(['third', 'twoThirds', 'full', null]);
    expect(words('step_down')).toEqual([null, 'hold', 'downTwoThirds', 'downThird', null]);
    expect(words('double_peak')).toEqual(['full', 'downHalf', 'full', null]);
    expect(words('half_quick')).toEqual(['half', null]);
    expect(words('wave')).toEqual(['full', 'downHalf', 'full', 'downHalf', null]);
    expect(levelWord({ kind: 'contract', durationMs: 10000, level: 0.5, fromLevel: 0 }, 0)).toBe('half');
    expect(levelWord({ kind: 'contract', durationMs: 10000, level: 0.5, fromLevel: 0 }, 1500)).toBe('holdHalf');
    expect(scaleForLevel(1 / 3)).toBeLessThan(scaleForLevel(0.5));
    expect(sphereTarget({ kind: 'contract', durationMs: 2000, level: 0.5, fromLevel: 1 }).scale).toBeCloseTo(scaleForLevel(0.5));
    const peak = (level?: number) => Math.max(...phaseVibration({ kind: 'contract', durationMs: 2000, ...(level !== undefined ? { level } : {}) }).map((e) => ('intensity' in e ? e.intensity : 0)));
    expect(peak(1 / 3)).toBeLessThan(peak(0.5));
    expect(peak(0.5)).toBeLessThan(peak(1));
    expect(peak(1)).toBe(peak());
  });

  it('has names, descriptions, block lines, screen words and coach lines in Turkish and English', () => {
    for (const lang of [tr, en] as const) {
      const d = lang as unknown as Record<string, Record<string, Record<string, unknown>>>;
      for (const id of NEW) {
        expect(d.exercise![id]).toMatchObject({ name: expect.any(String), desc: expect.any(String) });
        expect(typeof d.block![id]).toBe('string');
      }
      for (const w of ['third', 'twoThirds', 'half', 'full', 'downTwoThirds', 'downThird', 'downHalf', 'holdHalf']) {
        expect(typeof (d.player!.phase as Record<string, string>)[w]).toBe('string');
        expect(typeof (d.player!.voice as Record<string, string>)[w]).toBe('string');
      }
    }
    expect(tr.exercise.step_up.name).toBe('Basamaklı Sıkma');
    expect(tr.exercise.wave.name).toBe('Dalga');
  });
});

describe('move lessons (round 2, 2026-11-26)', () => {
  const read = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
  const at = (day: number, extra: Partial<ReturnType<typeof defaultTraining>> = {}) => ({ ...defaultTraining(), planDayIndex: day - 1, ...extra });

  it('after Tur 1 the lesson due today opens, then Tur 2: yavaş sıkma the first time, a new move on its day', () => {
    const today = '2026-11-26';
    expect(lessonRoute(at(1), 'w1', today)).toEqual({ pathname: '/workout/round2-intro', params: { first: 'w1' } });
    expect(lessonRoute(at(10, { round2IntroDone: true }), 'w1', today)).toBeNull();
    expect(lessonRoute(at(11, { round2IntroDone: true }), 'w1', today)).toEqual({ pathname: '/workout/move-intro', params: { first: 'w1', move: 'step_up' } });
    // Tur 1 already moved the plan on today: the lesson still belongs to the finished day
    expect(lessonRoute({ ...at(12, { round2IntroDone: true }), lastAdvancedDate: today }, undefined, today)).toEqual({ pathname: '/workout/move-intro', params: { move: 'step_up' } });
    expect(lessonRoute(at(12, { round2IntroDone: true, movesLearned: ['step_up'] }), 'w1', today)).toBeNull();
    expect(lessonRoute(at(55, { round2IntroDone: true, movesLearned: ['step_up', 'step_down', 'double_peak', 'half_quick', 'half_hold'] }), 'w1', today)).toMatchObject({ params: { move: 'wave' } });
  });

  it('the lesson screen: learn → practice → check; "Hazırım" learns the move and starts Tur 2', () => {
    const screen = read('app/workout/move-intro.tsx');
    expect(screen).toMatch(/update\(\{ movesLearned: withLearned\(training, move\) \}\)/);
    expect(screen).toMatch(/sessionId: 'round2'/);
    expect(screen).toMatch(/generateMoveDemo\(move\)/);
    expect(read('app/workout/[sessionId].tsx')).toMatch(/lessonRoute\(useTrainingStore\.getState\(\)\.training, w\.id\)/);
    expect(read('app/workout/next.tsx')).toMatch(/lessonRoute\(training, id\)/);
    expect(read('src/features/training/useSessionStarter.tsx')).toMatch(/lessonRoute\(useTrainingStore\.getState\(\)\.training\)/);
    for (const id of NEW) {
      const demo = generateMoveDemo(id);
      expect(demo.blocks).toEqual([expect.objectContaining({ type: id })]);
      expect(demo.plannedSec).toBeLessThan(40);
    }
  });

  it('every lesson has its steps and check questions in Turkish and English', () => {
    for (const lang of [tr, en] as const) {
      const mi = (lang as unknown as { moveIntro: { moves: Record<string, { steps: string[]; checkItems: string[] }>; title: string } }).moveIntro;
      expect(mi.title).toMatch(/\{\{name\}\}/);
      for (const id of NEW) {
        expect(mi.moves[id]!.steps.length).toBeGreaterThanOrEqual(3);
        expect(mi.moves[id]!.checkItems).toHaveLength(3);
      }
    }
  });
});

describe('sound cues for the steps (round 3 audit, 2026-11-26)', () => {
  it('stepping up rises, stepping down falls, holding is quiet', () => {
    expect(soundForPhaseStart('contract', undefined, undefined, 1 / 3, 0)).toBe('rise');
    expect(soundForPhaseStart('contract', undefined, undefined, 2 / 3, 1 / 3)).toBe('rise');
    expect(soundForPhaseStart('contract', undefined, undefined, 0.5, 1)).toBe('fall');
    expect(soundForPhaseStart('contract', undefined, undefined, 1, 1)).toBeNull();
    expect(soundForPhaseStart('contract')).toBe('rise');
  });
});
