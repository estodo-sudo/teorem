import type { Program, Workout } from './program';

/**
 * Omuz programmes (2026-11-22). Built from:
 *  - pike push-ups shift the load from the chest to the shoulders; build up through normal / incline
 *    push-ups first, then pike → feet-up pike → wall handstand (NASM; coaching progressions);
 *  - the push-up plus (scapular push-up) among the highest serratus-anterior exercises
 *    (Ludewig et al. 2004);
 *  - light external rotation and scapular work in every warm-up (consistently recommended; injury
 *    prevention not proven) — so each workout starts with arm circles or wall slides.
 * In Güçlendir the third workout (C) is a lighter, shoulder-health day.
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
      workouts: [w('A', ['arm_circles', 'wall_slide', 'scapular_pushup', 'side_lying_er', 'bear_hold'], 30, 30, 2), w('B', ['arm_circles', 'prone_y_raise', 'reverse_tabletop', 'scapular_pushup', 'pike_hold'], 30, 30, 2)],
    },
    {
      fromWeek: 3,
      toWeek: 5,
      workouts: [w('A', ['arm_circles', 'pike_hold', 'scapular_pushup', 'downdog_to_plank', 'side_lying_er'], 40, 20, 2), w('B', ['wall_slide', 'pike_pushup', 'prone_t_raise', 'bear_hold', 'reverse_tabletop'], 40, 20, 2)],
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
      workouts: [w('A', ['arm_circles', 'pike_pushup', 'plank_shoulder_tap', 'prone_y_raise', 'bear_hold'], 40, 20, 3, 45), w('B', ['wall_slide', 'downdog_to_plank', 'pike_hold', 'side_lying_er', 'reverse_tabletop'], 40, 20, 3, 45)],
    },
    {
      fromWeek: 5,
      toWeek: 9,
      workouts: [w('A', ['arm_circles', 'pike_pushup', 'elevated_pike_pushup', 'prone_t_raise', 'bear_hold'], 45, 15, 3, 45), w('B', ['wall_slide', 'pike_pushup', 'plank_shoulder_tap', 'scapular_pushup', 'reverse_tabletop'], 45, 15, 3, 45)],
    },
  ],
};

/** 90 days, 5 a week (days 1–3, 5, 6), about 20 minutes; weeks 4, 8 and 12 lighter; C = shoulder-health day. */
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
        w('A', ['arm_circles', 'pike_pushup', 'plank_shoulder_tap', 'elevated_pike_pushup', 'prone_y_raise', 'bear_hold'], 45, 15, 3),
        w('B', ['wall_slide', 'downdog_to_plank', 'pike_pushup', 'reverse_tabletop', 'prone_t_raise', 'pike_hold'], 45, 15, 3),
        w('C', ['arm_circles', 'wall_slide', 'scapular_pushup', 'side_lying_er', 'prone_y_raise', 'reverse_tabletop'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 5,
      toWeek: 8,
      workouts: [
        w('A', ['arm_circles', 'elevated_pike_pushup', 'plank_shoulder_tap', 'pike_pushup', 'wall_handstand_hold', 'bear_hold'], 50, 10, 3),
        w('B', ['wall_slide', 'pike_pushup', 'downdog_to_plank', 'reverse_tabletop', 'prone_t_raise', 'pike_hold'], 50, 10, 3),
        w('C', ['arm_circles', 'wall_slide', 'scapular_pushup', 'side_lying_er', 'prone_y_raise', 'bear_hold'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 9,
      toWeek: 13,
      workouts: [
        w('A', ['arm_circles', 'elevated_pike_pushup', 'wall_handstand_hold', 'pike_pushup', 'plank_shoulder_tap', 'bear_hold', 'prone_y_raise'], 50, 10, 3),
        w('B', ['wall_slide', 'pike_pushup', 'elevated_pike_pushup', 'downdog_to_plank', 'reverse_tabletop', 'wall_handstand_hold', 'prone_t_raise'], 50, 10, 3),
        w('C', ['arm_circles', 'wall_slide', 'scapular_pushup', 'side_lying_er', 'prone_y_raise', 'reverse_tabletop'], 45, 15, 3),
      ],
    },
  ],
};

export const OMUZ_PROGRAMS: Program[] = [toparla, gelistir, guclendir];
