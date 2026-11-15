import bodyscan from '@/content/bodyscan.tr.json';
import { BREATH_PATTERNS, breathingPhases, cycleSec } from '@/features/mind/breathing';

describe('breathing', () => {
  it('box breathing is 4-4-4-4 and 4-7-8 is 4-7-8', () => {
    expect(BREATH_PATTERNS.box.steps.map((s) => s.sec)).toEqual([4, 4, 4, 4]);
    expect(BREATH_PATTERNS['478'].steps.map((s) => s.sec)).toEqual([4, 7, 8]);
  });
  it('fits whole cycles into the chosen duration', () => {
    for (const id of ['box', '478'] as const) {
      for (const min of [1, 3, 5]) {
        const p = breathingPhases(id, min);
        const total = p.reduce((a, x) => a + x.durationMs, 0) / 1000;
        expect(Math.abs(total - min * 60)).toBeLessThanOrEqual(cycleSec(BREATH_PATTERNS[id]) / 2);
        expect(p.length % BREATH_PATTERNS[id].steps.length).toBe(0);
      }
    }
  });
  it('always has at least one cycle', () => {
    expect(breathingPhases('478', 0)).toHaveLength(3);
  });
});

describe('body scan', () => {
  it('lasts about 5 minutes', () => {
    const total = bodyscan.steps.reduce((a, s) => a + s.sec, 0);
    expect(total).toBeGreaterThanOrEqual(270);
    expect(total).toBeLessThanOrEqual(360);
  });
});
