import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { UserProfile } from '@/types';

import { persistStorage } from './storage';

export const defaultProfile = (): UserProfile => ({
  goals: [],
  ageRange: null,
  experience: null,
  activity: null,
  onboardingDone: false,
  tutorialDone: false,
  disclaimerAcceptedAt: null,
  introAnatomySeen: false,
  paywallSeen: false,
  createdAt: new Date().toISOString(),
});

interface ProfileStore {
  profile: UserProfile;
  update: (patch: Partial<UserProfile>) => void;
  replace: (profile: UserProfile) => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: defaultProfile(),
      update: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      replace: (profile) => set({ profile }),
      reset: () => set({ profile: defaultProfile() }),
    }),
    { name: 'profile', storage: persistStorage, version: 1 },
  ),
);
