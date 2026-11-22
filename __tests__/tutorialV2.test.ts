import fs from 'fs';
import path from 'path';

import { isAllowedDuringFirstRun } from '@/features/app/gate';
import { applySessionResult, defaultTraining, migrateTraining } from '@/features/training/plan';
import { buildTodaySession } from '@/features/training/service';
import { CHECKLIST, checklistDone, generateReleasePractice, TUTORIAL_ORDER } from '@/features/training/tutorial';
import tr from '@/i18n/tr.json';

const root = path.join(__dirname, '..');
type TutorialI18n = { tutorial: Record<string, unknown> & { checklist: { items: Record<string, { title: string }> }; mistakes: { items: { title: string }[] }; find: { warn: string }; ready: { body: string[] } } };
const T = (tr as unknown as TutorialI18n).tutorial;

describe('tutorial v2 (spec 12)', () => {
  it('order: position training, checklist, vibration game, trial, release practice, mistakes, ready', () => {
    const at = (s: string) => TUTORIAL_ORDER.indexOf(s as never);
    expect(at('position')).toBeGreaterThan(at('find'));
    // The anatomy animation comes right after "Kası nasıl bulursun?".
    expect(at('anatomy')).toBe(at('find') + 1);
    expect(at('checklist')).toBeLessThan(at('trial'));
    // The vibration matching game was removed: the screen already says what to do.
    expect(TUTORIAL_ORDER).not.toContain('vibration');
    expect(at('release')).toBeGreaterThan(at('check'));
    expect(at('mistakes')).toBe(TUTORIAL_ORDER.length - 2);
    expect(TUTORIAL_ORDER.at(-1)).toBe('ready');
  });

  it('checklist: hips, belly, breath and legs — every one needs a yes', () => {
    expect([...CHECKLIST]).toEqual(['glutes', 'belly', 'breath', 'legs']);
    expect(checklistDone(['glutes', 'belly', 'breath'])).toBe(false);
    expect(checklistDone(['legs', 'breath', 'belly', 'glutes'])).toBe(true);
    for (const id of CHECKLIST) expect(T.checklist.items[id]?.title).toBeTruthy();
  });

  it('release practice: 2 × squeeze 3 s → release 6 s (release at least twice as long)', () => {
    const s = generateReleasePractice();
    expect(s.phases.filter((p) => p.kind === 'contract').map((p) => p.durationMs)).toEqual([3000, 3000]);
    expect(s.phases.filter((p) => p.kind === 'relax').map((p) => p.durationMs)).toEqual([6000, 6000]);
    expect(s.plannedSec).toBe(Math.round(s.phases.reduce((a, p) => a + p.durationMs, 0) / 1000));
  });

  it('safety texts: no exercise while urinating; common mistakes cover breath, glutes, bearing down, overdoing', () => {
    expect(T.find.warn).toMatch(/İdrar yaparken egzersiz yapma/);
    expect(T.mistakes.items.map((m) => m.title)).toEqual(['Nefes tutmak', 'Kalçayı sıkmak', 'Ikınmak', 'Aşırı tekrar']);
    expect(T.ready.body.join(' ')).toMatch(/Hızlı \(3 dakika\)/);
  });

  it('the first session after the tutorial is Quick (3 min) once, then the user preset again', () => {
    const t = migrateTraining({ ...defaultTraining(), nextPresetOnce: 'quick' });
    expect(t.nextPresetOnce).toBe('quick');
    expect(buildTodaySession(t, '2026-11-19', { hypertonic: false, strengthFalling: false }).durationPreset).toBe('quick');
    const after = applySessionResult(t, { date: '2026-11-19', feedback: 'ok' });
    expect(after.nextPresetOnce).toBeUndefined();
    expect(buildTodaySession(after, '2026-11-20', { hypertonic: false, strengthFalling: false }).durationPreset).toBe('standard');
  });

  it('the first-run gate lets the screening through before the tutorial', () => {
    expect(isAllowedDuringFirstRun('/tutorial', 'kegel')).toBe(true);
    expect(isAllowedDuringFirstRun('/tutorial', 'tutorial')).toBe(true);
    expect(isAllowedDuringFirstRun('/onboarding', 'kegel')).toBe(false);
  });

  it('tutorial screen: checkboxes have roles and ≥ 48 px; tutorialDone and the quick first session are set', () => {
    const src = fs.readFileSync(path.join(root, 'app', 'tutorial.tsx'), 'utf8');
    for (const m of src.matchAll(/<Pressable\b([\s\S]*?)(?<!=)>/g)) {
      expect(m[1]).toMatch(/accessibilityRole/);
      for (const n of m[1]!.matchAll(/minHeight: (\d+)/g)) expect(Number(n[1])).toBeGreaterThanOrEqual(48);
    }
    expect(src).toMatch(/tutorialDone: true/);
    expect(src).toMatch(/nextPresetOnce: 'quick'/);
  });
});
