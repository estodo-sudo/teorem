import fs from 'fs';
import path from 'path';

import libraryJson from '@/content/camps/odak/library.tr.json';
import rebuildJson from '@/content/camps/odak/rebuild.tr.json';
import sourcesJson from '@/content/camps/odak/sources.json';
import { connectionDone, connectionTask, defaultRebuild, rangeKey, toggleActivity, weekKeyOf } from '@/features/camps/odak/engine/rebuild';
import { useOdakStore } from '@/features/camps/odak/store';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('@/features/camps/odak/privacy/device', () => {
  const { createMemoryVaultBackend, createVault } = jest.requireActual('@/features/camps/odak/privacy/vault');
  const mockVault = createVault(createMemoryVaultBackend(), { seal: async (t: string) => `s:${Buffer.from(t).toString('base64')}`, open: async (s: string) => Buffer.from(s.slice(2), 'base64').toString() });
  return { odakVault: () => mockVault, wipeOdakSecrets: async () => mockVault.clear() };
});

const strings = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);
const BANNED = [
  /günah/i,
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

describe('"Bilim Ne Diyor?" library (spec 5.9)', () => {
  const stories = libraryJson.stories;
  it('has at least 14 stories covering the spec topics', () => {
    expect(stories.length).toBeGreaterThanOrEqual(14);
    const ids = stories.map((s) => s.id);
    for (const id of ['csbd', 'mast-facts', 'nofap-claims', 'erection', 'moral', 'urges-pass', 'slips-normal', 'when-expert', 'mood-link', 'partner', 'families', 'sleep-control', 'filters', 'values-faith']) expect(ids).toContain(id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of stories) expect(s.slides.length).toBeGreaterThanOrEqual(3);
  });
  it('is sourced only from allowed sources, unreviewed and evidence-tagged', () => {
    const src = new Map(sourcesJson.map((s) => [s.id, s]));
    for (const s of stories) {
      expect(s.reviewed).toBe(false);
      expect(['guideline', 'rct', 'review', 'expert']).toContain(s.evidenceLevel);
      expect(s.sourceIds.length).toBeGreaterThan(0);
      for (const id of s.sourceIds) {
        const ref = src.get(id);
        expect(ref).toBeDefined();
        expect(ref!.url).not.toMatch(/nofap|youtube|reddit|blogspot|medium\.com|wordpress/i);
      }
    }
  });
  it('corrects myths without the banned claim wordings; masturbation never harmful', () => {
    for (const s of [...strings(libraryJson), ...strings(rebuildJson)]) {
      for (const b of BANNED) expect(s).not.toMatch(b);
      expect(s).not.toMatch(/%\s?\d|\d\s?%/);
      if (/mastürbasyon/i.test(s) && /zarar/i.test(s)) expect(s).toMatch(/zararlı kabul edilmez|zararlı değil/);
    }
    const mast = stories.find((s) => s.id === 'mast-facts')!;
    expect(JSON.stringify(mast)).toMatch(/tıbben zararlı kabul edilmez/);
    expect(JSON.stringify(stories.find((s) => s.id === 'when-expert'))).toMatch(/112/);
  });
  it('is always free: no paywall or gating in the library screens', () => {
    for (const f of ['library.tsx', path.join('library', '[storyId].tsx')]) {
      const src = fs.readFileSync(path.join(__dirname, '..', 'app', 'odak', f), 'utf8');
      expect(src).not.toMatch(/useAccess|PremiumLock|openGated|paywall/);
    }
  });
});

describe('Yeniden İnşa (spec 5.8)', () => {
  it('keeps at most two alternatives per risky range', () => {
    const k = rangeKey({ from: '23:00', to: '01:00' });
    let m = toggleActivity({}, k, 'walk');
    m = toggleActivity(m, k, 'book');
    m = toggleActivity(m, k, 'call');
    expect(m[k]).toEqual(['book', 'call']);
    expect(toggleActivity(m, k, 'book')[k]).toEqual(['call']);
  });
  it('gives one connection task a week and remembers the week', () => {
    const tasks = rebuildJson.connection.tasks;
    const mon = new Date(2026, 10, 16, 9);
    const sun = new Date(2026, 10, 22, 21);
    const nextMon = new Date(2026, 10, 23, 9);
    expect(connectionTask(tasks, mon)).toBe(connectionTask(tasks, sun));
    expect(connectionTask(tasks, nextMon)).not.toBe(connectionTask(tasks, mon));
    const s = { ...defaultRebuild(), connectionWeeks: [weekKeyOf(mon)] };
    expect(connectionDone(s, sun)).toBe(true);
    expect(connectionDone(s, nextMon)).toBe(false);
  });
  it('links to the app’s own Kegel, breathing, body-scan and fitness tools; sleep tips are general info', () => {
    const routes = rebuildJson.bridge.items.map((i) => i.route);
    expect(routes).toEqual(expect.arrayContaining(['/', '/mind/breathing', '/mind/body-scan']));
    for (const r of routes) expect(fs.existsSync(path.join(__dirname, '..', 'app', r === '/' ? '(tabs)/index.tsx' : `${r.slice(1)}.tsx`))).toBe(true);
    expect(rebuildJson.sleep.note).toMatch(/tıbbi tedavi değildir/);
    expect(rebuildJson.planner.options.length).toBeGreaterThanOrEqual(6);
  });
  it('keeps the plan, sleep list and connection weeks in the vault, and library reads once', async () => {
    await useOdakStore.getState().wipe();
    await useOdakStore.getState().saveRebuild({ activities: { '23:00-01:00': ['walk'] }, sleep: ['same-time'], connectionWeeks: ['2026-11-16'] });
    await useOdakStore.getState().markRead('csbd');
    await useOdakStore.getState().markRead('csbd');
    useOdakStore.setState({ rebuild: defaultRebuild(), libraryRead: [], ready: false });
    await useOdakStore.getState().hydrate();
    expect(useOdakStore.getState().rebuild).toEqual({ activities: { '23:00-01:00': ['walk'] }, sleep: ['same-time'], connectionWeeks: ['2026-11-16'] });
    expect(useOdakStore.getState().libraryRead.map((r) => r.id)).toEqual(['csbd']);
  });
});

describe('store selectors', () => {
  it('no Odak screen derives a new array inside a store selector (that re-renders forever)', () => {
    const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.tsx') ? [path.join(dir, e.name)] : []));
    for (const f of [...walk(path.join(__dirname, '..', 'app', 'odak')), ...walk(path.join(__dirname, '..', 'src', 'features', 'camps'))]) {
      expect(fs.readFileSync(f, 'utf8')).not.toMatch(/Store\(\(\w+\) => \w+\.\w+\.(map|filter|slice)\(/);
    }
  });
});
