import type { Program, Workout } from './program';

/**
 * Sırt programmes (2026-11-22). Built from:
 *  - the inverted row (here under a sturdy table) as the main bodyweight pull — EMG at strength-building
 *    levels (PubMed 26422610); bodyweight pulling has thinner evidence than weights, so progress comes
 *    from longer work and harder moves;
 *  - prone Y / T raises among the best lower-trapezius exercises (arms 90–125° out);
 *  - back-extensor endurance (superman holds) — linked to low-back health (Biering-Sørensen), with
 *    neutral-spine moves first; mobility (cat-cow) to open and child's pose to close a workout.
 * In Güçlendir the third workout (C) is a lighter mobility and posture day.
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
      workouts: [w('A', ['cat_cow', 'scapular_squeeze', 'bird_dog', 'prone_w_raise', 'child_pose'], 30, 30, 2), w('B', ['cat_cow', 'wall_angel', 'superman', 'prone_y_raise', 'child_pose'], 30, 30, 2)],
    },
    {
      fromWeek: 3,
      toWeek: 5,
      workouts: [w('A', ['cat_cow', 'prone_t_raise', 'bird_dog', 'superman', 'table_row'], 40, 20, 2), w('B', ['wall_angel', 'table_row', 'prone_y_raise', 'superman_hold', 'child_pose'], 40, 20, 2)],
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
      workouts: [w('A', ['table_row', 'superman', 'prone_y_raise', 'bird_dog', 'good_morning'], 40, 20, 3, 45), w('B', ['table_row', 'reverse_snow_angel', 'swimmers', 'prone_t_raise', 'cobra'], 40, 20, 3, 45)],
    },
    {
      fromWeek: 5,
      toWeek: 9,
      workouts: [w('A', ['table_row', 'superman_hold', 'reverse_snow_angel', 'good_morning', 'swimmers'], 45, 15, 3, 45), w('B', ['table_row', 'prone_y_raise', 'prone_w_raise', 'bird_dog', 'superman'], 45, 15, 3, 45)],
    },
  ],
};

/** 90 days, 5 a week (days 1–3, 5, 6), about 20 minutes; weeks 4, 8 and 12 lighter; C = mobility day. */
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
        w('A', ['table_row', 'superman', 'reverse_snow_angel', 'good_morning', 'swimmers', 'superman_hold'], 45, 15, 3),
        w('B', ['table_row', 'prone_y_raise', 'prone_t_raise', 'bird_dog', 'good_morning', 'cobra'], 45, 15, 3),
        w('C', ['cat_cow', 'wall_angel', 'scapular_squeeze', 'prone_w_raise', 'bird_dog', 'child_pose'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 5,
      toWeek: 8,
      workouts: [
        w('A', ['table_row', 'superman_hold', 'reverse_snow_angel', 'good_morning', 'swimmers', 'table_row'], 50, 10, 3),
        w('B', ['table_row', 'prone_y_raise', 'prone_t_raise', 'swimmers', 'good_morning', 'superman'], 50, 10, 3),
        w('C', ['cat_cow', 'wall_angel', 'prone_w_raise', 'bird_dog', 'cobra', 'child_pose'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 9,
      toWeek: 13,
      workouts: [
        w('A', ['table_row', 'superman_hold', 'reverse_snow_angel', 'good_morning', 'swimmers', 'table_row', 'prone_y_raise'], 50, 10, 3),
        w('B', ['table_row', 'prone_t_raise', 'superman', 'swimmers', 'good_morning', 'superman_hold', 'table_row'], 50, 10, 3),
        w('C', ['cat_cow', 'wall_angel', 'prone_w_raise', 'bird_dog', 'cobra', 'child_pose'], 45, 15, 3),
      ],
    },
  ],
};

export const SIRT_PROGRAMS: Program[] = [toparla, gelistir, guclendir];
