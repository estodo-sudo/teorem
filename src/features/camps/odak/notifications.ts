import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import type { CampNotifier } from '@/features/camps/core/campNotifications';
import i18n from '@/i18n';

import { planOdakNotifications, type PlannedOdakNotif } from './engine/notifications';
import { useOdakLockStore } from './privacy/lockStore';

/**
 * Odak Kampı notifications: always neutral ("Odak zamanı yaklaşıyor ", "Günlük kontrolün hazır"),
 * never any content detail, with "SOS" and "Planımı gör" actions. Taps open the camp behind its lock.
 */
export const ODAK_CATEGORY = 'odak';
const ACTION_SOS = 'odak-sos';
const ACTION_PLAN = 'odak-plan';

const TEXT: Record<PlannedOdakNotif['kind'], [string, string]> = {
  risky: ['odak.notif.riskyTitle', 'odak.notif.riskyBody'],
  checkin: ['odak.notif.checkinTitle', 'odak.notif.checkinBody'],
  weekly: ['odak.notif.weeklyTitle', 'odak.notif.weeklyBody'],
};

export const odakNotifier: CampNotifier = {
  setup: async () => {
    await Notifications.setNotificationCategoryAsync(ODAK_CATEGORY, [
      { identifier: ACTION_SOS, buttonTitle: i18n.t('odak.notif.actionSos'), options: { opensAppToForeground: true } },
      { identifier: ACTION_PLAN, buttonTitle: i18n.t('odak.notif.actionPlan'), options: { opensAppToForeground: true } },
    ]);
  },
  requests: (now) => {
    const l = useOdakLockStore.getState();
    return planOdakNotifications({ now, enabled: l.enrolled && l.notifEnabled, plan: l.notifPlan }).map((n) => ({
      identifier: n.id,
      date: n.fireAt,
      content: { title: i18n.t(TEXT[n.kind][0]), body: i18n.t(TEXT[n.kind][1]), categoryIdentifier: ODAK_CATEGORY, data: { kind: 'odak', route: n.route } },
    }));
  },
  handleResponse: (res) => {
    const data = res.notification.request.content.data as { kind?: string; route?: string } | undefined;
    if (data?.kind !== 'odak') return false;
    if (res.actionIdentifier === ACTION_SOS) router.push('/odak/sos');
    else if (res.actionIdentifier === ACTION_PLAN) router.push('/odak');
    else router.push((data.route ?? '/odak') as '/odak');
    return true;
  },
};
