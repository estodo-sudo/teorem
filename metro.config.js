// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// expo-sqlite's web build ships a .wasm file.
config.resolver.assetExts.push('wasm');

/**
 * Windows: Metro's file cache opens many files at once and sometimes fails with EMFILE ("too many open
 * files"). That failed whole bundles, so the phone kept running old code (2026-11-24). Cache reads and
 * writes are limited to a few at a time, retried briefly on EMFILE, and a read that still fails is a
 * cache miss (Metro just transforms the file again) instead of a build error.
 */
const MAX_OPEN = 32;
let open = 0;
const waiting = [];
const acquire = () => (open < MAX_OPEN ? (open++, Promise.resolve()) : new Promise((resolve) => waiting.push(resolve)));
const release = () => {
  const next = waiting.shift();
  if (next) next();
  else open--;
};
const limited = async (fn) => {
  await acquire();
  try {
    return await fn();
  } finally {
    release();
  }
};
const isEmfile = (e) => e && (e.code === 'EMFILE' || e.code === 'ENFILE');
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function resilientStore(store) {
  return {
    async get(key) {
      for (let attempt = 0; ; attempt++) {
        try {
          return await limited(() => store.get(key));
        } catch (e) {
          if (!isEmfile(e)) throw e;
          if (attempt >= 3) return null;
          await pause(50 * (attempt + 1));
        }
      }
    },
    async set(key, value) {
      try {
        await limited(() => store.set(key, value));
      } catch (e) {
        if (!isEmfile(e)) throw e;
      }
    },
    clear() {
      return store.clear && store.clear();
    },
  };
}

config.cacheStores = (config.cacheStores || []).map(resilientStore);

module.exports = config;
