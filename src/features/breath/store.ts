import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from '@/stores/storage';

import { BREATH_MODE_IDS, BREATH_MODES, type BreathMode } from './patterns';

/** Breath module preferences (SPEC_V4 §C.4): last mode and duration, haptic guide, safety note seen. */
interface BreathPrefs {
  lastMode: BreathMode;
  minutes: Partial<Record<BreathMode, number>>;
  haptics: boolean;
  safetySeen: boolean;
  remember: (mode: BreathMode, minutes: number) => void;
  setHaptics: (on: boolean) => void;
  markSafetySeen: () => void;
  /** Back to the defaults ("Verilerimi ve hesabımı sil"). */
  reset: () => void;
}

export const useBreathStore = create<BreathPrefs>()(
  persist(
    (set) => ({
      lastMode: 'quick',
      minutes: {},
      haptics: true,
      safetySeen: false,
      remember: (mode, minutes) => set((s) => ({ lastMode: mode, minutes: { ...s.minutes, [mode]: minutes } })),
      setHaptics: (on) => set({ haptics: on }),
      markSafetySeen: () => set({ safetySeen: true }),
      reset: () => set({ lastMode: 'quick', minutes: {}, haptics: true, safetySeen: false }),
    }),
    {
      name: 'breath',
      storage: persistStorage,
      version: 1,
      partialize: (s) => ({ lastMode: s.lastMode, minutes: s.minutes, haptics: s.haptics, safetySeen: s.safetySeen }),
      // Ignore anything that is not a known mode / duration.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<BreathPrefs>;
        const minutes: Partial<Record<BreathMode, number>> = {};
        for (const m of BREATH_MODE_IDS) {
          const v = p.minutes?.[m];
          if (typeof v === 'number' && BREATH_MODES[m].minutes.includes(v)) minutes[m] = v;
        }
        return {
          ...current,
          lastMode: BREATH_MODE_IDS.includes(p.lastMode as BreathMode) ? (p.lastMode as BreathMode) : current.lastMode,
          minutes,
          haptics: typeof p.haptics === 'boolean' ? p.haptics : current.haptics,
          safetySeen: p.safetySeen === true,
        };
      },
    },
  ),
);

/** The duration to preselect for a mode: last used, else the mode's default. */
export const minutesFor = (mode: BreathMode, remembered: Partial<Record<BreathMode, number>>) => remembered[mode] ?? BREATH_MODES[mode].defaultMinutes;
