/**
 * Safe storage wrapper that falls back to AsyncStorage if MMKV fails.
 * This prevents blank-screen crashes when the native MMKV module isn't linked.
 */

let mmkvStorage: any = null;

try {
  const { MMKV } = require('react-native-mmkv');
  const storage = new MMKV();
  mmkvStorage = {
    getItem: (name: string) => storage.getString(name) ?? null,
    setItem: (name: string, value: string) => storage.set(name, value),
    removeItem: (name: string) => storage.delete(name),
  };
} catch (e) {
  console.warn('[Storage] MMKV unavailable, falling back to AsyncStorage');
}

if (!mmkvStorage) {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    mmkvStorage = {
      getItem: async (name: string) => AsyncStorage.getItem(name),
      setItem: async (name: string, value: string) => AsyncStorage.setItem(name, value),
      removeItem: async (name: string) => AsyncStorage.removeItem(name),
    };
  } catch (e) {
    console.warn('[Storage] AsyncStorage also unavailable, using in-memory fallback');
    const mem: Record<string, string> = {};
    mmkvStorage = {
      getItem: (name: string) => mem[name] ?? null,
      setItem: (name: string, value: string) => { mem[name] = value; },
      removeItem: (name: string) => { delete mem[name]; },
    };
  }
}

export const safeStorage = mmkvStorage;
