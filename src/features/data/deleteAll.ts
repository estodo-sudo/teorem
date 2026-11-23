import { Directory, Paths } from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useBreathStore } from '@/features/breath/store';
import { syncReminderTask } from '@/features/camps/odak/boundaries/reminderTask';
import { useOdakStore } from '@/features/camps/odak/store';
import { useSettingsStore } from '@/stores/settingsStore';

import { wipeApp } from './appData';

/**
 * "Verilerimi ve hesabımı sil" (user request 2026-11-22). The app has no server account, so deleting
 * the "account" means deleting everything it ever kept on this phone, for real:
 *  - every store (profile, settings, training, history, camps, content, entitlement cache…),
 *  - the Odak Kampı vault rows, its AES key and the PIN in the keychain / keystore,
 *  - the private files (camp reason photos, exported JSON copies in the cache),
 *  - every scheduled reminder and the Odak background check (Android),
 *  - the breath preferences.
 * The chosen language is kept, so the start screens appear in the language the user just used.
 * Each step runs even if another fails. Store subscriptions are NOT cancelled by this (they belong to
 * the user's Apple / Google account); the screen says so.
 */
export async function deleteAllData(): Promise<void> {
  const language = useSettingsStore.getState().settings.language;
  wipeApp();
  useBreathStore.getState().reset();
  useSettingsStore.getState().update({ language });
  await Promise.allSettled([useOdakStore.getState().wipe(), cancelReminders(), deletePrivateFiles(), syncReminderTask(false)]);
}

async function cancelReminders() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.dismissAllNotificationsAsync();
}

async function deletePrivateFiles() {
  if (Platform.OS === 'web') return;
  try {
    const photos = new Directory(Paths.document, 'camp');
    if (photos.exists) photos.delete();
  } catch {
    // best effort: a missing folder is already deleted
  }
  try {
    for (const item of Paths.cache.list()) item.delete();
  } catch {
    // best effort
  }
}
