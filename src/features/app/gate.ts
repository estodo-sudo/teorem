import type { UserProfile } from '@/types';

export type GateRoute = '/consent' | '/intro/anatomy' | '/onboarding' | '/tutorial';

/** Where a user who hasn't finished first-run setup must be sent (null = free to roam). */
export function requiredFirstRunRoute(p: Pick<UserProfile, 'disclaimerAcceptedAt' | 'onboardingDone' | 'tutorialDone' | 'introAnatomySeen'>): GateRoute | null {
  if (!p.disclaimerAcceptedAt) return '/consent';
  // The anatomy animation comes right after the welcome (consent) screen, only during setup: people
  // who finished onboarding before it existed are never sent back to it.
  if (!p.onboardingDone && !p.introAnatomySeen) return '/intro/anatomy';
  if (!p.onboardingDone) return '/onboarding';
  if (!p.tutorialDone) return '/tutorial';
  return null;
}

/** Top-level route segments reachable before first-run setup is complete. */
const ALLOWED: Record<GateRoute, string[]> = {
  '/consent': ['consent', 'legal'],
  '/intro/anatomy': ['intro', 'legal'],
  // `intro`: "Geç" saves the animation as seen, but the user stays on it until a closing button.
  '/onboarding': ['onboarding', 'intro', 'legal'],
  // Kegel v2: the muscle profile screening comes right before the tutorial (kegel/screening).
  '/tutorial': ['tutorial', 'kegel', 'legal'],
};

export function isAllowedDuringFirstRun(gate: GateRoute, firstSegment: string | undefined): boolean {
  return !!firstSegment && ALLOWED[gate].includes(firstSegment);
}
