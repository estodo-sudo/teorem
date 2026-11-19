import type { UserProfile } from '@/types';

export type GateRoute = '/consent' | '/onboarding' | '/tutorial';

/** Where a user who hasn't finished first-run setup must be sent (null = free to roam). */
export function requiredFirstRunRoute(p: Pick<UserProfile, 'disclaimerAcceptedAt' | 'onboardingDone' | 'tutorialDone'>): GateRoute | null {
  if (!p.disclaimerAcceptedAt) return '/consent';
  if (!p.onboardingDone) return '/onboarding';
  if (!p.tutorialDone) return '/tutorial';
  return null;
}

/** Top-level route segments reachable before first-run setup is complete. */
const ALLOWED: Record<GateRoute, string[]> = {
  '/consent': ['consent', 'legal'],
  '/onboarding': ['onboarding', 'legal'],
  // Kegel v2: the muscle profile screening comes right before the tutorial (kegel/screening).
  '/tutorial': ['tutorial', 'kegel', 'legal'],
};

export function isAllowedDuringFirstRun(gate: GateRoute, firstSegment: string | undefined): boolean {
  return !!firstSegment && ALLOWED[gate].includes(firstSegment);
}
