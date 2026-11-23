import type { Program, Workout } from './program';

/**
 * Baldır programmes (2026-11-22). Built from:
 *  - calf raises in the lengthened (heel-down) range grew the gastrocnemius most over 8 weeks
 *    (Kassiano et al. 2023; follow-ups 2025 mixed but supportive) — so step raises with the heel
 *    below the step from the second phase on;
 *  - knee bend lowers gastrocnemius activity, soleus effect small — straight and bent-knee raises both;
 *  - slow eccentric heel drops (Alfredson-style) for the Achilles tendon;
 *  - tibialis raises to balance the front of the shin; stretches to close; hops only from Geliştir.
 * In Güçlendir the third workout (C) is a lighter day.
 */

const w = (id: string, moves: string[], workSec: number, restSec: number, rounds: number, roundRestSec = 60): Workout => ({ id, moves, workSec, restSec, rounds, roundRestSec });

/** 30 days, 3 a week (days 1, 3, 5), about 10 minutes. */
const toparla: Program = {
  id: 'toparla',
  days: 30,
  trainDays: [0, 2, 4],
  phases: [
    {
      fromWeek: 1,
      toWeek: 2,
      workouts: [w('A', ['calf_raise', 'seated_calf_raise', 'tibialis_raise', 'bent_knee_calf_raise', 'calf_stretch_wall'], 30, 30, 2), w('B', ['calf_raise', 'calf_raise_hold', 'seated_calf_raise', 'tibialis_raise', 'downdog_calf_pedal'], 30, 30, 2)],
    },
    {
      fromWeek: 3,
      toWeek: 5,
      workouts: [w('A', ['step_calf_raise', 'bent_knee_calf_raise', 'tibialis_raise', 'single_leg_calf_raise', 'calf_stretch_wall'], 40, 20, 2), w('B', ['calf_raise', 'jump_rope', 'seated_calf_raise', 'tibialis_raise', 'downdog_calf_pedal'], 40, 20, 2)],
    },
  ],
};

/** 60 days, 4 a week (days 1, 2, 4, 5), about 16 minutes; weeks 4 and 8 lighter. */
const gelistir: Program = {
  id: 'gelistir',
  days: 60,
  trainDays: [0, 1, 3, 4],
  lightEvery: 4,
  phases: [
    {
      fromWeek: 1,
      toWeek: 4,
      workouts: [w('A', ['step_calf_raise', 'single_leg_calf_raise', 'bent_knee_calf_raise', 'tibialis_raise', 'calf_stretch_wall'], 40, 20, 3, 45), w('B', ['jump_rope', 'slow_eccentric_raise', 'calf_raise_hold', 'tibialis_raise', 'downdog_calf_pedal'], 40, 20, 3, 45)],
    },
    {
      fromWeek: 5,
      toWeek: 9,
      workouts: [w('A', ['pogo_hops', 'step_calf_raise', 'single_leg_calf_raise', 'tibialis_raise', 'calf_stretch_wall'], 45, 15, 3, 45), w('B', ['jump_rope', 'slow_eccentric_raise', 'bent_knee_calf_raise', 'tibialis_raise', 'downdog_calf_pedal'], 45, 15, 3, 45)],
    },
  ],
};

/** 90 days, 5 a week (days 1–3, 5, 6), about 20 minutes; weeks 4, 8 and 12 lighter; C = lighter day. */
const guclendir: Program = {
  id: 'guclendir',
  days: 90,
  trainDays: [0, 1, 2, 4, 5],
  lightEvery: 4,
  phases: [
    {
      fromWeek: 1,
      toWeek: 4,
      workouts: [
        w('A', ['jump_rope', 'step_calf_raise', 'single_leg_calf_raise', 'bent_knee_calf_raise', 'tibialis_raise', 'calf_stretch_wall'], 45, 15, 3),
        w('B', ['pogo_hops', 'slow_eccentric_raise', 'seated_calf_raise', 'calf_raise_hold', 'tibialis_raise', 'downdog_calf_pedal'], 45, 15, 3),
        w('C', ['calf_raise', 'seated_calf_raise', 'tibialis_raise', 'bent_knee_calf_raise', 'calf_stretch_wall', 'downdog_calf_pedal'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 5,
      toWeek: 8,
      workouts: [
        w('A', ['pogo_hops', 'step_calf_raise', 'single_leg_calf_raise', 'bent_knee_calf_raise', 'tibialis_raise', 'calf_stretch_wall'], 50, 10, 3),
        w('B', ['jump_rope', 'slow_eccentric_raise', 'single_leg_calf_raise', 'calf_raise_hold', 'tibialis_raise', 'downdog_calf_pedal'], 50, 10, 3),
        w('C', ['calf_raise', 'seated_calf_raise', 'tibialis_raise', 'bent_knee_calf_raise', 'calf_stretch_wall', 'downdog_calf_pedal'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 9,
      toWeek: 13,
      workouts: [
        w('A', ['pogo_hops', 'step_calf_raise', 'single_leg_calf_raise', 'bent_knee_calf_raise', 'jump_rope', 'tibialis_raise', 'calf_stretch_wall'], 50, 10, 3),
        w('B', ['jump_rope', 'slow_eccentric_raise', 'single_leg_calf_raise', 'calf_raise_hold', 'pogo_hops', 'tibialis_raise', 'downdog_calf_pedal'], 50, 10, 3),
        w('C', ['calf_raise', 'seated_calf_raise', 'tibialis_raise', 'bent_knee_calf_raise', 'calf_stretch_wall', 'downdog_calf_pedal'], 45, 15, 3),
      ],
    },
  ],
};

export const BALDIR_PROGRAMS: Program[] = [toparla, gelistir, guclendir];
