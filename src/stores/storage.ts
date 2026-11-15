import { createMMKV } from 'react-native-mmkv';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/** Single on-device key-value store for small state (profile, settings, ...). */
export const kv = createMMKV({ id: 'app-state' });

const mmkvStateStorage: StateStorage = {
  getItem: (name) => kv.getString(name) ?? null,
  setItem: (name, value) => kv.set(name, value),
  removeItem: (name) => {
    kv.remove(name);
  },
};

export const persistStorage = createJSONStorage(() => mmkvStateStorage);
