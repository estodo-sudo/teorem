import { useBreathStore } from '@/features/breath/store';
import { useOdakLockStore } from '@/features/camps/odak/privacy/lockStore';
import { deleteAllData } from '@/features/data/deleteAll';
import { useBodyweightStore } from '@/stores/bodyweightStore';
import { useEntitlementStore } from '@/stores/entitlementStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { persistStorage } from '@/stores/storage';
import { useTrainingStore } from '@/stores/trainingStore';

/** "Verilerimi ve hesabımı sil" really resets everything (user report 2026-11-23: "seviyem hâlâ 5"). */
describe('delete my data and account', () => {
  it('resets level, profile, settings, history, camps, breath and lock state, in memory and in storage', async () => {
    useTrainingStore.getState().update({ level: 5 });
    useProfileStore.getState().update({ onboardingDone: true, tutorialDone: true, disclaimerAcceptedAt: '2026-11-01T10:00:00Z', experience: 'regular' });
    useSettingsStore.getState().update({ hapticStrength: 0, language: 'en', remindersEnabled: false });
    useBreathStore.getState().markSafetySeen();
    useOdakLockStore.getState().reset();
    useBodyweightStore.getState().start('karin', 'toparla', '2026-11-20');
    useEntitlementStore.getState().set({ active: true, productId: 'premium_yearly', expiresAt: null, lastVerifiedAt: '2026-11-20T10:00:00Z' } as never);
    useProgressStore.getState().unlockAchievements(['first_workout'], '2026-11-20');

    await deleteAllData();

    expect(useTrainingStore.getState().training.level).toBe(1);
    const profile = useProfileStore.getState().profile;
    expect([profile.onboardingDone, profile.tutorialDone, profile.disclaimerAcceptedAt, profile.experience]).toEqual([false, false, null, null]);
    const settings = useSettingsStore.getState().settings;
    expect(settings.hapticStrength).toBe(2);
    expect(settings.remindersEnabled).toBe(true);
    // The language the user just used stays, so the start screens don't switch language.
    expect(settings.language).toBe('en');
    expect(useBreathStore.getState().safetySeen).toBe(false);
    expect(useBodyweightStore.getState().active).toEqual({});
    expect(useEntitlementStore.getState().entitlement.active).toBe(false);
    expect(Object.keys(useProgressStore.getState().achievements)).toEqual([]);
    expect(useHistoryStore.getState().workouts).toEqual([]);

    // What is written to the phone's storage is the reset state too (not the old level 5).
    const saved = (await persistStorage!.getItem('training')) as { state: { training: { level: number } } } | null;
    expect(saved?.state.training.level).toBe(1);
  });
});
