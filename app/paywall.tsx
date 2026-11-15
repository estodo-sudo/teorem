import { router } from 'expo-router';

import { AppText, Button, Screen } from '@/components';

/** Placeholder — implemented in M11. */
export default function Paywall() {
  return (
    <Screen footer={<Button label="OK" onPress={() => router.replace('/')} />}>
      <AppText variant="h1">Premium</AppText>
    </Screen>
  );
}
