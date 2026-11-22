import { displaySeconds } from '@/features/training/player/playerUi';
import type { Phase } from '@/features/training/types';

const ph = (kind: Phase['kind'], ms: number, ex = 0): Phase => ({ kind, durationMs: ms, exerciseIndex: ex, rep: 1, reps: 10, set: 1, sets: 1 });

describe('sphere countdown', () => {
  it('counts down a whole run of 1-second squeeze / let-go phases instead of showing "1"', () => {
    const run = Array.from({ length: 10 }, () => [ph('contract', 1000), ph('relax', 1000)]).flat();
    const phases = [ph('countdown', 3000, -1), ...run, ph('transition', 4000), ph('contract', 5000, 1)];
    expect(displaySeconds(phases, 1, 1000)).toBe(20);
    expect(displaySeconds(phases, 1, 400)).toBe(20);
    expect(displaySeconds(phases, 2, 1000)).toBe(19);
    expect(displaySeconds(phases, 20, 300)).toBe(1);
  });
  it('keeps the per-phase seconds for longer phases', () => {
    const phases = [ph('contract', 5000), ph('relax', 5000)];
    expect(displaySeconds(phases, 0, 3200)).toBe(4);
  });
});

describe('whole-exercise countdown (hızlı sık-bırak, yavaş sıkma)', () => {
  it('counts the time left in the whole exercise, not the phase', () => {
    const slow = [ph('contract', 3000), ph('contract', 500), ph('relax', 1000), ph('contract', 3000), ph('contract', 500), ph('relax', 1000), ph('transition', 5000, 1)];
    expect(displaySeconds(slow, 0, 3000, true)).toBe(9);
    expect(displaySeconds(slow, 1, 500, true)).toBe(6);
    expect(displaySeconds(slow, 5, 1000, true)).toBe(1);
  });
});
