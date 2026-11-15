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
