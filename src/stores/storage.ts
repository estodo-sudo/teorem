import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * Synchronous on-device key-value store for small state (profile, settings, …).
 *
 * Primary: react-native-mmkv (fast, needs a development build because it uses
 * Nitro native modules). Fallback: expo-sqlite's kv-store, which ships inside
 * Expo Go — so the app also runs in Expo Go for quick testing on a phone.
 * Both are local-only; nothing leaves the device.
 */
function createBackend(): StateStorage {
  try {
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
  } catch {
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
}

export const kvBackend = createBackend();

export const persistStorage = createJSONStorage(() => kvBackend);
