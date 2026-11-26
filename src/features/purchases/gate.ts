import {
  DEV_BYPASS_PAYWALL,
  FREEMIUM_MAX_LEVEL,
  PAYWALL_MODE,
  type PaywallMode,
} from '@/config/monetization';

/**
 * `camp`: Sigarasız Kamp premium parts (its crisis tools, counters and help lines are always free).
 * `odak`: Odak Kampı premium parts (SOS, slip flow, support, library and the basic counter are always free).
 */
export type GatedFeature = 'workout' | 'round2' | 'fitness' | 'courses' | 'stories' | 'mind' | 'strengthTest' | 'camp' | 'odak' | 'progress' | 'discover';

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
 *  hard     — tutorial and Tur 1 every day free (2026-11-26: those who close the paywall keep the day's
 *             first half); Tur 2, Kasık Fitness, İlerleme, Keşfet and everything else need premium.
 *  freemium — base plan (levels ≤ FREEMIUM_MAX_LEVEL), stories, mind tools and
 *             strength test free; higher levels, courses and fitness premium.
 * Progress, settings, legal pages are always free.
 */
export function hasAccess(feature: GatedFeature, c: GateContext): boolean {
  if (c.entitled || c.devBypass) return true;
  if (c.mode === 'hard') return feature === 'workout';
  switch (feature) {
    case 'workout':
    case 'round2':
      return c.level <= FREEMIUM_MAX_LEVEL;
    case 'stories':
    case 'mind':
    case 'strengthTest':
    case 'progress':
    case 'discover':
      return true;
    case 'courses':
    case 'fitness':
    case 'camp':
    case 'odak':
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
