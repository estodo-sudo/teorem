import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { languageForDevice, type Language } from '@/i18n/languages';
import type { Settings } from '@/types';

import { persistStorage } from './storage';

/** First launch: the phone's language when the app has it, otherwise English. */
function deviceLanguage(): Language {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocales } = require('expo-localization') as typeof import('expo-localization');
    return languageForDevice(getLocales()[0]?.languageCode);
  } catch {
    return 'tr';
  }
}

export const defaultSettings = (): Settings => ({
  hapticStrength: 2,
  soundCues: false,
  introSound: true,
  discreetPlayer: false,
  reminderTimes: ['21:00'],
  remindersEnabled: true,
  weeklyTestReminder: true,
  discreetNotifications: true,
  theme: 'system',
  sessionsPerDay: 1,
  saveUnloadNotes: false,
  language: deviceLanguage(),
});

interface SettingsStore {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  replace: (settings: Settings) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings(),
      update: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      replace: (settings) => set({ settings: { ...defaultSettings(), ...settings } }),
      reset: () => set({ settings: defaultSettings() }),
    }),
    { name: 'settings', storage: persistStorage, version: 1 },
  ),
);
