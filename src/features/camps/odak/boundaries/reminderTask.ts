import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { foregroundEvents, hasUsageAccess, usageAvailable } from '../../../../../modules/odak-usage';
import { ODAK_BOUNDARIES } from '../content';
import { pruneKeys, reminderDue } from '../engine/boundaries';
import { odakVault } from '../privacy/device';
import type { BoundaryConfig, OdakProfile } from '../types';

/**
 * Android risky-hour reminder (SPEC_ODAK_KAMPI 5.3). About every 15 minutes the system runs this
 * check: if one of the chosen apps came to the foreground during a risky hour since the last check,
 * one neutral "Odak zamanı" notification goes out for that range (at most once a day per range).
 * Everything is read from the encrypted vault and stays on the phone.
 */
export const ODAK_REMINDER_TASK = 'odak-risky-hour-reminder';
/** First check looks back this far. */
const FIRST_LOOKBACK_MS = 20 * 60_000;

interface ReminderState {
  lastCheck: number;
  sentKeys: string[];
}

export async function runReminderCheck(now = new Date()): Promise<boolean> {
  if (Platform.OS !== 'android' || !usageAvailable || !hasUsageAccess()) return false;
  const v = odakVault();
  const { docs } = await v.load();
  const b = docs.boundaries as BoundaryConfig | undefined;
  const profile = docs.profile as OdakProfile | undefined;
  if (!b?.reminder.enabled || !b.reminder.packages.length || !profile?.riskyHours.length) return false;
  const st = (docs.reminderState as ReminderState | undefined) ?? { lastCheck: now.getTime() - FIRST_LOOKBACK_MS, sentKeys: [] };
  const events = await foregroundEvents(st.lastCheck, now.getTime());
  const key = reminderDue({ events, packages: b.reminder.packages, ranges: profile.riskyHours, sentKeys: st.sentKeys });
  if (key) {
    const r = ODAK_BOUNDARIES.reminder;
    await Notifications.scheduleNotificationAsync({ content: { title: r.notifTitle, body: r.notifBody, data: { kind: 'odak', route: '/odak/sos' } }, trigger: null });
  }
  await v.setDoc('reminderState', { lastCheck: now.getTime(), sentKeys: pruneKeys(key ? [...st.sentKeys, key] : st.sentKeys, now) } satisfies ReminderState);
  return key !== null;
}

if (Platform.OS === 'android') {
  TaskManager.defineTask(ODAK_REMINDER_TASK, async () => {
    try {
      await runReminderCheck();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

/** Registers or removes the periodic check to match the setting. */
export async function syncReminderTask(enabled: boolean): Promise<void> {
  if (Platform.OS !== 'android' || !usageAvailable) return;
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(ODAK_REMINDER_TASK);
    if (enabled && !registered) await BackgroundTask.registerTaskAsync(ODAK_REMINDER_TASK, { minimumInterval: 15 });
    if (!enabled && registered) await BackgroundTask.unregisterTaskAsync(ODAK_REMINDER_TASK);
  } catch {
    // Background work is optional; the rest of the camp works without it.
  }
}
