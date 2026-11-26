import fs from 'fs';
import path from 'path';

import { isAllowedDuringFirstRun } from '@/features/app/gate';
import { applySessionResult, defaultTraining, migrateTraining } from '@/features/training/plan';
import { buildTodaySession } from '@/features/training/service';
import { TUTORIAL_ORDER } from '@/features/training/tutorial';
import tr from '@/i18n/tr.json';

const root = path.join(__dirname, '..');
type TutorialI18n = { tutorial: Record<string, unknown> & { mistakes: { title: string; cta: string; items: { title: string; text?: string }[] }; find: { warn: string }; technique: { body: string[]; warn: string }; trial: { title: string } } };
const T = (tr as unknown as TutorialI18n).tutorial;

describe('tutorial v2 (spec 12; slimmed down 2026-11-26)', () => {
  it('order: what, find, the animation, technique, one practice set, its check, mistakes (which finishes)', () => {
    expect(TUTORIAL_ORDER).toEqual(['what', 'find', 'anatomy', 'technique', 'trial', 'check', 'mistakes']);
    // gone: the separate position page, the checklist, the second practice set and the "Hazırsın" page
    for (const s of ['position', 'checklist', 'release', 'releaseCheck', 'ready', 'vibration']) expect(TUTORIAL_ORDER).not.toContain(s);
    for (const k of ['position', 'checklist', 'release', 'releaseCheck', 'releaseTips', 'ready']) expect(T[k]).toBeUndefined();
  });

  it('the technique page holds the starting position and the self-check in three short lines', () => {
    const body = T.technique.body.join(' ');
    expect(T.technique.body).toHaveLength(3);
    expect(body).toMatch(/Sırtüstü uzan, dizlerini bük/);
    expect(body).toMatch(/karın, kalça ve bacaklar gevşek/);
    expect(body).toMatch(/Nefesini tutma/);
    for (const line of T.technique.body) expect(line.split(/\s+/).length).toBeLessThanOrEqual(16);
    expect(T.trial.title).toBe('Deneme seti');
  });

  it('safety texts stay; common mistakes are titles only and the button says "Hazırım"', () => {
    expect(T.find.warn).toMatch(/İdrar yaparken egzersiz yapma/);
    expect(T.technique.warn).toMatch(/ağrı/);
    expect(T.mistakes.items.map((m) => m.title)).toEqual(['Nefesini tutma', 'Kalçanı sıkma', 'Ikınma', 'Fazla tekrar yapma']);
    expect(T.mistakes.items.every((m) => m.text === undefined)).toBe(true);
    expect(T.mistakes.cta).toBe('Hazırım');
    const src = fs.readFileSync(path.join(root, 'app', 'tutorial.tsx'), 'utf8');
    expect(src).toMatch(/label: replay \? tr\('tutorial\.close'\) : tr\('tutorial\.mistakes\.cta'\), onPress: finish/);
  });

  it('one session length: a stored one-off preset no longer changes the session (about 3 min at level 1)', () => {
    const t = migrateTraining({ ...defaultTraining(), nextPresetOnce: 'quick' });
    const a = buildTodaySession(t, '2026-11-19');
    expect(a.plannedSec).toBeLessThanOrEqual(190);
    const after = applySessionResult(t, { date: '2026-11-19', feedback: 'ok' });
    expect(after.nextPresetOnce).toBeUndefined();
    expect(buildTodaySession(after, '2026-11-20').blocks.map((b) => b.type)).toEqual(a.blocks.map((b) => b.type));
  });

  it('the first-run gate lets the screening through before the tutorial', () => {
    expect(isAllowedDuringFirstRun('/tutorial', 'kegel')).toBe(true);
    expect(isAllowedDuringFirstRun('/tutorial', 'tutorial')).toBe(true);
    expect(isAllowedDuringFirstRun('/onboarding', 'kegel')).toBe(false);
  });

  it('tutorial screen: pressables have roles and ≥ 48 px; tutorialDone is set; no duration preset', () => {
    const src = fs.readFileSync(path.join(root, 'app', 'tutorial.tsx'), 'utf8');
    for (const m of src.matchAll(/<Pressable\b([\s\S]*?)(?<!=)>/g)) {
      expect(m[1]).toMatch(/accessibilityRole/);
      for (const n of m[1]!.matchAll(/minHeight: (\d+)/g)) expect(Number(n[1])).toBeGreaterThanOrEqual(48);
    }
    expect(src).toMatch(/tutorialDone: true/);
    expect(src).not.toMatch(/nextPresetOnce/);
  });
});
