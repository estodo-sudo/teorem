import { useEffect } from 'react';
import { AppState } from 'react-native';

import { Celebration } from '@/features/gamification/Celebration';
import { checkAchievements } from '@/features/gamification/service';
import { refreshEntitlement, startPurchaseListener } from '@/features/purchases/iap';
import { addResponseListener, consumeColdStartResponse, initNotifications, syncReminders } from '@/features/reminders/scheduler';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';

import { registerHooks } from './registerHooks';

registerHooks();

/** Global side effects mounted once at the root. */
export function AppEffects() {
  const ready = useProfileStore((s) => s.profile.onboardingDone);

  useEffect(() => {
    // Catch up on anything earned while the app was closed (e.g. after import).
    checkAchievements();
    // Silently re-verify the subscription with the store; offline keeps the cache.
    void refreshEntitlement();
    // Also catches purchases that complete while the paywall isn't open
    // (e.g. Ask-to-Buy approvals, interrupted transactions).
    const stop = startPurchaseListener();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refreshEntitlement();
    });
    return () => {
      stop();
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void initNotifications().then(() => {
      consumeColdStartResponse();
      void syncReminders();
    });
    const removeListener = addResponseListener();
    // Re-plan when coming back to the foreground (a new day may have started).
    const appSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void syncReminders();
    });
    // Re-plan whenever reminder-related settings change.
    const unsubSettings = useSettingsStore.subscribe((state, prev) => {
      const a = state.settings;
      const b = prev.settings;
      if (
        a.reminderTimes.join() !== b.reminderTimes.join() ||
        a.remindersEnabled !== b.remindersEnabled ||
        a.discreetNotifications !== b.discreetNotifications ||
        a.weeklyTestReminder !== b.weeklyTestReminder
      ) {
        void syncReminders();
      }
    });
    // A finished workout or new strength test changes what should fire.
    const unsubHistory = useHistoryStore.subscribe((state, prev) => {
      if (state.workouts !== prev.workouts || state.strengthTests !== prev.strengthTests) void syncReminders();
    });
    // Sigarasız Kamp: a new phase, check-in, diary entry or the camp switch changes what should fire.
    const unsubCamp = useCampStore.subscribe((state, prev) => {
      if (state.attempts !== prev.attempts || state.notifyEnabled !== prev.notifyEnabled || state.profile !== prev.profile) void syncReminders();
    });
    const unsubCampEvents = useCampEventsStore.subscribe((state, prev) => {
      if (state.checkins !== prev.checkins || state.cigarettes !== prev.cigarettes) void syncReminders();
    });
    return () => {
      removeListener();
      appSub.remove();
      unsubSettings();
      unsubHistory();
      unsubCamp();
      unsubCampEvents();
    };
  }, [ready]);

  return <Celebration />;
}
