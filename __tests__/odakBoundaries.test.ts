import fs from 'fs';
import path from 'path';

import boundariesJson from '@/content/camps/odak/boundaries.tr.json';
import sourcesJson from '@/content/camps/odak/sources.json';
import { boundariesSet, defaultBoundaries, inRange, pruneKeys, reminderDue, reminderKey, riskyRangeAt, toggleItem } from '@/features/camps/odak/engine/boundaries';
import { useOdakStore } from '@/features/camps/odak/store';

const mockNotify = jest.fn(async () => 'id');
jest.mock('react-native', () => ({ Platform: { OS: 'android' }, AppState: { addEventListener: () => ({ remove: () => undefined }) } }));
jest.mock('expo-notifications', () => ({ scheduleNotificationAsync: (...a: unknown[]) => mockNotify(...(a as [])) }));
jest.mock('expo-task-manager', () => ({ defineTask: jest.fn(), isTaskRegisteredAsync: jest.fn(async () => false) }));
jest.mock('expo-background-task', () => ({ registerTaskAsync: jest.fn(), unregisterTaskAsync: jest.fn(), BackgroundTaskResult: { Success: 1, Failed: 2 } }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
const mockEvents: { packageName: string; at: number }[] = [];
jest.mock('../modules/odak-usage', () => ({ usageAvailable: true, hasUsageAccess: () => true, foregroundEvents: async () => mockEvents, launchableApps: async () => [], openDigitalWellbeing: () => true, openUsageAccessSettings: () => undefined }));
jest.mock('@/features/camps/odak/privacy/device', () => {
  const { createMemoryVaultBackend, createVault } = jest.requireActual('@/features/camps/odak/privacy/vault');
  const mockVault = createVault(createMemoryVaultBackend(), { seal: async (t: string) => `s:${Buffer.from(t).toString('base64')}`, open: async (s: string) => Buffer.from(s.slice(2), 'base64').toString() });
  return { odakVault: () => mockVault, wipeOdakSecrets: async () => mockVault.clear() };
});

const d = (day: number, h: number, m = 0) => new Date(2026, 10, day, h, m);
const late = { from: '23:00', to: '01:00' };
const morning = { from: '06:00', to: '09:00' };

describe('risky hours', () => {
  it('handles ranges that cross midnight (end exclusive)', () => {
    expect([d(18, 22, 59), d(18, 23, 0), d(19, 0, 30), d(19, 1, 0)].map((x) => inRange(late, x))).toEqual([false, true, true, false]);
    expect(inRange(morning, d(18, 8, 59))).toBe(true);
    expect(riskyRangeAt([morning, late], d(18, 23, 30))).toBe(late);
    expect(riskyRangeAt([morning], d(18, 12))).toBeNull();
  });
  it('one reminder per range per day; the night range belongs to the evening it started', () => {
    expect(reminderKey(late, d(18, 23, 30))).toBe('2026-11-18@23:00');
    expect(reminderKey(late, d(19, 0, 30))).toBe('2026-11-18@23:00');
    expect(reminderKey(morning, d(19, 7))).toBe('2026-11-19@06:00');
  });
  it('fires only for chosen apps inside a risky hour, not twice', () => {
    const base = { packages: ['com.social'], ranges: [late], sentKeys: [] as string[] };
    expect(reminderDue({ ...base, events: [{ packageName: 'com.other', at: d(18, 23, 10).getTime() }] })).toBeNull();
    expect(reminderDue({ ...base, events: [{ packageName: 'com.social', at: d(18, 20).getTime() }] })).toBeNull();
    expect(reminderDue({ ...base, events: [{ packageName: 'com.social', at: d(19, 0, 10).getTime() }] })).toBe('2026-11-18@23:00');
    expect(reminderDue({ ...base, sentKeys: ['2026-11-18@23:00'], events: [{ packageName: 'com.social', at: d(19, 0, 10).getTime() }] })).toBeNull();
    expect(pruneKeys(['2026-11-01@23:00', '2026-11-18@23:00'], d(19, 9))).toEqual(['2026-11-18@23:00']);
  });
  it('counts the boundaries as set when a filter or the reminder is on', () => {
    expect(boundariesSet(defaultBoundaries())).toBe(false);
    expect(boundariesSet({ ...defaultBoundaries(), androidWellbeing: true })).toBe(true);
    expect(boundariesSet({ ...defaultBoundaries(), reminder: { enabled: true, packages: [] } })).toBe(false);
    expect(toggleItem(['a'], 'a')).toEqual([]);
  });
});

describe('background reminder check (Android)', () => {
  it('sends one neutral notification for a risky-hour app open and remembers it', async () => {
    const { runReminderCheck } = jest.requireActual<typeof import('@/features/camps/odak/boundaries/reminderTask')>('@/features/camps/odak/boundaries/reminderTask');
    await useOdakStore.getState().wipe();
    await useOdakStore.getState().enrol({ profile: { reasons: [], riskyHours: [late], createdAt: d(1, 9).toISOString() } as never, goal: { porn: 'quit', mast: 'none', startedAt: d(1, 9).toISOString() }, plans: [], screenings: [] });
    await useOdakStore.getState().saveBoundaries({ ...defaultBoundaries(), reminder: { enabled: true, packages: ['com.social'] } });
    mockEvents.splice(0, mockEvents.length, { packageName: 'com.social', at: d(18, 23, 20).getTime() });
    expect(await runReminderCheck(d(18, 23, 30))).toBe(true);
    expect(await runReminderCheck(d(18, 23, 45))).toBe(false);
    expect(mockNotify).toHaveBeenCalledTimes(1);
    const content = (mockNotify.mock.calls[0] as unknown as [{ content: { title: string; body: string; data: { route: string } } }])[0].content;
    expect(`${content.title} ${content.body}`).not.toMatch(/porno|mastürbasyon|cinsel|dürtü/i);
    expect(content.data.route).toBe('/odak/sos');
  });
});

describe('platform rules', () => {
  const root = path.join(__dirname, '..');
  it('Android module: usage access + launcher visibility only; no accessibility service, no QUERY_ALL_PACKAGES', () => {
    const manifest = fs.readFileSync(path.join(root, 'modules', 'odak-usage', 'android', 'src', 'main', 'AndroidManifest.xml'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    expect(manifest).toContain('android.permission.PACKAGE_USAGE_STATS');
    expect(manifest).toContain('android.intent.category.LAUNCHER');
    expect(manifest).not.toMatch(/QUERY_ALL_PACKAGES|BIND_ACCESSIBILITY_SERVICE|SYSTEM_ALERT_WINDOW|BIND_VPN_SERVICE/);
  });
  it('content: honesty note, both platform guides, a prominent disclosure, sourced and unreviewed', () => {
    expect(boundariesJson.honesty).toMatch(/Hiçbir filtre aşılmaz değildir/);
    expect(boundariesJson.ios.steps.length).toBeGreaterThanOrEqual(3);
    expect(boundariesJson.android.steps.length).toBeGreaterThanOrEqual(3);
    expect(boundariesJson.reminder.disclosure).toMatch(/yalnızca bu telefonda/);
    expect(boundariesJson.checklist.map((c) => c.id)).toEqual(['charge', 'grayscale', 'spaces', 'activities']);
    expect(boundariesJson.reviewed).toBe(false);
    const ids = new Set(sourcesJson.map((s) => s.id));
    for (const id of boundariesJson.sourceIds) expect(ids.has(id)).toBe(true);
  });
});
