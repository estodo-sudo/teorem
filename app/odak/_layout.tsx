import { Stack } from 'expo-router';

import { useTheme } from '@/components';
import { PrivacyGate } from '@/features/camps/odak/privacy/PrivacyGate';

/** Odak Kampı: every screen sits behind the privacy layer (lock, cover, quick exit). */
export default function OdakLayout() {
  const t = useTheme();
  return (
    <PrivacyGate>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.background } }}>
        <Stack.Screen name="sos" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </PrivacyGate>
  );
}
