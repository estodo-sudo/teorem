import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCampStore } from '@/stores/campStore';

/**
 * Home-screen shortcut (iOS Quick Action / Android app shortcut) that opens the camp's SOS screen
 * in one tap. Shown only once the user has joined the camp. The title never mentions smoking, so
 * it stays discreet. In Expo Go the native module is missing and these calls quietly do nothing.
 */
export function useCampShortcut() {
  const { t: tr } = useTranslation();
  const joined = useCampStore((s) => s.profile !== null);
  useQuickActionRouting();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    void QuickActions.setItems(
      joined
        ? [
            {
              id: 'camp-sos',
              title: tr('camp.sos.shortcut'),
              subtitle: tr('camp.sos.shortcutSub'),
              icon: Platform.OS === 'ios' ? 'symbol:wind' : undefined,
              params: { href: '/camp/sos' },
            },
          ]
        : [],
    ).catch(() => undefined);
  }, [joined, tr]);
}
