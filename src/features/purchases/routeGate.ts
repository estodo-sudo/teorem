import type { GatedFeature } from './gate';

/**
 * Route-level paywall (security review 2026-11-23). Buttons already check access with `openGated`, but
 * a link such as `pelvikapp://fitness/x` or a notification tap opens the screen directly. The root
 * layout asks this map whenever the user ENTERS one of these areas from somewhere else; moving inside
 * an area (workout → round 2 → feedback, one story → the next) is not checked again, so a session that
 * was allowed when it started is never cut off halfway.
 *
 * 'soon' = a programme marked "Yakında": not open yet for anyone.
 */
export type RouteRule = GatedFeature | 'soon';

export function premiumRuleFor(segments: readonly string[]): RouteRule | null {
  const [top, second] = segments;
  switch (top) {
    case 'workout':
      // Only the player itself; feedback / next / round2-intro follow a session that was already allowed.
      return second === '[sessionId]' ? 'workout' : null;
    case 'fitness':
      return 'fitness';
    case 'story':
      return 'stories';
    case 'strength-test':
      return 'strengthTest';
    case 'campus':
      return 'courses';
    case 'bodyweight':
      return 'soon';
    default:
      return null;
  }
}

/** Check only when the top-level area changes (entering from outside, or a cold-start link). */
export const needsRouteCheck = (fromTop: string | undefined, toTop: string | undefined) => fromTop !== toTop;
