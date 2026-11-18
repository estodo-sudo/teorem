import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import i18n from '@/i18n';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';
import { useSettingsStore } from '@/stores/settingsStore';

import { CAMP_HEALTH } from './content';
import { diaryReport, logsOfAttempt } from './engine/diary';
import { checkinSlotDays, planCampNotifications, type PlannedCampNotif } from './engine/notifications';
import { campAttempt } from './state';

/** Action buttons on camp notifications (spec 4.16): SOS, check-in, snooze. */
export const CAMP_CATEGORY = 'camp';
const ACTION_SOS = 'camp-sos';
const ACTION_CHECKIN = 'camp-checkin';
const ACTION_SNOOZE = 'camp-snooze';
const SNOOZE_MIN = 30;
/** The busiest diary hour is used once there are at least this many entries. */
const RISKY_MIN_LOGS = 3;

export async function setupCampCategory() {
  await Notifications.setNotificationCategoryAsync(CAMP_CATEGORY, [
    { identifier: ACTION_SOS, buttonTitle: i18n.t('camp.notif.actions.sos'), options: { opensAppToForeground: true } },
    { identifier: ACTION_CHECKIN, buttonTitle: i18n.t('camp.notif.actions.checkin'), options: { opensAppToForeground: true } },
    { identifier: ACTION_SNOOZE, buttonTitle: i18n.t('camp.notif.actions.snooze'), options: { opensAppToForeground: false } },
  ]);
}

function content(n: PlannedCampNotif): Notifications.NotificationContentInput {
  const label = n.kind === 'milestone' ? (CAMP_HEALTH.items.find((x) => x.id === n.params?.id)?.label ?? '') : '';
  return {
    title: i18n.t(n.titleKey, { ...n.params, label }),
    body: i18n.t(n.bodyKey, { ...n.params, label }),
    categoryIdentifier: CAMP_CATEGORY,
    data: { kind: 'camp', route: n.route, titleKey: n.titleKey, bodyKey: n.bodyKey },
  };
}

/** The camp's notifications for the coming days, from the current camp data and settings. */
export function campNotificationRequests(now = new Date()): { identifier: string; content: Notifications.NotificationContentInput; date: Date }[] {
  const camp = useCampStore.getState();
  const ev = useCampEventsStore.getState();
  const attempt = campAttempt(camp);
  const prepLogs = attempt ? logsOfAttempt(ev.cigarettes, attempt.id).filter((l) => !l.isSlip) : [];
  const top = prepLogs.length >= RISKY_MIN_LOGS ? (diaryReport(prepLogs).topHours[0]?.hour ?? null) : null;
  const slots = checkinSlotDays(ev.checkins);
  const plan = planCampNotifications({
    now,
    enabled: camp.notifyEnabled && camp.profile !== null,
    discreet: useSettingsStore.getState().settings.discreetNotifications,
    attempt,
    riskyHour: top,
    checkinMorningDays: slots.morning,
    checkinEveningDays: slots.evening,
  });
  return plan.map((n) => ({ identifier: n.id, content: content(n), date: n.fireAt }));
}

/** Handles taps and action buttons on camp notifications. Returns false for other notifications. */
export function handleCampResponse(res: Notifications.NotificationResponse): boolean {
  const data = res.notification.request.content.data as { kind?: string; route?: string } | undefined;
  if (data?.kind !== 'camp') return false;
  switch (res.actionIdentifier) {
    case ACTION_SOS:
      router.push('/camp/sos');
      break;
    case ACTION_CHECKIN:
      router.push('/camp/checkin');
      break;
    case ACTION_SNOOZE: {
      const c = res.notification.request.content;
      void Notifications.scheduleNotificationAsync({
        content: { title: c.title ?? '', body: c.body ?? '', categoryIdentifier: CAMP_CATEGORY, data: c.data },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(Date.now() + SNOOZE_MIN * 60_000), channelId: 'reminders' },
      }).catch(() => undefined);
      break;
    }
    default:
      router.push((data.route ?? '/camp') as '/camp');
  }
  return true;
}
