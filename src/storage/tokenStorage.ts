// Спочатку пробуємо AsyncStorage, якщо нема — fallback на in-memory (для дебагу)
let AsyncStorage: any = null;

try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  // AsyncStorage не встановлений — використовуємо in-memory fallback
  console.warn('[tokenStorage] AsyncStorage not found, using in-memory fallback');
}

const ACCESS_KEY = '@auth_access_token';
const REFRESH_KEY = '@auth_refresh_token';

// In-memory fallback (не зберігається між перезапусками)
const memStore: Record<string, string> = {};

export const tokenStorage = {
  async getAccess(): Promise<string | null> {
    try {
      if (AsyncStorage) return await AsyncStorage.getItem(ACCESS_KEY);
      return memStore[ACCESS_KEY] ?? null;
    } catch {
      return memStore[ACCESS_KEY] ?? null;
    }
  },

  async getRefresh(): Promise<string | null> {
    try {
      if (AsyncStorage) return await AsyncStorage.getItem(REFRESH_KEY);
      return memStore[REFRESH_KEY] ?? null;
    } catch {
      return memStore[REFRESH_KEY] ?? null;
    }
  },

  async save(accessToken: string, refreshToken: string): Promise<void> {
    memStore[ACCESS_KEY] = accessToken;
    memStore[REFRESH_KEY] = refreshToken;
    try {
      if (AsyncStorage) {
        await AsyncStorage.multiSet([
          [ACCESS_KEY, accessToken],
          [REFRESH_KEY, refreshToken],
        ]);
      }
    } catch (e) {
      console.warn('[tokenStorage] save failed:', e);
    }
  },

  async clear(): Promise<void> {
    delete memStore[ACCESS_KEY];
    delete memStore[REFRESH_KEY];
    try {
      if (AsyncStorage) {
        await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
      }
    } catch (e) {
      console.warn('[tokenStorage] clear failed:', e);
    }
  },
};
