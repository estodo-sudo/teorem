import type { ExpoConfig } from 'expo/config';

import {
  ANDROID_PACKAGE,
  APP_NAME,
  APP_SCHEME,
  APP_SLUG,
  APP_VERSION,
  IOS_BUNDLE_ID,
} from './src/config/app.ts';

const config: ExpoConfig = {
  name: APP_NAME,
  slug: APP_SLUG,
  version: APP_VERSION,
  scheme: APP_SCHEME,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#0B1D2E',
  ios: {
    supportsTablet: false,
    bundleIdentifier: IOS_BUNDLE_ID,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: ANDROID_PACKAGE,
    adaptiveIcon: {
      backgroundColor: '#0B1D2E',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    // Only what we need: vibration for haptic guidance, billing for IAP,
    // notifications for local reminders. No INTERNET-based SDKs.
    permissions: ['VIBRATE', 'com.android.vending.BILLING', 'POST_NOTIFICATIONS'],
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: '#0B1D2E',
      },
    ],
    'expo-sqlite',
    'expo-localization',
    'expo-sharing',
    'expo-audio',
    [
      'expo-notifications',
      {
        color: '#F26B1D',
      },
    ],
    'expo-iap',
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
