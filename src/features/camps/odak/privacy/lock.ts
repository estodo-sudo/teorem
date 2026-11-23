/**
 * Camp lock rules (pure). The camp opens with the device lock (Face ID / fingerprint / device code);
 * on a phone without any lock the user sets an app PIN instead. The camp locks again whenever the
 * app goes to the background.
 */
export const PIN_MIN = 4;
export const PIN_MAX = 6;
/** Wrong PINs allowed before a wait. */
export const FREE_ATTEMPTS = 5;
const BASE_WAIT_MS = 30_000;
const MAX_WAIT_MS = 15 * 60_000;

export const validPin = (pin: string) => new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`).test(pin);

/** Wait after `failures` wrong PINs: none for the first five, then 30 s doubling, at most 15 min. */
export function lockoutMs(failures: number): number {
  if (failures < FREE_ATTEMPTS) return 0;
  return Math.min(MAX_WAIT_MS, BASE_WAIT_MS * 2 ** (failures - FREE_ATTEMPTS));
}

/** Milliseconds left before the next PIN try (0 = can try now). */
export function waitLeft(failures: number, lastFailAt: number | null, now: number): number {
  if (lastFailAt === null) return 0;
  // Clock set back after a wrong PIN (or a wrong saved time): the wait is the normal one, never
  // months or years that would lock the owner out (security review 2026-11-23).
  if (now < lastFailAt) return lockoutMs(failures);
  return Math.max(0, lastFailAt + lockoutMs(failures) - now);
}

export type UnlockMethod = 'device' | 'pin' | 'setupPin';

/** How the camp is unlocked: device lock when the phone has one, else the app PIN (set it first). */
export function unlockMethod(deviceSecured: boolean, hasPin: boolean): UnlockMethod {
  if (deviceSecured) return 'device';
  return hasPin ? 'pin' : 'setupPin';
}

/** App state change → lock? Going to the background always locks. */
export const locksOn = (next: string) => next === 'background';

/** Whether the content must be covered: in the app switcher / during interruptions (iOS 'inactive'). */
export const coversOn = (state: string) => state !== 'active';
