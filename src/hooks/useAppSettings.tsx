import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setApiBaseUrl } from '../services/api';
import {
  DEFAULT_SETTINGS,
  settingsStorage,
  type AppCurrency,
  type AppLanguage,
  type AppSettings,
} from '../storage/settingsStorage';

interface AppSettingsContextValue {
  settings: AppSettings;
  ready: boolean;
  updateBackendUrl: (backendUrl: string) => Promise<void>;
  updateLanguage: (language: AppLanguage) => Promise<void>;
  updateCurrency: (currency: AppCurrency) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    settingsStorage.get()
      .then((stored) => {
        setSettings(stored);
        setApiBaseUrl(stored.backendUrl);
      })
      .finally(() => setReady(true));
  }, []);

  const persist = async (next: AppSettings) => {
    setSettings(next);
    setApiBaseUrl(next.backendUrl);
    await settingsStorage.save(next);
  };

  const value = useMemo<AppSettingsContextValue>(() => ({
    settings,
    ready,
    updateBackendUrl: async (backendUrl: string) => {
      await persist({ ...settings, backendUrl });
    },
    updateLanguage: async (language: AppLanguage) => {
      await persist({ ...settings, language });
    },
    updateCurrency: async (currency: AppCurrency) => {
      await persist({ ...settings, currency });
    },
    resetSettings: async () => {
      const next = await settingsStorage.reset();
      setSettings(next);
      setApiBaseUrl(next.backendUrl);
    },
  }), [ready, settings]);

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
}
