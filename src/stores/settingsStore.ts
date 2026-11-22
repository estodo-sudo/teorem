import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Settings } from '@/types';

import { persistStorage } from './storage';

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
  language: 'tr',
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
