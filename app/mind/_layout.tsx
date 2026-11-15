import { Stack } from 'expo-router';

export default function MindLayout() {
  return <Stack screenOptions={{ headerShown: false, presentation: 'fullScreenModal' }} />;
}
