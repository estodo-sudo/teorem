import bodyscan from '@/content/bodyscan.tr.json';

describe('body scan', () => {
  it('lasts about 5 minutes', () => {
    const total = bodyscan.steps.reduce((a, s) => a + s.sec, 0);
    expect(total).toBeGreaterThanOrEqual(270);
    expect(total).toBeLessThanOrEqual(360);
  });
});
