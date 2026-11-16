import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * Synchronous on-device key-value store for small state (profile, settings, …).
 *
 * Tried in order, each verified with a real write/read round-trip so a backend
 * that can be created but fails on first use is never selected:
 *  1. react-native-mmkv — fastest; needs a development build (Nitro modules).
 *  2. expo-sqlite kv-store — ships inside Expo Go.
 *  3. in-memory — last resort so the app still opens (nothing persists).
 * All local-only; nothing leaves the device.
 */
const PROBE_KEY = '__storage_probe__';

function verify(backend: StateStorage): StateStorage {
  backend.setItem(PROBE_KEY, '1');
  if (backend.getItem(PROBE_KEY) !== '1') throw new Error('storage probe failed');
  backend.removeItem(PROBE_KEY);
  return backend;
}

function mmkvBackend(): StateStorage {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  const mmkv = createMMKV({ id: 'app-state' });
  return {
    getItem: (name) => mmkv.getString(name) ?? null,
    setItem: (name, value) => mmkv.set(name, value),
    removeItem: (name) => {
      mmkv.remove(name);
    },
  };
}

function sqliteBackend(): StateStorage {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Storage } = require('expo-sqlite/kv-store') as typeof import('expo-sqlite/kv-store');
  return {
    getItem: (name) => Storage.getItemSync(name),
    setItem: (name, value) => Storage.setItemSync(name, value),
    removeItem: (name) => {
      Storage.removeItemSync(name);
    },
  };
}

function memoryBackend(): StateStorage {
  const m = new Map<string, string>();
  return {
    getItem: (name) => m.get(name) ?? null,
    setItem: (name, value) => {
      m.set(name, value);
    },
    removeItem: (name) => {
      m.delete(name);
    },
  };
}

export type StorageKind = 'mmkv' | 'sqlite' | 'memory';

function createBackend(): { backend: StateStorage; kind: StorageKind } {
  try {
    return { backend: verify(mmkvBackend()), kind: 'mmkv' };
  } catch {
    // MMKV unavailable (e.g. Expo Go) → try SQLite.
  }
  try {
    return { backend: verify(sqliteBackend()), kind: 'sqlite' };
  } catch {
    // SQLite unavailable → keep the app usable in memory.
  }
  console.warn('[storage] No persistent storage available; using memory.');
  return { backend: memoryBackend(), kind: 'memory' };
}

const created = createBackend();

/** Which backend is active (useful when debugging Expo Go vs dev builds). */
export const storageKind: StorageKind = created.kind;

export const kvBackend = created.backend;

export const persistStorage = createJSONStorage(() => kvBackend);
