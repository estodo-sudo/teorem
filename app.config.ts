import type { ExpoConfig } from 'expo/config';
import { withInfoPlist, type ConfigPlugin } from 'expo/config-plugins';

import {
  ANDROID_PACKAGE,
  APP_NAME,
  APP_SCHEME,
  APP_SLUG,
  APP_VERSION,
  EAS_PROJECT_ID,
  IOS_BUNDLE_ID,
} from './src/config/app.ts';

/**
 * App Store review (2026-11-23): expo-background-task declares the iOS "processing" background mode, but
 * the Odak reminder task runs on Android only. Apple rejects unused background modes (guideline 2.5.4),
 * so the mode and its task identifier are removed from the iOS build.
 */
const withoutUnusedIosBackgroundMode: ConfigPlugin = (c) =>
  withInfoPlist(c, (cfg) => {
    // 'fetch' comes from expo-task-manager (used by the same Android-only task).
    const modes = (cfg.modResults.UIBackgroundModes as string[] | undefined)?.filter((m) => m !== 'processing' && m !== 'fetch');
    if (modes?.length) cfg.modResults.UIBackgroundModes = modes;
    else delete cfg.modResults.UIBackgroundModes;
    const ids = (cfg.modResults.BGTaskSchedulerPermittedIdentifiers as string[] | undefined)?.filter((id) => !id.startsWith('com.expo.modules.backgroundtask'));
    if (ids?.length) cfg.modResults.BGTaskSchedulerPermittedIdentifiers = ids;
    else delete cfg.modResults.BGTaskSchedulerPermittedIdentifiers;
    return cfg;
  });

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
  // Permission texts in the app's languages: an English-speaking reviewer must be able to read why each
  // permission is asked (App Store guideline 5.1.1).
  locales: { tr: './locales/tr.json', en: './locales/en.json' },
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
    // Data stays on the phone (privacy policy): no Android Auto Backup to Google Drive.
    allowBackup: false,
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
    ['expo-screen-orientation', { initialOrientation: 'PORTRAIT_UP' }],
    'expo-localization',
    'expo-sharing',
    // Playback only, in the foreground: no microphone, no background audio (App Store 2.5.4 / 5.1.1,
    // Play foreground-service rules). The app never records sound.
    ['expo-audio', { microphonePermission: false, recordAudioAndroid: false, enableBackgroundPlayback: false }],
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

// Registered before the `plugins` list is applied; mods run in reverse order, so this one runs last.
export default withoutUnusedIosBackgroundMode(config);
