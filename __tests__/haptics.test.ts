import { cueForPhase, cueForPhaseStart, hapticPattern } from '@/features/training/hapticPatterns';

describe('haptic patterns', () => {
  it('strength 0 disables vibration', () => {
    expect(hapticPattern('contractStart', 0, 'ios')).toEqual({ platform: 'none' });
    expect(hapticPattern('contractStart', 0, 'android')).toEqual({ platform: 'none' });
  });

  it('android squeeze start is a single strong 400 ms pulse at normal strength', () => {
    expect(hapticPattern('contractStart', 2, 'android')).toEqual({ platform: 'android', pattern: [0, 400] });
  });

  it('android scales pulse lengths with strength', () => {
    const p1 = hapticPattern('contractStart', 1, 'android');
    const p3 = hapticPattern('contractStart', 3, 'android');
    expect(p1).toEqual({ platform: 'android', pattern: [0, 200] });
    expect(p3).toEqual({ platform: 'android', pattern: [0, 600] });
  });

  it('relax is a double pulse and exercise end a triple pulse', () => {
    const relax = hapticPattern('relaxStart', 2, 'android');
    const end = hapticPattern('exerciseEnd', 2, 'android');
    if (relax.platform !== 'android' || end.platform !== 'android') throw new Error('platform');
    expect(relax.pattern.filter((_, i) => i % 2 === 1)).toHaveLength(2);
    expect(end.pattern.filter((_, i) => i % 2 === 1)).toHaveLength(3);
    const iosRelax = hapticPattern('relaxStart', 2, 'ios');
    expect(iosRelax.platform === 'ios' && iosRelax.calls).toHaveLength(2);
    const iosEnd = hapticPattern('exerciseEnd', 2, 'ios');
    expect(iosEnd.platform === 'ios' && iosEnd.calls).toHaveLength(3);
  });

  it('ios squeeze start uses a heavy impact; ticks are light', () => {
    expect(hapticPattern('contractStart', 2, 'ios')).toEqual({
      platform: 'ios',
      calls: [{ type: 'impact', style: 'heavy', delayMs: 0 }],
    });
    expect(hapticPattern('contractTick', 2, 'ios')).toEqual({
      platform: 'ios',
      calls: [{ type: 'impact', style: 'light', delayMs: 0 }],
    });
  });

  it('unsupported platforms produce nothing', () => {
    expect(hapticPattern('tap', 2, 'web')).toEqual({ platform: 'none' });
  });

  it('maps phases to cues', () => {
    expect(cueForPhaseStart('contract')).toBe('contractStart');
    expect(cueForPhaseStart('contract', 2)).toBe('releaseStage');
    expect(cueForPhaseStart('relax')).toBe('relaxStart');
    expect(cueForPhaseStart('inhale')).toBe('breatheIn');
  });

  it('keeps rhythm pulses readable (light tick on squeeze, silent relax)', () => {
    expect(cueForPhase({ kind: 'contract', durationMs: 500 })).toBe('contractTick');
    expect(cueForPhase({ kind: 'relax', durationMs: 500 })).toBeNull();
    expect(cueForPhase({ kind: 'contract', durationMs: 3000 })).toBe('contractStart');
  });
});
