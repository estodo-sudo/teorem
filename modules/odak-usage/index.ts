import { Platform, requireOptionalNativeModule } from 'expo';

/**
 * Odak Kampı – Android usage reminder native module (modules/odak-usage). Missing in Expo Go and on
 * iOS / web: every call then reports "unavailable" instead of throwing.
 */
interface OdakUsageNative {
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): void;
  openDigitalWellbeing(): boolean;
  launchableApps(): Promise<{ packageName: string; label: string }[]>;
  foregroundEvents(fromMs: number, toMs: number): Promise<{ packageName: string; at: number }[]>;
}

const native = Platform.OS === 'android' ? requireOptionalNativeModule<OdakUsageNative>('OdakUsage') : null;

export const usageAvailable = native !== null;
export const hasUsageAccess = () => {
  try {
    return native?.hasUsageAccess() ?? false;
  } catch {
    return false;
  }
};
export const openUsageAccessSettings = () => native?.openUsageAccessSettings();
/** True when Digital Wellbeing itself opened (otherwise the main settings). */
export const openDigitalWellbeing = () => native?.openDigitalWellbeing() ?? false;
export const launchableApps = async () => (native ? await native.launchableApps() : []);
export const foregroundEvents = async (fromMs: number, toMs: number) => (native ? await native.foregroundEvents(fromMs, toMs) : []);
