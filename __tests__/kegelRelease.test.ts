import fs from 'fs';
import path from 'path';

import { computeStreak } from '@/features/gamification/streak';
import { defaultTraining } from '@/features/training/plan';
import { dailyCheck, protectedDays } from '@/features/training/returns';
import tr from '@/i18n/tr.json';
import type { TrainingState } from '@/types';

const root = path.join(__dirname, '..');
const walk = (dir: string, ext: string): string[] =>
  fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name), ext) : e.name.endsWith(ext) ? [path.join(dir, e.name)] : [])) : [];
const base = (patch: Partial<TrainingState> = {}): TrainingState => ({ ...defaultTraining(), level: 8, freezeMonth: '2026-11', ...patch });

describe('streak freeze, vacation and the return after a break (spec 6.6)', () => {
  it('1–2 missed days use freezes: the streak stays, no level change', () => {
    const t = dailyCheck(base({ freezeTokens: 2 }), '2026-11-19', ['2026-11-15', '2026-11-16', '2026-11-17']);
    expect(t).toMatchObject({ level: 8, freezeTokens: 1, frozenDays: ['2026-11-18'], returnNotice: { kind: 'frozen', days: 1 } });
    expect(computeStreak(['2026-11-15', '2026-11-16', '2026-11-17'], '2026-11-19', protectedDays(t)).current).toBe(3);
    expect(computeStreak(['2026-11-15', '2026-11-16', '2026-11-17'], '2026-11-19').current).toBe(0);
  });

  it('runs once a day; refills 2 freezes in a new month', () => {
    const t = base({ freezeTokens: 0, freezeMonth: '2026-10', lastReturnCheck: '2026-11-19' });
    expect(dailyCheck(t, '2026-11-19', [])).toBe(t);
    expect(dailyCheck({ ...t, lastReturnCheck: '2026-11-18' }, '2026-11-19', ['2026-11-18'])).toMatchObject({ freezeTokens: 2, freezeMonth: '2026-11' });
  });

  it('3–6 days without freezes → level −1 "softer"; 7+ → level −2 (one session length, no preset)', () => {
    const gentle = dailyCheck(base({ freezeTokens: 0 }), '2026-11-19', ['2026-11-14']);
    expect(gentle).toMatchObject({ level: 7, returnNotice: { kind: 'gentle', days: 4 } });
    const rewarm = dailyCheck(base({ freezeTokens: 1 }), '2026-11-19', ['2026-11-05']);
    expect(rewarm).toMatchObject({ level: 6, returnNotice: { kind: 'rewarm' } });
    expect(rewarm.nextPresetOnce).toBeUndefined();
  });

  it('vacation days never count: the streak is kept and nothing is lowered', () => {
    const t = base({ freezeTokens: 0, vacation: { from: '2026-11-10', to: '2026-11-18' } });
    const after = dailyCheck(t, '2026-11-19', ['2026-11-09']);
    expect(after.level).toBe(8);
    expect(after.returnNotice).toBeUndefined();
    expect(computeStreak(['2026-11-08', '2026-11-09'], '2026-11-19', protectedDays(t)).current).toBe(2);
  });

  it('texts for every return message exist and stay kind', () => {
    const r = (tr as unknown as { kegel: { return: Record<string, string> } }).kegel.return;
    for (const k of ['frozen_one', 'gentle_other', 'rewarm_other']) expect(r[k]).toBeTruthy();
    expect(r.gentle_other).toMatch(/yumuşak başlıyoruz/);
  });
});

describe('reminders v2 (spec 13)', () => {
  it('notification actions: start (2 min), snooze 15 min, skip today — no micro set (2026-11-25); neutral texts', () => {
    const src = fs.readFileSync(path.join(root, 'src', 'features', 'reminders', 'scheduler.ts'), 'utf8');
    for (const id of ['ACTION_START', 'ACTION_SNOOZE_15', 'ACTION_SKIP_TODAY']) expect(src).toMatch(new RegExp(`identifier: ${id}`));
    expect(src).not.toMatch(/ACTION_MICRO|sessionId: 'micro'/);
    expect(src).toMatch(/sessionId: 'quick'/);
    const a = (tr as unknown as { reminders: { actions: Record<string, string>; discreet: Record<string, string> } }).reminders;
    expect(a.actions).toMatchObject({ start: 'Başla (2 dk)', snooze15: '15 dk ertele', skipToday: 'Bugün atla' });
    expect(a.actions.micro).toBeUndefined();
    for (const s of Object.values(a.discreet)) expect(s).not.toMatch(/kegel|pelvik|cinsel|sertleş|boşalma|idrar/i);
  });
});

