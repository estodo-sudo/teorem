import fs from 'fs';
import path from 'path';

import { planOdakNotifications, RISKY_LEAD_MIN, validPlan, type OdakNotifPlan } from '@/features/camps/odak/engine/notifications';
import { FREE_COACH_SCENARIOS, lessonIsFree, missionIsFree, scenarioIsFree } from '@/features/camps/odak/engine/premium';
import { sourceUsage } from '@/features/camps/odak/engine/sources';
import { ODAK_COACH, ODAK_MISSIONS, ODAK_SKILLS } from '@/features/camps/odak/content';
import { useOdakLockStore } from '@/features/camps/odak/privacy/lockStore';
import { useOdakStore } from '@/features/camps/odak/store';
import { hasAccess, defaultGateContext } from '@/features/purchases/gate';
import tr from '@/i18n/tr.json';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('@/features/camps/odak/privacy/device', () => {
  const { createMemoryVaultBackend, createVault } = jest.requireActual('@/features/camps/odak/privacy/vault');
  const mockVault = createVault(createMemoryVaultBackend(), { seal: async (t: string) => `s:${Buffer.from(t).toString('base64')}`, open: async (s: string) => Buffer.from(s.slice(2), 'base64').toString() });
  return { odakVault: () => mockVault, wipeOdakSecrets: async () => mockVault.clear() };
});

const root = path.join(__dirname, '..');
const CONTENT_DIR = path.join(root, 'src', 'content', 'camps', 'odak');
const contentFiles = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.tr.json'));
const content = Object.fromEntries(contentFiles.map((f) => [f, JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8')) as unknown]));
const sources = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, 'sources.json'), 'utf8')) as { id: string; url: string }[];
const strings = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);
const walk = (dir: string, ext: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name), ext) : e.name.endsWith(ext) ? [path.join(dir, e.name)] : []));

// Wednesday 2026-11-18 10:00; programme started 2026-11-10.
const now = new Date(2026, 10, 18, 10, 0);
const plan: OdakNotifPlan = { ranges: [{ from: '23:00', to: '01:00' }], programStart: new Date(2026, 10, 10, 9).toISOString(), lastCheckinAt: null };

describe('neutral notifications (spec 5.14)', () => {
  it('15 minutes before each risky range, an evening check-in and a Sunday summary', () => {
    const p = planOdakNotifications({ now, enabled: true, plan, horizonDays: 7 });
    const risky = p.filter((n) => n.kind === 'risky');
    expect(risky).toHaveLength(7);
    expect(risky[0]!.fireAt).toEqual(new Date(2026, 10, 18, 23 - 1, 60 - RISKY_LEAD_MIN));
    expect(p.filter((n) => n.kind === 'checkin')).toHaveLength(7);
    expect(p.filter((n) => n.kind === 'weekly').map((n) => n.fireAt.getDay())).toEqual([0]);
    for (const n of p) expect(n.fireAt.getTime()).toBeGreaterThan(now.getTime());
    expect(p.length).toBeLessThanOrEqual(20);
  });
  it('skips today’s check-in once done; consolidation asks every 2nd day; off means nothing', () => {
    const done = planOdakNotifications({ now, enabled: true, plan: { ...plan, lastCheckinAt: new Date(2026, 10, 18, 8).toISOString() } });
    expect(done.filter((n) => n.kind === 'checkin' && n.fireAt.getDate() === 18)).toHaveLength(0);
    const late = planOdakNotifications({ now, enabled: true, plan: { ...plan, programStart: new Date(2026, 9, 1, 9).toISOString() }, horizonDays: 6 });
    expect(late.filter((n) => n.kind === 'checkin').length).toBe(3);
    expect(planOdakNotifications({ now, enabled: false, plan })).toEqual([]);
    expect(planOdakNotifications({ now, enabled: true, plan: null })).toEqual([]);
    expect(validPlan({ ranges: [], programStart: 'x' })).toBe(false);
  });
  it('texts never name the topic, and the plan holds only times (kept outside the vault)', async () => {
    const notif = (tr as unknown as { odak: { notif: Record<string, string> } }).odak.notif;
    for (const s of Object.values(notif)) expect(s).not.toMatch(/porno|mastürbasyon|cinsel|dürtü|kayma/i);
    await useOdakStore.getState().wipe();
    await useOdakStore.getState().enrol({ profile: { reasons: [], riskyHours: [{ from: '23:00', to: '01:00' }], createdAt: now.toISOString() } as never, goal: { porn: 'quit', mast: 'none', startedAt: now.toISOString() }, plans: [], screenings: [] });
    const stored = useOdakLockStore.getState().notifPlan!;
    expect(stored).toEqual({ ranges: [{ from: '23:00', to: '01:00' }], programStart: now.toISOString(), lastCheckinAt: null });
    expect(Object.keys(stored).sort()).toEqual(['lastCheckinAt', 'programStart', 'ranges']);
    await useOdakStore.getState().wipe();
    expect(useOdakLockStore.getState().notifPlan).toBeNull();
  });
});

