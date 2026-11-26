import { useEffect } from 'react';
import { AppState } from 'react-native';

import { Celebration } from '@/features/gamification/Celebration';
import { checkAchievements, completedDates } from '@/features/gamification/service';
import { refreshEntitlement, startPurchaseListener } from '@/features/purchases/iap';
import { addResponseListener, consumeColdStartResponse, initNotifications, syncReminders } from '@/features/reminders/scheduler';
import { useOdakLockStore } from '@/features/camps/odak/privacy/lockStore';
import { dailyCheck } from '@/features/training/returns';
import { toDateKey } from '@/lib/date';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';
import { useEntitlementStore } from '@/stores/entitlementStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrainingStore } from '@/stores/trainingStore';
import { registerHooks } from './registerHooks';

registerHooks();

/** Kegel v2 (§6.6): once a day — refill freezes, cover short gaps, soften the return after a break. */
function runDailyCheck() {
  const st = useTrainingStore.getState();
  const next = dailyCheck(st.training, toDateKey(), completedDates(useHistoryStore.getState().workouts));
  if (next !== st.training) st.replace(next);
}

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
    runDailyCheck();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        void refreshEntitlement();
        runDailyCheck();
      }
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
        a.weeklyTestReminder !== b.weeklyTestReminder ||
        a.reminderSkipDate !== b.reminderSkipDate
      ) {
        void syncReminders();
      }
    });
    // Kegel: daily target and vacation decide which reminders fire.
    const unsubTraining = useTrainingStore.subscribe((state, prev) => {
      if (state.training.dailyTarget !== prev.training.dailyTarget || state.training.vacation !== prev.training.vacation) void syncReminders();
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
    // Odak Kampı: risky hours, programme start, check-ins (neutral plan) or the switch changed.
    const unsubOdak = useOdakLockStore.subscribe((state, prev) => {
      if (state.notifPlan !== prev.notifPlan || state.notifEnabled !== prev.notifEnabled || state.enrolled !== prev.enrolled) void syncReminders();
    });
    // Premium bought or ended: premium-only reminders (the weekly test) come or go (2026-11-26).
    const unsubEntitlement = useEntitlementStore.subscribe((state, prev) => {
      if (state.entitlement !== prev.entitlement) void syncReminders();
    });
    return () => {
      unsubTraining();
      unsubOdak();
      unsubEntitlement();
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
