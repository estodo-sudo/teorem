import fs from 'fs';
import path from 'path';

import { lockoutMs, waitLeft } from '@/features/camps/odak/privacy/lock';
import { buildExport, parseImport, serializeExport } from '@/features/data/exportImport';
import { MAX_IMPORT_BYTES, sanitizeHistory, sanitizeProfile, sanitizeSettings } from '@/features/data/sanitize';
import { needsRouteCheck, premiumRuleFor } from '@/features/purchases/routeGate';
import { snapshotApp } from '@/features/data/appData';

/** Security / App Review round (2026-11-23). */
const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

describe('premium screens cannot be opened by a direct link', () => {
  it('maps every premium area to its feature', () => {
    expect(premiumRuleFor(['workout', '[sessionId]'])).toBe('workout');
    expect(premiumRuleFor(['fitness', '[routineId]'])).toBe('fitness');
    expect(premiumRuleFor(['story', '[storyId]'])).toBe('stories');
    expect(premiumRuleFor(['strength-test'])).toBe('strengthTest');
    expect(premiumRuleFor(['campus', 'alcohol'])).toBe('courses');
    expect(premiumRuleFor(['bodyweight'])).toBe('soon');
    // Free areas and the steps after an allowed session.
    for (const s of [['(tabs)'], ['legal', 'terms'], ['paywall'], ['workout', 'feedback'], ['workout', 'next'], ['glossary', '[termId]']]) expect(premiumRuleFor(s)).toBeNull();
  });

  it('checks on entering an area, not while moving inside it', () => {
    expect(needsRouteCheck(undefined, 'fitness')).toBe(true); // cold-start link
    expect(needsRouteCheck('(tabs)', 'workout')).toBe(true);
    expect(needsRouteCheck('workout', 'workout')).toBe(false); // round 2, release
  });

  it('the root layout sends a locked area to the paywall', () => {
    const layout = read('app/_layout.tsx');
    expect(layout).toMatch(/premiumRuleFor\(segments\)/);
    expect(layout).toMatch(/!canAccess\(rule\)\) router\.replace\(\{ pathname: '\/paywall'/);
  });
});

describe('a crafted backup file cannot break the app', () => {
  const good = () => JSON.parse(serializeExport(buildExport(snapshotApp()))) as Record<string, unknown>;

  it('wrong types fall back to defaults instead of reaching the screens', () => {
    const b = good();
    b.profile = { goals: ['bladder', { x: 1 }, 'hack'], ageRange: { evil: true }, onboardingDone: 'yes', disclaimerAcceptedAt: 12, createdAt: [] };
    b.settings = { hapticStrength: 999, theme: '<script>', language: 'xx', reminderTimes: ['25:99', '07:30', 5], sessionsPerDay: 9, soundCues: 'true' };
    const r = parseImport(JSON.stringify(b));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.profile.goals).toEqual(['bladder']);
    expect(r.data.profile.ageRange).toBeNull();
    expect(r.data.profile.onboardingDone).toBe(false);
    expect(r.data.profile.disclaimerAcceptedAt).toBeNull();
    expect(typeof r.data.profile.createdAt).toBe('string');
    expect(r.data.settings.hapticStrength).toBe(2);
    expect(r.data.settings.theme).toBe('system');
    expect(['tr', 'en']).toContain(r.data.settings.language);
    expect(r.data.settings.reminderTimes).toEqual(['07:30']);
    expect(r.data.settings.sessionsPerDay).toBe(1);
    expect(r.data.settings.soundCues).toBe(false);
  });

  it('bad history rows are dropped, good ones kept', () => {
    const ok = { id: 'w1', date: '2026-11-20', finishedAt: '2026-11-20T10:00:00Z', level: 1, plannedSec: 300, actualSec: 280, exercises: [], completed: true };
    const h = sanitizeHistory({
      workouts: [ok, { ...ok, id: 'w2', actualSec: 'NaN' }, { ...ok, id: { a: 1 } }, null, 'x'],
      strengthTests: [{ id: 's', date: '2026-11-20', holdBestMs: 1000, holdAttemptsMs: [1000, 'x'], quickCount: 3 }],
      fitnessLogs: [{ id: 'f', date: 'yesterday', routineId: 'r', durationSec: 10 }],
      notes: [{ id: 'n', date: '2026-11-20', createdAt: 'x', text: 'a'.repeat(10_000), kind: 'progress' }],
    });
    expect(h.workouts.map((w) => w.id)).toEqual(['w1']);
    expect([h.strengthTests.length, h.fitnessLogs.length, h.notes.length]).toEqual([0, 0, 0]);
    expect(sanitizeHistory('nope')).toEqual({ workouts: [], strengthTests: [], fitnessLogs: [], notes: [] });
  });

  it('huge files and non-objects are refused; the purchase cache is never imported', () => {
    expect(parseImport(' '.repeat(MAX_IMPORT_BYTES + 1))).toEqual({ ok: false, error: 'corrupt' });
    expect(sanitizeProfile(null).onboardingDone).toBe(false);
    expect(sanitizeSettings([]).hapticStrength).toBe(2);
    const b = good();
    b.entitlement = { active: true, productId: 'premium_lifetime' };
    const r = parseImport(JSON.stringify(b));
    expect(r.ok && 'entitlement' in r.data).toBe(false);
  });
});

describe('camp PIN wait', () => {
  it('a clock set back gives the normal wait, not a lock-out for years', () => {
    const at = Date.parse('2026-11-23T10:00:00Z');
    expect(waitLeft(6, at, at - 365 * 86_400_000)).toBe(lockoutMs(6));
    expect(waitLeft(6, at, at + 10_000)).toBe(lockoutMs(6) - 10_000);
  });
});

describe('App Store build settings', () => {
  const cfg = read('app.config.ts');
  it('no unused iOS background modes, no microphone, readable permission texts', () => {
    expect(cfg).toMatch(/withoutUnusedIosBackgroundMode/);
    expect(cfg).toMatch(/microphonePermission: false, recordAudioAndroid: false, enableBackgroundPlayback: false/);
    expect(cfg).toMatch(/locales: \{ tr: '.\/locales\/tr.json', en: '.\/locales\/en.json' \}/);
    const tr = JSON.parse(read('locales/tr.json')) as Record<string, string>;
    const en = JSON.parse(read('locales/en.json')) as Record<string, string>;
    expect(Object.keys(en).sort()).toEqual(Object.keys(tr).sort());
  });

  it('the paywall promises only what exists (no "Antrenmanlar" while they are "Yakında")', () => {
    const tr = JSON.parse(read('src/i18n/tr.json')) as { paywall: { benefits: Record<string, string> } };
    expect(tr.paywall.benefits.courses).not.toMatch(/Antrenmanlar/);
  });
});

describe('store build content (owner decision 2026-11-23)', () => {
  it('"Yakında" programmes and locked exercises are hidden; the support e-mail is real', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LEGAL_ENTITY, SHOW_COMING_SOON } = require('@/config/app') as typeof import('@/config/app');
    expect(SHOW_COMING_SOON).toBe(false);
    expect(LEGAL_ENTITY.email).toBe('teoremcontact@gmail.com');
    expect(read('app/(tabs)/discover.tsx')).toMatch(/items=\{VISIBLE_PROGRAMS\}/);
    expect(read('src/features/training/ProfileTraining.tsx')).toMatch(/\(SHOW_COMING_SOON \? LOCKED_EXERCISES : \[\]\)/);
  });
});
