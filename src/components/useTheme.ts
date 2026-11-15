import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type Theme } from '@/config/theme';
import { useSettingsStore } from '@/stores/settingsStore';

export function useTheme(): Theme {
  const pref = useSettingsStore((s) => s.settings.theme);
  const system = useColorScheme();
  const dark = pref === 'dark' || (pref === 'system' && system === 'dark');
  return dark ? darkTheme : lightTheme;
}
