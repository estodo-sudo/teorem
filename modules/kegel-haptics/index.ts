import { Platform, requireOptionalNativeModule } from 'expo';

/**
 * Kegel haptics native module (modules/kegel-haptics), Android only: amplitude waveforms (real rising and
 * falling ramps). iOS uses expo-haptics (built in, no untested native code). Missing in Expo Go and on
 * web — `kegelHapticsNative` is then null and the caller falls back.
 */
export interface KegelHapticsNative {
  isSupported(): boolean;
  hasAmplitudeControl(): boolean;
  vibrateWaveform(timings: number[], amplitudes: number[]): void;
  vibratePattern(pattern: number[]): void;
  cancel(): void;
}

export const kegelHapticsNative = Platform.OS === 'android' ? requireOptionalNativeModule<KegelHapticsNative>('KegelHaptics') : null;
