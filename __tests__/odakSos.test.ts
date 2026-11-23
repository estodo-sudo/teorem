import fs from 'fs';
import path from 'path';

import sosJson from '@/content/camps/odak/sos.tr.json';
import sourcesJson from '@/content/camps/odak/sources.json';
import { ODAK_SOS as SOS } from '@/features/camps/odak/content';
import { buildUrge, dayyCount, managedCount, nextTool, noDayy, SOS_TOOLS, toolEffectiveness } from '@/features/camps/odak/engine/sos';
import { useOdakStore } from '@/features/camps/odak/store';
import type { UrgeEvent } from '@/features/camps/odak/types';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('@/features/camps/odak/privacy/device', () => {
  const { createMemoryVaultBackend, createVault } = jest.requireActual('@/features/camps/odak/privacy/vault');
  const mockVault = createVault(createMemoryVaultBackend(), { seal: async (t: string) => `s:${Buffer.from(t).toString('base64')}`, open: async (s: string) => Buffer.from(s.slice(2), 'base64').toString() });
  return { odakVault: () => mockVault, wipeOdakSecrets: async () => mockVault.clear() };
});

const t0 = new Date('2026-11-18T22:00:00Z');
const urge = (outcome: UrgeEvent['outcome'], toolsUsed: UrgeEvent['toolsUsed']): UrgeEvent => buildUrge({ startedAt: t0, endedAt: new Date(t0.getTime() + 300_000), intensityBefore: 8, intensityAfter: 3, dayy: noDayy(), toolsUsed, outcome });

describe('SOS logic', () => {
  it('builds an urge moment', () => {
    const u = buildUrge({ startedAt: t0, endedAt: new Date(t0.getTime() + 95_400), intensityBefore: 12, intensityAfter: null, dayy: { ...noDayy(), lonely: true }, toolsUsed: ['surf', 'surf', 'breath'], outcome: 'managed' });
    expect(u).toMatchObject({ at: t0.toISOString(), intensityBefore: 10, toolsUsed: ['surf', 'breath'], durationSec: 95, outcome: 'managed' });
    expect(u.intensityAfter).toBeUndefined();
    expect(dayyCount(u.dayy)).toBe(1);
  });
  it('counts managed moments; a slip never lowers the count', () => {
    const list = [urge('managed', ['surf']), urge('still_hard', ['breath']), urge('managed', ['move'])];
    expect(managedCount(list)).toBe(2);
    expect(managedCount([...list, urge('slipped', [])])).toBe(2);
  });
  it('suggests a tool not tried yet when it is still hard', () => {
    expect(SOS_TOOLS).toEqual(['actions', 'puzzle']);
    expect(nextTool([])).toBe('actions');
    expect(nextTool(['relocate', 'actions'])).toBe('puzzle');
    expect(nextTool([...SOS_TOOLS])).toBe('actions');
  });
  it('ranks tools by how often they were part of a managed moment; removed tools count as "other"', () => {
    const r = toolEffectiveness([urge('managed', ['surf', 'actions']), urge('slipped', ['actions']), urge('managed', ['breath'])]);
    expect(r.map((x) => [x.tool, x.used, x.managed])).toEqual([
      ['other', 2, 2],
      ['actions', 2, 1],
    ]);
  });
  it('keeps a skipped intensity as 0 (left out of averages)', () => {
    const u = buildUrge({ startedAt: new Date(), endedAt: new Date(), intensityBefore: 0, dayy: noDayy(), toolsUsed: [], outcome: 'managed' });
    expect(u.intensityBefore).toBe(0);
  });
});

describe('SOS data (encrypted store)', () => {
  it('keeps urges and the future-self letter across a reload', async () => {
    await useOdakStore.getState().wipe();
    await useOdakStore.getState().logUrge(urge('managed', ['surf']));
    await useOdakStore.getState().saveLetter('Sevgili ben, bu da geçecek.');
    useOdakStore.setState({ urges: [], letter: null, ready: false });
    await useOdakStore.getState().hydrate();
    const s = useOdakStore.getState();
    expect(s.urges).toHaveLength(1);
    expect(s.letter?.text).toBe('Sevgili ben, bu da geçecek.');
  });
});

describe('SOS content (spec 5.2)', () => {
  const root = path.join(__dirname, '..');
  it('has the DAYY check, a 60-second move-first step, every tool and the three endings', () => {
    expect(SOS.check.items.map((i) => i.letter).join('')).toBe('DAYY');
    expect(SOS.check.items.map((i) => i.id)).toEqual(['tired', 'hungry', 'lonely', 'loaded']);
    expect(SOS.relocate.seconds).toBe(60);
    expect(SOS.move.seconds).toBe(120);
    for (const id of SOS_TOOLS) expect(SOS.tools.items.some((x) => x.id === id)).toBe(true);
    expect('surf' in SOS).toBe(false);
    expect(SOS.tools.items.some((x) => x.id === 'surf')).toBe(false);
    expect([SOS.end.managed, SOS.end.hard, SOS.end.slipped]).toEqual(['Geçti', 'Hâlâ zor', 'Kaydım']);
    expect(SOS.end.count).toContain('{n}');
    expect(SOS.emergency).toMatch(/112/);
  });
  it('is sourced, unreviewed and free of banned or alarming words; the supporter message is neutral', () => {
    expect(sosJson.reviewed).toBe(false);
    const ids = new Set(sourcesJson.map((s) => s.id));
    for (const id of sosJson.sourceIds) expect(ids.has(id)).toBe(true);
    const text = JSON.stringify(sosJson);
    for (const b of [/başarısız/i, /sıfırdan başla/i, /temiz gün/i, /kirli/i, /günah/i, /zayıf irade/i, /%\s?\d/]) expect(text).not.toMatch(b);
    expect(SOS.supporter.message).not.toMatch(/porno|mastürbasyon|cinsel|dürtü/i);
  });
  it('opens in ≤2 taps (panel button / neutral shortcut) and is never behind the paywall', () => {
    const panel = fs.readFileSync(path.join(root, 'app', 'odak', 'index.tsx'), 'utf8');
    expect(panel).toContain("router.push('/odak/sos')");
    const shortcut = fs.readFileSync(path.join(root, 'src', 'features', 'camps', 'smoking', 'shortcut.ts'), 'utf8');
    expect(shortcut).toContain("href: '/odak/sos'");
    const sos = fs.readFileSync(path.join(root, 'app', 'odak', 'sos.tsx'), 'utf8');
    // Every SOS step and tool is free (the premium future-self letter was removed, 2026-11-23).
    expect(sos.replace(/^import .*$/gm, '')).not.toMatch(/useAccess|PremiumLock|OdakLock|openGated|paywall/);
  });
});
