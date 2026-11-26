import { createMemoryRepo } from '@/features/data/repo';
import { generateSession } from '@/features/training/generateSession';
import { defaultTraining } from '@/features/training/plan';
import { recordWorkout, submitFeedback } from '@/features/training/service';
import { dailyProgress, levelOutlook, sessionSummary } from '@/features/training/summary';
import tr from '@/i18n/tr.json';
import { setHistoryRepo, useHistoryStore } from '@/stores/historyStore';
import { useTrainingStore } from '@/stores/trainingStore';

const session = generateSession({ level: 12, dayIndex: 1, weekIndex: 4, seed: 'x' });
const all = (done: boolean) => session.blocks.map(() => ({ completed: done, skipped: false }));

beforeEach(() => {
  setHistoryRepo(createMemoryRepo());
  useHistoryStore.getState().replaceAll({ workouts: [], strengthTests: [], fitnessLogs: [], notes: [] });
  useTrainingStore.getState().replace({ ...defaultTraining(), level: 7, consecutiveOk: 2 });
});

describe('session summary (spec 7.5)', () => {
  it('counts contractions, total hold and the longest hold in finished blocks only', () => {
    const full = sessionSummary(session, all(true));
    expect(full.contractions).toBe(session.contractions);
    const expectedHold = session.blocks.filter((b) => b.type !== 'release' && b.type !== 'breath').reduce((a, b) => a + (b.holdSec ?? 0) * b.reps, 0);
    expect(full.holdSec).toBeCloseTo(expectedHold, 1);
    expect(full.longestHoldSec).toBe(Math.max(...session.blocks.filter((b) => b.type !== 'release' && b.type !== 'breath').map((b) => b.holdSec ?? 0)));
    expect(sessionSummary(session, all(false))).toEqual({ contractions: 0, holdSec: 0, longestHoldSec: 0 });
  });

  it('tomorrow: up / down / same / shorter after "hard" / locked by a pain report', () => {
    expect(levelOutlook({ before: 7, after: 8 })).toBe('up');
    expect(levelOutlook({ before: 7, after: 6 })).toBe('down');
    expect(levelOutlook({ before: 7, after: 7 })).toBe('same');
    expect(levelOutlook({ before: 7, after: 7, suggestShorter: true })).toBe('sameShorter');
    expect(levelOutlook({ before: 7, after: 7, locked: true, wouldRise: true })).toBe('locked');
    expect(levelOutlook({ before: 7, after: 7, locked: true, wouldRise: false })).toBe('same');
    expect(levelOutlook({ before: 1, after: 1, struggled: true })).toBe('steady');
  });

  it('the day counts its two halves: a finished Tur 1, then Tur 2 (2026-11-25)', () => {
    const w = [
      { date: '2026-11-19', completed: true },
      { date: '2026-11-19', completed: false },
      { date: '2026-11-18', completed: true },
    ];
    expect(dailyProgress(w, '2026-11-19')).toEqual({ done: 1, target: 2, reached: false });
    expect(dailyProgress([...w, { date: '2026-11-19', completed: true }], '2026-11-19').reached).toBe(false);
    expect(dailyProgress([...w, { date: '2026-11-19', completed: true, round: 2 as const }], '2026-11-19').reached).toBe(true);
  });

  it('the workout stores what was done; feedback returns the level change and the technique answer', () => {
    const w = recordWorkout(session, { actualSec: 300, endedEarly: false, outcomes: all(true), pauses: 0 }, new Date(2026, 10, 19, 20));
    expect(w).toMatchObject({ contractions: session.contractions, completionRate: 1 });
    expect(w.holdSec).toBeGreaterThan(0);
    const out = submitFeedback(w.id, 'ok', 'unsure')!;
    expect(out).toMatchObject({ before: 7, after: 8, suggestShorter: false, locked: false });
    expect(useHistoryStore.getState().workouts[0]).toMatchObject({ feedback: 'ok', techniqueConfidence: 'unsure' });
  });

  it('"hard" keeps the level (no shorter preset any more); a pain lock reports why the level stays', () => {
    const w = recordWorkout(session, { actualSec: 300, endedEarly: false, outcomes: all(true) }, new Date(2026, 10, 19, 20));
    expect(submitFeedback(w.id, 'hard')).toMatchObject({ before: 7, after: 7, suggestShorter: false, struggled: true });
    useTrainingStore.getState().update({ levelLockUntil: '2026-11-25' });
    const w2 = recordWorkout(session, { actualSec: 300, endedEarly: false, outcomes: all(true) }, new Date(2026, 10, 20, 20));
    expect(submitFeedback(w2.id, 'easy')).toMatchObject({ after: 7, locked: true, wouldRise: true });
  });

  it('texts for every outlook, the technique tips and the shorter-preset button exist', () => {
    const f = (tr as unknown as { feedback: { outlook: Record<string, { title: string; body: string } | string>; technique: { tips: unknown[] } } }).feedback;
    for (const k of ['up', 'down', 'same', 'sameShorter', 'steady', 'locked']) expect(f.outlook[k]).toMatchObject({ title: expect.any(String), body: expect.any(String) });
    expect(f.technique.tips.length).toBeGreaterThanOrEqual(3);
    expect(typeof f.outlook.shorten).toBe('string');
  });
});
