import fs from 'fs';
import path from 'path';

import { utf8Decode, utf8Encode, type Codec } from '@/features/camps/odak/privacy/codec';
import { coversOn, FREE_ATTEMPTS, lockoutMs, locksOn, unlockMethod, validPin, waitLeft } from '@/features/camps/odak/privacy/lock';
import { isLocked, useOdakLockStore } from '@/features/camps/odak/privacy/lockStore';
import { isTwoFingerDown } from '@/features/camps/odak/privacy/quickExit';
import { createMemoryVaultBackend, createVault, DOC_COL } from '@/features/camps/odak/privacy/vault';
import tr from '@/i18n/tr.json';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));

describe('utf8 codec', () => {
  it('round-trips Turkish text and emoji', () => {
    const s = 'Çok güçlü bir istek 🎯 · ığüşöç İĞÜŞÖÇ — 😀';
    expect(utf8Decode(utf8Encode(s))).toBe(s);
    expect(Array.from(utf8Encode('ğ'))).toEqual([0xc4, 0x9f]);
    expect(Array.from(utf8Encode('🎯'))).toEqual([0xf0, 0x9f, 0x8e, 0xaf]);
  });
});

describe('camp lock rules', () => {
  it('accepts 4–6 digit PINs only', () => {
    expect(['1234', '123456'].every(validPin)).toBe(true);
    expect(['123', '1234567', '12a4', '', ' 1234'].some(validPin)).toBe(false);
  });
  it('waits after five wrong PINs, doubling up to 15 minutes', () => {
    expect(lockoutMs(FREE_ATTEMPTS - 1)).toBe(0);
    expect(lockoutMs(5)).toBe(30_000);
    expect(lockoutMs(6)).toBe(60_000);
    expect(lockoutMs(20)).toBe(15 * 60_000);
    expect(waitLeft(5, 1000, 11_000)).toBe(20_000);
    expect(waitLeft(5, 1000, 40_000)).toBe(0);
    expect(waitLeft(3, 1000, 1001)).toBe(0);
    expect(waitLeft(9, null, 0)).toBe(0);
  });
  it('uses the device lock when there is one, else the app PIN', () => {
    expect(unlockMethod(true, false)).toBe('device');
    expect(unlockMethod(true, true)).toBe('device');
    expect(unlockMethod(false, true)).toBe('pin');
    expect(unlockMethod(false, false)).toBe('setupPin');
  });
  it('locks in the background and covers whenever the app is not active', () => {
    expect(locksOn('background')).toBe(true);
    expect(locksOn('inactive')).toBe(false);
    expect(coversOn('inactive')).toBe(true);
    expect(coversOn('background')).toBe(true);
    expect(coversOn('active')).toBe(false);
  });
  it('quick exit needs two fingers moving down', () => {
    expect(isTwoFingerDown(2, 5, 40)).toBe(true);
    expect(isTwoFingerDown(1, 5, 40)).toBe(false);
    expect(isTwoFingerDown(2, 60, 40)).toBe(false);
    expect(isTwoFingerDown(2, 0, -40)).toBe(false);
  });
});

describe('lock store', () => {
  beforeEach(() => useOdakLockStore.getState().reset());
  it('is on by default and locks only an enrolled camp; unlocking clears the failures', () => {
    expect(isLocked(useOdakLockStore.getState())).toBe(false);
    useOdakLockStore.getState().setEnrolled(true);
    expect(isLocked(useOdakLockStore.getState())).toBe(true);
    useOdakLockStore.getState().pinFailed(5);
    useOdakLockStore.getState().pinFailed(6);
    expect(useOdakLockStore.getState()).toMatchObject({ failures: 2, lastFailAt: 6 });
    useOdakLockStore.getState().unlock();
    expect(useOdakLockStore.getState()).toMatchObject({ failures: 0, lastFailAt: null, unlocked: true });
    useOdakLockStore.getState().lock();
    expect(isLocked(useOdakLockStore.getState())).toBe(true);
  });
  it('can be turned off', () => {
    useOdakLockStore.getState().setEnrolled(true);
    useOdakLockStore.getState().setEnabled(false);
    expect(isLocked(useOdakLockStore.getState())).toBe(false);
  });
});

describe('vault', () => {
  // A stand-in codec (the real one is AES-GCM on the device): reversible and not plain text.
  const fake: Codec = {
    seal: async (t) => `sealed:${Buffer.from(t, 'utf8').toString('base64')}`,
    open: async (s) => {
      if (!s.startsWith('sealed:')) throw new Error('bad');
      return Buffer.from(s.slice(7), 'base64').toString('utf8');
    },
  };
  it('stores only sealed rows and reads them back', async () => {
    const backend = createMemoryVaultBackend();
    const v = createVault(backend, fake);
    await v.setDoc('state', { goal: 'Odak', n: 3 });
    await v.put('events', { id: 'e1', note: 'gece geç saatte' });
    await v.put('events', { id: 'e2', note: 'yalnız hissettim' });
    for (const r of backend.rows.values()) {
      expect(r.data).not.toContain('gece');
      expect(r.data).not.toContain('Odak');
      expect(r.data.startsWith('sealed:')).toBe(true);
    }
    const all = await v.load();
    expect(all.docs.state).toEqual({ goal: 'Odak', n: 3 });
    expect(all.lists.events).toHaveLength(2);
    v.remove('events', 'e1');
    expect((await v.load()).lists.events).toEqual([{ id: 'e2', note: 'yalnız hissettim' }]);
  });
  it('skips rows it cannot open and refuses the reserved collection', async () => {
    const backend = createMemoryVaultBackend();
    const v = createVault(backend, fake);
    backend.put({ col: 'events', id: 'x', data: 'garbage' });
    await v.put('events', { id: 'ok' });
    expect((await v.load()).lists.events).toEqual([{ id: 'ok' }]);
    await expect(v.put(DOC_COL, { id: 'x' })).rejects.toThrow();
    v.clear();
    expect(await v.load()).toEqual({ docs: {}, lists: {} });
  });
});

describe('neutral naming (spec 2.2)', () => {
  const banned = /porno|mastürbasyon|cinsel/i;
  it('no privacy / lock text and no permission text names the topic', () => {
    expect(JSON.stringify((tr as Record<string, unknown>).odak)).not.toMatch(banned);
    const config = fs.readFileSync(path.join(__dirname, '..', 'app.config.ts'), 'utf8');
    for (const m of config.matchAll(/faceIDPermission: '([^']+)'/g)) expect(m[1]).not.toMatch(banned);
  });
});
