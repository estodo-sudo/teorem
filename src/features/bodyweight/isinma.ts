import type { Workout } from './program';

/**
 * Isınma: one 10-minute dynamic warm-up, no 30/60/90 programmes (user request 2026-11-22). Built from:
 *  - dynamic warm-ups are favoured over long static stretching before exercise; the acute effect of
 *    dynamic stretching alone is small (Sports Med 2023 review; Behm et al. 2016);
 *  - multi-component warm-ups (raise the pulse → mobilise → activate, e.g. FIFA 11+) are the ones
 *    linked to fewer injuries — so the order is: pulse, joints, then light strength moves, then pulse again.
 * 12 moves × (40 s work + 10 s rest), one round ≈ 10 minutes.
 */
export const ISINMA_ROUTINE: Workout = {
  id: 'A',
  moves: ['march_in_place', 'arm_circles', 'step_jack', 'torso_twist', 'leg_swings', 'cat_cow', 'inchworm', 'squat', 'reverse_lunge', 'glute_bridge', 'butt_kicks', 'high_knees'],
  workSec: 40,
  restSec: 10,
  rounds: 1,
  roundRestSec: 0,
};
