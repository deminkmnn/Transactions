let AsyncStorage: any = null;

try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  console.warn('[settingsStorage] AsyncStorage not found, using in-memory fallback');
}

export type AppLanguage = 'en' | 'uk';
export type AppCurrency = 'UAH' | 'USD' | 'EUR';

export interface AppSettings {
  backendUrl: string;
  language: AppLanguage;
  currency: AppCurrency;
}

export const DEFAULT_SETTINGS: AppSettings = {
  backendUrl: 'http://192.168.0.2:3001/api/v1',
  language: 'en',
  currency: 'UAH',
};

const SETTINGS_KEY = '@app_settings';
let memSettings: AppSettings = DEFAULT_SETTINGS;

export const settingsStorage = {
  async get(): Promise<AppSettings> {
    try {
      if (AsyncStorage) {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (!raw) return memSettings;

        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        memSettings = {
          backendUrl: parsed.backendUrl ?? DEFAULT_SETTINGS.backendUrl,
          language: parsed.language ?? DEFAULT_SETTINGS.language,
          currency: parsed.currency ?? DEFAULT_SETTINGS.currency,
        };
      }
    } catch {
      // Fall back to in-memory settings.
    }

    return memSettings;
  },

  async save(next: AppSettings): Promise<void> {
    memSettings = next;
    try {
      if (AsyncStorage) {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      }
    } catch (error) {
      console.warn('[settingsStorage] save failed:', error);
    }
  },

  async reset(): Promise<AppSettings> {
    memSettings = DEFAULT_SETTINGS;
    try {
      if (AsyncStorage) {
        await AsyncStorage.removeItem(SETTINGS_KEY);
      }
    } catch (error) {
      console.warn('[settingsStorage] reset failed:', error);
    }
    return memSettings;
  },
};
