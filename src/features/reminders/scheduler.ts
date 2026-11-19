import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import i18n from '@/i18n';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrainingStore } from '@/stores/trainingStore';

import { campNotifRequests, handleCampNotifResponse, setupCampNotifiers } from '@/features/camps/core/campNotifications';
import { campNotifiers } from '@/features/camps/registry';

import { planReminders, snoozeDate } from './plan';

const CATEGORY = 'daily-workout';
const CHANNEL = 'reminders';
const ACTION_START = 'start';
const ACTION_MICRO = 'micro';
const ACTION_SNOOZE_15 = 'snooze15';
const ACTION_SKIP_TODAY = 'skipToday';

let initialized = false;

/** One-time setup: foreground handler, Android channel, action category. */
export async function initNotifications() {
  if (initialized || Platform.OS === 'web') return;
  initialized = true;
  try {
    Notifications.setNotificationHandler({
      // App is open → don't interrupt with a banner.
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: i18n.t('reminders.discreet.title'),
        importance: AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200],
        // Content hidden on the lock screen by default for privacy.
        lockscreenVisibility: AndroidNotificationVisibility.PRIVATE,
      });
    }
    await Notifications.setNotificationCategoryAsync(CATEGORY, [
      // Kegel v2 (§13): start (3 min), micro set (1 min), snooze 15 min, skip today.
      { identifier: ACTION_START, buttonTitle: i18n.t('reminders.actions.start'), options: { opensAppToForeground: true } },
      { identifier: ACTION_MICRO, buttonTitle: i18n.t('reminders.actions.micro'), options: { opensAppToForeground: true } },
      { identifier: ACTION_SNOOZE_15, buttonTitle: i18n.t('reminders.actions.snooze15'), options: { opensAppToForeground: false } },
      { identifier: ACTION_SKIP_TODAY, buttonTitle: i18n.t('reminders.actions.skipToday'), options: { opensAppToForeground: false } },
    ]);
    // Camp notifications have their own actions (e.g. SOS, check-in, snooze).
    await setupCampNotifiers(campNotifiers());
  } catch {
    // Notifications are optional; never block the app.
  }
}

/** Today's target (main session + micro sets) reached → the rest of today's reminders stay quiet. */
function completedToday(): boolean {
  const today = toDateKey();
  const done = useHistoryStore.getState().workouts.filter((w) => w.date === today && w.completed).length;
  return done >= useTrainingStore.getState().training.dailyTarget;
}

function lastStrengthTest(): string | null {
  const tests = useHistoryStore.getState().strengthTests;
  return tests.reduce<string | null>((a, t) => (!a || t.date > a ? t.date : a), null);
}

let syncing: Promise<void> | null = null;

/** Rebuilds all scheduled reminders from current settings + history. */
export function syncReminders(): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  const run = async () => {
    try {
      const s = useSettingsStore.getState().settings;
      await Notifications.cancelAllScheduledNotificationsAsync();
      const perm = await Notifications.getPermissionsAsync();
      if (!perm.granted) return;
      const plan = planReminders({
        now: new Date(),
        times: s.reminderTimes,
        enabled: s.remindersEnabled,
        completedToday: completedToday(),
        skipDate: s.reminderSkipDate ?? null,
        vacation: useTrainingStore.getState().training.vacation,
        discreet: s.discreetNotifications,
        weeklyTest: s.weeklyTestReminder,
        lastStrengthTest: lastStrengthTest(),
      });
      for (const r of plan) {
        await Notifications.scheduleNotificationAsync({
          identifier: r.id,
          content: {
            title: i18n.t(r.titleKey),
            body: i18n.t(r.bodyKey),
            categoryIdentifier: r.kind === 'daily' ? CATEGORY : undefined,
            data: { kind: r.kind },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: r.fireAt,
            channelId: CHANNEL,
          },
        });
      }
      // Camps: phase-aware camp notifications share this sync (it cancels everything first).
      for (const c of campNotifRequests(campNotifiers())) {
        await Notifications.scheduleNotificationAsync({
          identifier: c.identifier,
          content: c.content,
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: c.date, channelId: CHANNEL },
        });
      }
    } catch {
      // ignore
    }
  };
  // Serialize syncs so overlapping calls don't interleave cancel/schedule.
  syncing = (syncing ?? Promise.resolve()).then(run);
  return syncing;
}

async function snooze(minutes: number) {
  const s = useSettingsStore.getState().settings;
  const style = s.discreetNotifications ? 'discreet' : 'explicit';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t(`reminders.${style}.title`),
      body: i18n.t(`reminders.${style}.body0`),
      categoryIdentifier: CATEGORY,
      data: { kind: 'daily' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: snoozeDate(new Date(), minutes), channelId: CHANNEL },
  });
}

export function handleNotificationResponse(res: Notifications.NotificationResponse) {
  if (handleCampNotifResponse(campNotifiers(), res)) {
    if (res.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) void Notifications.dismissNotificationAsync(res.notification.request.identifier).catch(() => {});
    return;
  }
  const kind = (res.notification.request.content.data as { kind?: string } | undefined)?.kind;
  switch (res.actionIdentifier) {
    case ACTION_SNOOZE_15:
      void snooze(15);
      break;
    case ACTION_SKIP_TODAY:
      useSettingsStore.getState().update({ reminderSkipDate: toDateKey() });
      void syncReminders();
      break;
    case ACTION_START:
      router.push({ pathname: '/workout/[sessionId]', params: { sessionId: 'quick' } });
      break;
    case ACTION_MICRO:
      router.push({ pathname: '/workout/[sessionId]', params: { sessionId: 'micro' } });
      break;
    default:
      if (kind === 'weeklyTest') router.push('/strength-test');
      else router.navigate('/');
  }
  if (res.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    void Notifications.dismissNotificationAsync(res.notification.request.identifier).catch(() => {});
  }
}

export function addResponseListener() {
  if (Platform.OS === 'web') return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
  return () => sub.remove();
}

/** Handles a notification tap that cold-started the app. */
export function consumeColdStartResponse() {
  if (Platform.OS === 'web') return;
  try {
    const res = Notifications.getLastNotificationResponse();
    if (res) {
      handleNotificationResponse(res);
      Notifications.clearLastNotificationResponse();
    }
  } catch {
    // ignore
  }
}
