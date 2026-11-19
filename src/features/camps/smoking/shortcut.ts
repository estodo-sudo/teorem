import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useOdakLockStore } from '@/features/camps/odak/privacy/lockStore';
import { useCampStore } from '@/stores/campStore';

/**
 * Home-screen shortcut (iOS Quick Action / Android app shortcut) that opens the camp's SOS screen
 * in one tap. Shown only once the user has joined the camp. The title never mentions smoking, so
 * it stays discreet. In Expo Go the native module is missing and these calls quietly do nothing.
 */
export function useCampShortcut() {
  const { t: tr } = useTranslation();
  const joined = useCampStore((s) => s.profile !== null);
  // Odak Kampı: neutral name only ("Odak"); the SOS opens behind the camp lock.
  const odak = useOdakLockStore((s) => s.enrolled);
  useQuickActionRouting();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const items: QuickActions.Action[] = [];
    if (joined) items.push({ id: 'camp-sos', title: tr('camp.sos.shortcut'), subtitle: tr('camp.sos.shortcutSub'), icon: Platform.OS === 'ios' ? 'symbol:wind' : undefined, params: { href: '/camp/sos' } });
    if (odak) items.push({ id: 'odak-sos', title: tr('odak.shortcut'), icon: Platform.OS === 'ios' ? 'symbol:scope' : undefined, params: { href: '/odak/sos' } });
    void QuickActions.setItems(items).catch(() => undefined);
  }, [joined, odak, tr]);
}
