import {
  DEV_BYPASS_PAYWALL,
  FREEMIUM_MAX_LEVEL,
  HARD_MODE_FREE_WORKOUTS,
  PAYWALL_MODE,
  type PaywallMode,
} from '@/config/monetization';

/** `camp`: Sigarasız Kamp premium parts (its crisis tools, counters and help lines are always free). */
export type GatedFeature = 'workout' | 'fitness' | 'courses' | 'stories' | 'mind' | 'strengthTest' | 'camp';

export interface GateContext {
  mode: PaywallMode;
  entitled: boolean;
  /** Completed main workouts so far. */
  completedWorkouts: number;
  level: number;
  devBypass: boolean;
}

/**
 * Access rules:
 *  hard     — tutorial + first workout free; everything else needs premium.
 *  freemium — base plan (levels ≤ FREEMIUM_MAX_LEVEL), stories, mind tools and
 *             strength test free; higher levels, courses and fitness premium.
 * Progress, settings, legal pages are always free.
 */
export function hasAccess(feature: GatedFeature, c: GateContext): boolean {
  if (c.entitled || c.devBypass) return true;
  if (c.mode === 'hard') {
    return feature === 'workout' && c.completedWorkouts < HARD_MODE_FREE_WORKOUTS;
  }
  switch (feature) {
    case 'workout':
      return c.level <= FREEMIUM_MAX_LEVEL;
    case 'stories':
    case 'mind':
    case 'strengthTest':
      return true;
    case 'courses':
    case 'fitness':
    case 'camp':
      return false;
  }
}

export const defaultGateContext = (patch: Partial<GateContext>): GateContext => ({
  mode: PAYWALL_MODE,
  entitled: false,
  completedWorkouts: 0,
  level: 1,
  devBypass: DEV_BYPASS_PAYWALL,
  ...patch,
});
