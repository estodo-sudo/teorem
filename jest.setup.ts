// In-memory MMKV for unit tests (the real one needs the Nitro native module).
jest.mock('react-native-mmkv', () => {
  const createMMKV = () => {
    const m = new Map<string, string | number | boolean>();
    return {
      set: (k: string, v: string | number | boolean) => m.set(k, v),
      getString: (k: string) => (typeof m.get(k) === 'string' ? (m.get(k) as string) : undefined),
      getNumber: (k: string) => (typeof m.get(k) === 'number' ? (m.get(k) as number) : undefined),
      getBoolean: (k: string) => (typeof m.get(k) === 'boolean' ? (m.get(k) as boolean) : undefined),
      contains: (k: string) => m.has(k),
      remove: (k: string) => m.delete(k),
      getAllKeys: () => Array.from(m.keys()),
      clearAll: () => m.clear(),
    };
  };
  return { createMMKV };
});

// The app's source language is Turkish and most tests check Turkish texts: pretend the phone is Turkish.
// (English parity is checked file by file in __tests__/i18nParity.test.ts.)
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'tr', languageTag: 'tr-TR', regionCode: 'TR' }],
  getCalendars: () => [{ timeZone: 'Europe/Istanbul' }],
}));
