import fs from 'fs';
import path from 'path';

import { generateSession } from '@/features/training/generateSession';
import { HOLD_LABEL_AFTER_MS, NEUTRAL, quickMs, RELAXED, SQUEEZED, sphereTarget, sphereWord } from '@/features/training/player/sphereMotion';
import tr from '@/i18n/tr.json';

describe('centre circle — v1 animation (user decision)', () => {
  it('squeeze: grows to full size in the squeeze colour, quickly (≤ 0.9 s)', () => {
    expect(sphereTarget({ kind: 'contract', durationMs: 5000 }, 'slow_hold')).toMatchObject({ scale: SQUEEZED, tone: 'accent', moveMs: 900 });
    expect(sphereTarget({ kind: 'contract', durationMs: 1000 }, 'quick_flick')).toMatchObject({ scale: SQUEEZED, moveMs: 800 });
    expect([quickMs(500), quickMs(5000)]).toEqual([400, 900]);
  });

  it('relax: shrinks back in grey', () => {
    expect(sphereTarget({ kind: 'relax', durationMs: 6000 }, 'slow_hold')).toMatchObject({ scale: RELAXED, tone: 'cool' });
    expect(SQUEEZED).toBeGreaterThan(RELAXED);
    expect(sphereTarget({ kind: 'countdown', durationMs: 3000 })).toMatchObject({ scale: NEUTRAL, tone: 'neutral' });
  });

  it('slow squeeze grows and slow release shrinks over the WHOLE phase, so "slowly" is visible', () => {
    const up = sphereTarget({ kind: 'contract', durationMs: 5000, variant: 'slowUp' }, 'elevator');
    const down = sphereTarget({ kind: 'release', durationMs: 5000, variant: 'slowDown' }, 'elevator');
    expect(up).toMatchObject({ scale: SQUEEZED, moveMs: 5000, easing: 'inOutSine' });
    expect(down).toMatchObject({ scale: RELAXED, moveMs: 5000, easing: 'inOutSine' });
    // Clearly slower than an ordinary squeeze.
    expect(up.moveMs).toBeGreaterThan(sphereTarget({ kind: 'contract', durationMs: 5000 }, 'slow_hold').moveMs * 4);
  });

  it('words: SIK → TUT; YAVAŞÇA SIK / TUT / YAVAŞÇA BIRAK; release block GEVŞE → BIRAK; no breathing words', () => {
    const hold = { kind: 'contract', durationMs: 5000 };
    expect(sphereWord(hold, HOLD_LABEL_AFTER_MS - 1)).toBe('contract');
    expect(sphereWord(hold, HOLD_LABEL_AFTER_MS)).toBe('hold');
    expect(['slowUp', 'top', 'slowDown', 'settle', 'letGo'].map((variant) => sphereWord({ kind: 'contract', durationMs: 4000, variant }, 0))).toEqual(['slowSqueeze', 'hold', 'slowRelease', 'settle', 'release']);
    // A pause: "Bırak" while the circle lets go, then "Dinlen"; a 1 s let-go is "Bırak".
    expect(sphereWord({ kind: 'transition', durationMs: 5000 }, 0)).toBe('release');
    expect(sphereWord({ kind: 'transition', durationMs: 5000 }, 1500)).toBe('rest');
    // Letting go is quicker than squeezing (≤ 0.25 s).
    for (const p of [{ kind: 'transition', durationMs: 5000 }, { kind: 'relax', durationMs: 1000 }]) expect(sphereTarget(p).moveMs).toBeLessThanOrEqual(250);
    expect(sphereTarget({ kind: 'contract', durationMs: 12000 }).moveMs).toBeGreaterThan(350);
    expect(sphereWord({ kind: 'relax', durationMs: 1000 }, 0, 'quick_flick')).toBe('release');
    const w = (tr as unknown as { player: { phase: Record<string, string> } }).player.phase;
    expect([w.contract, w.hold, w.release, w.slowSqueeze, w.slowRelease, w.settle]).toEqual(['SIK', 'TUT', 'BIRAK', 'YAVAŞÇA SIK', 'YAVAŞÇA BIRAK', 'GEVŞE']);
  });

  it('every phase of both rounds has a circle target and a word, and none says NEFES', () => {
    const w = (tr as unknown as { player: { phase: Record<string, string> } }).player.phase;
    for (const round of [1, 2] as const) {
      for (const level of [1, 30]) {
        const s = generateSession({ level, round, seed: 'x' });
        for (const p of s.phases) {
          const type = p.exerciseIndex >= 0 ? s.exercises[p.exerciseIndex]!.type : undefined;
          expect(sphereTarget(p, type).moveMs).toBeGreaterThan(0);
          const word = w[sphereWord(p, 0, type)];
          expect(word).toBeTruthy();
          expect(word).not.toMatch(/NEFES/);
        }
      }
    }
  });

  it('halo grows and trembles only while squeezing (user decision 2026-11-22); "reduce motion" stops size and tremble', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'features', 'training', 'player', 'MuscleSphere.tsx'), 'utf8');
    expect(src).toMatch(/useReducedMotion\(\)/);
    expect(src).toMatch(/const squeezing = target\.tone === 'accent' && !paused && !finished/);
    expect(src).toMatch(/if \(squeezing && !reduce\)/);
    expect(src).toMatch(/scale\.value = reduce \? 0\.8/);
  });
});
