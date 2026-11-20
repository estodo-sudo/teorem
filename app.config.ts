import type { ExpoConfig } from 'expo/config';

import {
  ANDROID_PACKAGE,
  APP_NAME,
  APP_SCHEME,
  APP_SLUG,
  APP_VERSION,
  EAS_PROJECT_ID,
  IOS_BUNDLE_ID,
} from './src/config/app.ts';

const config: ExpoConfig = {
  name: APP_NAME,
  slug: APP_SLUG,
  version: APP_VERSION,
  scheme: APP_SCHEME,
  // Web is only built for browser previews (WEB_PREVIEW=1); the product is iOS + Android.
  platforms: process.env.WEB_PREVIEW === '1' ? ['ios', 'android', 'web'] : ['ios', 'android'],
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
    output: 'single',
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
    'expo-font',
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
    // Sigarasız Kamp: an optional "my reasons" photo (stays on the device) and saving ALO 171 to contacts.
    [
      'expo-image-picker',
      {
        photosPermission: 'Bırakma nedenlerine kendi fotoğrafını eklemek için galerine erişim gerekiyor. Fotoğraf yalnızca cihazında saklanır.',
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    // Sigarasız Kamp: "Canım çekiyor" home-screen shortcut (iOS Quick Action / Android shortcut).
    'expo-quick-actions',
    [
      'expo-contacts',
      {
        contactsPermission: 'ALO 171 Sigara Bırakma Danışma Hattı numarasını rehberine kaydetmek için rehber erişimi gerekiyor.',
      },
    ],
    // Odak Kampı privacy: camp lock (Face ID / fingerprint / device code) and the keychain-held vault key.
    // Neutral wording: the permission text never names the camp's topic.
    // Odak Kampı (Android): periodic risky-hour reminder check.
    'expo-background-task',
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Kilitli bölümleri Face ID ile açmak için kullanılır.',
      },
    ],
    [
      'expo-secure-store',
      {
        faceIDPermission: 'Kilitli bölümleri Face ID ile açmak için kullanılır.',
      },
    ],
  ],
  // EAS Update is used only to preview test versions in Expo Go during
  // development. The app never checks for updates on its own ('NEVER'), so
  // store builds make no update requests (offline / no-network promise).
  runtimeVersion: { policy: 'sdkVersion' },
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    checkAutomatically: 'NEVER',
    fallbackToCacheTimeout: 0,
  },
  extra: {
    eas: { projectId: EAS_PROJECT_ID },
  },
  experiments: {
    typedRoutes: true,
  },
};

export default config;