describe('free vs premium (spec 8)', () => {
  it('the camp needs the subscription for premium parts; dev bypass and entitlement open them', () => {
    expect(hasAccess('odak', defaultGateContext({ devBypass: false, mode: 'freemium' }))).toBe(false);
    expect(hasAccess('odak', defaultGateContext({ devBypass: false, entitled: true }))).toBe(true);
  });
  it('the first phase’s missions and lessons and three coach topics are free', () => {
    expect(ODAK_MISSIONS.filter(missionIsFree).map((m) => m.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(ODAK_SKILLS.filter(lessonIsFree).map((l) => l.id)).toEqual(expect.arrayContaining(['values', 'cycle', 'monitoring']));
    expect(ODAK_SKILLS.filter((l) => !lessonIsFree(l)).length).toBeGreaterThanOrEqual(13);
    for (const id of FREE_COACH_SCENARIOS) expect(ODAK_COACH.scenarios.some((s) => s.id === id)).toBe(true);
    expect(scenarioIsFree('urge') && scenarioIsFree('expert') && !scenarioIsFree('partner')).toBe(true);
  });
  it('always-free screens carry no gate: SOS flow, slip, relapse, check-in, diary, support lines, library', () => {
    for (const f of ['slip.tsx', 'relapse.tsx', 'checkin.tsx', 'diary.tsx', 'log-urge.tsx', 'log-behavior.tsx', 'library.tsx', 'onboarding.tsx', 'privacy.tsx']) {
      expect([f, fs.readFileSync(path.join(root, 'app', 'odak', f), 'utf8').match(/\buseAccess\b|\bOdakLock\b|PremiumLock|openGated/)]).toEqual([f, null]);
    }
  });
});

describe('automatic content checks (spec 7.4)', () => {
  const BANNED = [
    /günah/i,
    /\bharam\b/i,
    /kirli/i,
    /iğrenç/i,
    /sapık/i,
    /zayıf irade/i,
    /başarısız/i,
    /pes ettin/i,
    /sıfırdan başla/i,
    /temiz gün/i,
    /gerçek erkek/i,
    /testosteron/i,
    /süper güç/i,
    /enerji patlaması/i,
    /semen/i,
    /reboot/i,
    /iktidarsız/i,
    /bağımlısın/i,
  ];
  const EXPLICIT = [/sikiş/i, /seks videosu/i, /çıplak/i, /erotik/i, /orgazm/i, /\bpenis/i, /vajina/i, /\bmeme\b/i];
  it('every content file: no banned or explicit wording, no success percentages', () => {
    expect(contentFiles.length).toBeGreaterThanOrEqual(20);
    for (const [f, json] of Object.entries(content)) {
      for (const s of strings(json)) {
        for (const b of [...BANNED, ...EXPLICIT]) expect([f, s, b.test(s)]).toEqual([f, s, false]);
        expect([f, s, /%\s?\d|\d\s?%/.test(s)]).toEqual([f, s, false]);
        if (/mastürbasyon/i.test(s) && /zarar/i.test(s) && !s.trim().endsWith('?')) expect(s).toMatch(/zararlı kabul edilmez|zararlı değil/);
      }
    }
  });
  it('every content block with text is unreviewed, evidence-tagged and cites known sources', () => {
    const ids = new Set(sources.map((s) => s.id));
    for (const [f, json] of Object.entries(content)) {
      const j = json as { reviewed?: boolean; evidenceLevel?: string; sourceIds?: string[] };
      if (j.sourceIds === undefined) continue; // label-only files (stats, badges, summary, method)
      expect([f, j.reviewed]).toEqual([f, false]);
      expect(['guideline', 'rct', 'review', 'expert']).toContain(j.evidenceLevel);
      for (const id of j.sourceIds) expect([f, id, ids.has(id)]).toEqual([f, id, true]);
    }
    const usage = sourceUsage(Object.values(content));
    expect(Object.keys(usage).every((id) => ids.has(id))).toBe(true);
  });
  it('the review checklist, language guide and scales document exist', () => {
    for (const f of ['CONTENT_REVIEW_ODAK.md', 'ODAK_DIL_REHBERI.md', 'SCALES.md']) expect(fs.existsSync(path.join(root, 'docs', f))).toBe(true);
    const review = fs.readFileSync(path.join(root, 'docs', 'CONTENT_REVIEW_ODAK.md'), 'utf8');
    expect(review).toMatch(/Ad Soyad/);
    expect(review).toMatch(/182/);
  });
});

describe('offline and accessibility (spec O12)', () => {
  const code = [
    ...walk(path.join(root, 'app', 'odak'), '.tsx'),
    ...walk(path.join(root, 'src', 'features', 'camps', 'odak'), '.ts'),
    ...walk(path.join(root, 'src', 'features', 'camps', 'odak'), '.tsx'),
    path.join(root, 'modules', 'odak-usage', 'index.ts'),
  ];
  it('no network calls anywhere in the camp (works in airplane mode)', () => {
    for (const f of code) {
      const src = fs.readFileSync(f, 'utf8');
      expect([path.basename(f), /\bfetch\(|XMLHttpRequest|axios|WebSocket|EventSource/.test(src)]).toEqual([path.basename(f), false]);
    }
  });
  it('every button in the camp screens has a role and a touch target of at least 48', () => {
    let checked = 0;
    for (const f of walk(path.join(root, 'app', 'odak'), '.tsx')) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/<Pressable\b([\s\S]*?)(?<!=)>/g)) {
        const tag = m[1]!;
        checked += 1;
        if (!tag.includes('importantForAccessibility="no"')) expect([path.basename(f), tag.includes('accessibilityRole')]).toEqual([path.basename(f), true]);
        for (const n of tag.matchAll(/(?:minHeight|height|width): (\d+)/g)) expect([path.basename(f), Number(n[1])]).toEqual([path.basename(f), Math.max(48, Number(n[1]))]);
      }
    }
    expect(checked).toBeGreaterThan(5);
  });
  it('the urge-surf animation respects reduced motion', () => {
    expect(fs.readFileSync(path.join(root, 'src', 'features', 'camps', 'core', 'sosTools.tsx'), 'utf8')).toMatch(/useReducedMotion/);
  });
});
