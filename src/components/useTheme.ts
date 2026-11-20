import { createContext, createElement, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type Theme } from '@/config/theme';
import { useSettingsStore } from '@/stores/settingsStore';

const Override = createContext<Theme | null>(null);

/** Forces a theme for a subtree — e.g. the always-dark Kegel player and SOS screens. */
export function ThemeOverride({ dark, children }: { dark: boolean; children: ReactNode }) {
  return createElement(Override.Provider, { value: dark ? darkTheme : lightTheme }, children);
}

export function useTheme(): Theme {
  const forced = useContext(Override);
  const pref = useSettingsStore((s) => s.settings.theme);
  const system = useColorScheme();
  if (forced) return forced;
  const dark = pref === 'dark' || (pref === 'system' && system === 'dark');
  return dark ? darkTheme : lightTheme;
}
