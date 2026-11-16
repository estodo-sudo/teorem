/** The key-value backend must never crash app start-up (e.g. MMKV in Expo Go). */
describe('storage backend fallback', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('react-native-mmkv');
    jest.dontMock('expo-sqlite/kv-store');
  });

  const sqliteMock = () => {
    const m = new Map<string, string>();
    return {
      Storage: {
        getItemSync: (k: string) => m.get(k) ?? null,
        setItemSync: (k: string, v: string) => void m.set(k, v),
        removeItemSync: (k: string) => m.delete(k),
      },
    };
  };

  it('uses MMKV when it works', () => {
    jest.isolateModules(() => {
      const { storageKind } = require('@/stores/storage');
      expect(storageKind).toBe('mmkv');
    });
  });

  it('falls back to SQLite when MMKV is created but fails on first use (Expo Go)', () => {
    jest.doMock('react-native-mmkv', () => ({
      createMMKV: () => ({
        set: () => {
          throw new Error('NitroModules are not supported in Expo Go');
        },
        getString: () => undefined,
        remove: () => false,
      }),
    }));
    jest.doMock('expo-sqlite/kv-store', sqliteMock);
    jest.isolateModules(() => {
      const { storageKind, kvBackend } = require('@/stores/storage');
      expect(storageKind).toBe('sqlite');
      kvBackend.setItem('a', 'b');
      expect(kvBackend.getItem('a')).toBe('b');
    });
  });

  it('falls back to SQLite when MMKV cannot even be created', () => {
    jest.doMock('react-native-mmkv', () => {
      throw new Error('module missing');
    });
    jest.doMock('expo-sqlite/kv-store', sqliteMock);
    jest.isolateModules(() => {
      expect(require('@/stores/storage').storageKind).toBe('sqlite');
    });
  });

  it('keeps the app usable in memory when nothing persistent works', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.doMock('react-native-mmkv', () => {
      throw new Error('no mmkv');
    });
    jest.doMock('expo-sqlite/kv-store', () => {
      throw new Error('no sqlite');
    });
    jest.isolateModules(() => {
      const { storageKind, kvBackend } = require('@/stores/storage');
      expect(storageKind).toBe('memory');
      kvBackend.setItem('x', '1');
      expect(kvBackend.getItem('x')).toBe('1');
    });
    warn.mockRestore();
  });
});
