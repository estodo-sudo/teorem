import { DevSettings, Platform } from 'react-native';

/**
 * Restarts the JavaScript app (used after a language change: bundled content is chosen at start-up).
 * Store builds and Expo Go use expo-updates; development falls back to DevSettings; web reloads the page.
 */
export async function reloadApp(): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.location?.reload();
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Updates = require('expo-updates') as typeof import('expo-updates');
    await Updates.reloadAsync();
  } catch {
    DevSettings.reload();
  }
}
