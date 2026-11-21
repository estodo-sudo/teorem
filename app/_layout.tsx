import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useSegments, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useTheme } from '@/components';
import { AppEffects } from '@/features/app/AppEffects';
import { ErrorScreen } from '@/features/app/ErrorScreen';
import { isAllowedDuringFirstRun, requiredFirstRunRoute } from '@/features/app/gate';
import { setLanguage } from '@/i18n';
import '@/features/camps/odak/boundaries/reminderTask';
import { useCampEventsStore } from '@/stores/campStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';

export default function RootLayout() {
  const theme = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const language = useSettingsStore((s) => s.settings.language);
  // SQLite history is small; load it synchronously before first render.
  useState(() => {
    useHistoryStore.getState().load();
    useCampEventsStore.getState().load();
    return true;
  });
  useEffect(() => setLanguage(language), [language]);

  // First-run gate: consent → onboarding → tutorial. Any other route (including
  // deep links and notification taps) is redirected until setup is complete.
  const segments = useSegments();
  const gate = requiredFirstRunRoute(profile);
  // Developer-only frames (app/dev, `__DEV__` builds) open without the first-run setup.
  const devFrame = __DEV__ && segments[0] === 'dev';
  const blocked = gate !== null && !devFrame && !isAllowedDuringFirstRun(gate, segments[0]);
  useEffect(() => {
    if (gate && blocked) router.replace(gate);
  }, [gate, blocked]);

  // Inter ships inside the app bundle (assets), nothing is fetched from the network.
  const [fontsReady, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const navTheme = theme.dark ? DarkTheme : DefaultTheme;
  // Native: the bundled faces load in a few ms, so wait for them (no flash of the system font).
  // Web preview: render at once and let the faces swap in.
  if (!fontsReady && !fontError && Platform.OS !== 'web') return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider
        value={{
          ...navTheme,
          colors: {
            ...navTheme.colors,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.text,
            border: theme.colors.border,
            primary: theme.colors.primary,
          },
        }}
      >
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="consent" options={{ gestureEnabled: false }} />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="tutorial" options={{ gestureEnabled: false }} />
          <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="workout/[sessionId]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="workout/feedback" options={{ gestureEnabled: false }} />
          <Stack.Screen name="strength-test" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="fitness/[routineId]" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="story/[storyId]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="campus/neck/routine" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="campus/feet/routine" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="camp/sos" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="camp/log-cigarette" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="camp/checkin" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="camp/slip" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
        <AppEffects />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Friendly fallback for unexpected render errors (no crash reporting: nothing leaves the device). */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ErrorScreen error={error} onRetry={retry} />;
}
