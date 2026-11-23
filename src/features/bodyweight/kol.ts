import type { Program, Workout } from './program';

/**
 * Kol programmes (2026-11-22). Built from:
 *  - triceps: diamond push-ups among the highest triceps activation; bench (chair) dips a good start,
 *    weaker than bar dips (McKenzie et al. 2022; ACE-sponsored EMG thesis; Muscles 2026);
 *  - biceps without equipment: the lowering (eccentric) part matters most for gains (Nosaka 2022), so
 *    curls are slow on the way down; self-resistance training raised strength and arm girth in a small
 *    study; isometric holds at long muscle length favoured for growth (Oranchuk et al. 2019);
 *  - every workout pairs a pushing (triceps) and a pulling (biceps) move.
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
      workouts: [w('A', ['arm_circles', 'wall_triceps_press', 'self_resist_curl', 'chair_dips', 'door_curl_hold'], 30, 30, 2), w('B', ['arm_circles', 'knee_diamond_pushup', 'self_resist_curl', 'wall_triceps_press', 'door_curl_hold'], 30, 30, 2)],
    },
    {
      fromWeek: 3,
      toWeek: 5,
      workouts: [w('A', ['arm_circles', 'chair_dips', 'self_resist_curl', 'knee_diamond_pushup', 'table_row_underhand'], 40, 20, 2), w('B', ['arm_circles', 'plank_up_down', 'door_curl_hold', 'chair_dips', 'self_resist_curl'], 40, 20, 2)],
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
      workouts: [w('A', ['arm_circles', 'chair_dips', 'table_row_underhand', 'knee_diamond_pushup', 'self_resist_curl'], 40, 20, 3, 45), w('B', ['arm_circles', 'plank_up_down', 'door_curl_hold', 'pike_pushup', 'table_row_underhand'], 40, 20, 3, 45)],
    },
    {
      fromWeek: 5,
      toWeek: 9,
      workouts: [w('A', ['arm_circles', 'diamond_pushup', 'table_row_underhand', 'chair_dips_straight', 'self_resist_curl'], 45, 15, 3, 45), w('B', ['arm_circles', 'plank_up_down', 'door_curl_hold', 'pushup_hold', 'table_row_underhand'], 45, 15, 3, 45)],
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
        w('A', ['arm_circles', 'diamond_pushup', 'table_row_underhand', 'chair_dips_straight', 'self_resist_curl', 'pushup_hold'], 45, 15, 3),
        w('B', ['arm_circles', 'plank_up_down', 'door_curl_hold', 'pike_pushup', 'table_row_underhand', 'chair_dips'], 45, 15, 3),
        w('C', ['arm_circles', 'wall_triceps_press', 'self_resist_curl', 'knee_diamond_pushup', 'door_curl_hold', 'chair_dips'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 5,
      toWeek: 8,
      workouts: [
        w('A', ['arm_circles', 'diamond_pushup', 'table_row_underhand', 'chair_dips_straight', 'self_resist_curl', 'pushup_hold'], 50, 10, 3),
        w('B', ['arm_circles', 'plank_up_down', 'door_curl_hold', 'pike_pushup', 'table_row_underhand', 'diamond_pushup'], 50, 10, 3),
        w('C', ['arm_circles', 'wall_triceps_press', 'self_resist_curl', 'chair_dips', 'door_curl_hold', 'plank_up_down'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 9,
      toWeek: 13,
      workouts: [
        w('A', ['arm_circles', 'diamond_pushup', 'table_row_underhand', 'chair_dips_straight', 'self_resist_curl', 'pushup_hold', 'door_curl_hold'], 50, 10, 3),
        w('B', ['arm_circles', 'plank_up_down', 'table_row_underhand', 'pike_pushup', 'self_resist_curl', 'diamond_pushup', 'chair_dips_straight'], 50, 10, 3),
        w('C', ['arm_circles', 'wall_triceps_press', 'self_resist_curl', 'chair_dips', 'door_curl_hold', 'plank_up_down'], 45, 15, 3),
      ],
    },
  ],
};

export const KOL_PROGRAMS: Program[] = [toparla, gelistir, guclendir];