describe('release checks (spec 17)', () => {
  const kegelCode = [
    ...walk(path.join(root, 'src', 'features', 'training'), '.ts'),
    ...walk(path.join(root, 'src', 'features', 'training'), '.tsx'),
    ...walk(path.join(root, 'app', 'kegel'), '.tsx'),
    ...walk(path.join(root, 'app', 'workout'), '.tsx'),
    path.join(root, 'app', 'tutorial.tsx'),
    path.join(root, 'app', 'strength-test.tsx'),
    path.join(root, 'modules', 'kegel-haptics', 'index.ts'),
  ];

  it('no network calls in the Kegel code (works in airplane mode)', () => {
    for (const f of kegelCode) expect([path.basename(f), /\bfetch\(|XMLHttpRequest|axios|WebSocket|EventSource/.test(fs.readFileSync(f, 'utf8'))]).toEqual([path.basename(f), false]);
  });

  it('every pressable in the Kegel screens has a role and a ≥ 48 px target', () => {
    let checked = 0;
    for (const f of kegelCode.filter((x) => x.endsWith('.tsx'))) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/<(?:Scale)?Pressable\b([\s\S]*?)(?<!=)>/g)) {
        checked += 1;
        expect([path.basename(f), m[1]!.includes('accessibilityRole')]).toEqual([path.basename(f), true]);
        for (const n of m[1]!.matchAll(/(?:minHeight|height|width): (\d+)/g)) expect([path.basename(f), Number(n[1])]).toEqual([path.basename(f), Math.max(48, Number(n[1]))]);
      }
    }
    expect(checked).toBeGreaterThanOrEqual(8);
  });

  it('no success percentages or certain medical promises anywhere in the Kegel content and texts', () => {
    const files = walk(path.join(root, 'src', 'content', 'kegel'), '.json');
    const strings = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);
    const texts = [
      ...files.flatMap((f) => strings(JSON.parse(fs.readFileSync(f, 'utf8')))),
      ...strings((tr as unknown as Record<string, unknown>).kegel),
      ...strings((tr as unknown as Record<string, unknown>).feedback),
      ...strings((tr as unknown as Record<string, unknown>).tutorial),
    ];
    expect(texts.length).toBeGreaterThan(100);
    for (const s of texts) {
      expect([s, /%\s?\d|\d\s?%/.test(s)]).toEqual([s, false]);
      expect([s, /garanti|kesin sonuç|mucize|tedavi eder|iyileştirir/i.test(s)]).toEqual([s, false]);
    }
  });

  it('every Kegel content file is unreviewed and cites known sources', () => {
    const sources = new Set((JSON.parse(fs.readFileSync(path.join(root, 'src', 'content', 'kegel', 'sources.json'), 'utf8')) as { id: string }[]).map((s) => s.id));
    for (const f of walk(path.join(root, 'src', 'content', 'kegel'), '.tr.json')) {
      const j = JSON.parse(fs.readFileSync(f, 'utf8')) as { reviewed: boolean; sourceIds: string[] };
      expect([path.basename(f), j.reviewed]).toEqual([path.basename(f), false]);
      for (const id of j.sourceIds) expect([path.basename(f), id, sources.has(id)]).toEqual([path.basename(f), id, true]);
    }
  });

  it('reduced motion is honoured by the sphere and the player announces phases to screen readers', () => {
    expect(fs.readFileSync(path.join(root, 'src', 'features', 'training', 'player', 'MuscleSphere.tsx'), 'utf8')).toMatch(/useReducedMotion/);
    expect(fs.readFileSync(path.join(root, 'src', 'features', 'training', 'player', 'WorkoutPlayer.tsx'), 'utf8')).toMatch(/announceForAccessibility/);
  });
});
