import type { Program, Workout } from './program';

/**
 * Göğüs programmes (2026-11-22). Built from:
 *  - the usual progression wall → incline → knee → full push-up, moving on after 12–15 clean reps
 *    (NASM, coaching programmes); arms bent at least 90° for a counted rep;
 *  - push-ups to a hard effort can build muscle and strength close to the bench press (Kikuchi &
 *    Nakazato 2017; Calatayud et al.) — so harder variations replace endless reps;
 *  - narrow / diamond hands tend to load chest and triceps more (results mixed between studies);
 *  - beginners 3 days a week, 2–3 sets; slow lowering (negatives) as the bridge to the full push-up.
 * In Güçlendir the third workout (C) is a lighter, technique day so the chest is not hit hard on
 * five days in a row.
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
      workouts: [w('A', ['wall_pushup', 'incline_pushup', 'chest_squeeze', 'knee_pushup', 'wall_pushup'], 30, 30, 2), w('B', ['incline_pushup', 'chest_squeeze', 'knee_pushup', 'wall_pushup', 'incline_pushup'], 30, 30, 2)],
    },
    {
      fromWeek: 3,
      toWeek: 5,
      workouts: [w('A', ['incline_pushup', 'knee_pushup', 'chest_squeeze', 'negative_pushup', 'knee_pushup'], 40, 20, 2), w('B', ['knee_pushup', 'chair_dips', 'incline_pushup', 'chest_squeeze', 'negative_pushup'], 40, 20, 2)],
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
      workouts: [w('A', ['pushup', 'incline_pushup', 'wide_pushup', 'chair_dips', 'knee_pushup'], 40, 20, 3, 45), w('B', ['pushup', 'negative_pushup', 'chest_squeeze', 'wide_pushup', 'chair_dips'], 40, 20, 3, 45)],
    },
    {
      fromWeek: 5,
      toWeek: 9,
      workouts: [w('A', ['pushup', 'wide_pushup', 'decline_pushup', 'chair_dips', 'pushup_hold'], 45, 15, 3, 45), w('B', ['diamond_pushup', 'pushup', 'spiderman_pushup', 'negative_pushup', 'chair_dips'], 45, 15, 3, 45)],
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
        w('A', ['pushup', 'wide_pushup', 'decline_pushup', 'chair_dips', 'diamond_pushup', 'pushup_hold'], 45, 15, 3),
        w('B', ['spiderman_pushup', 'negative_pushup', 'wide_pushup', 'chair_dips', 'pushup', 'chest_squeeze'], 45, 15, 3),
        w('C', ['incline_pushup', 'chest_squeeze', 'knee_pushup', 'wide_pushup', 'chest_squeeze', 'pushup_hold'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 5,
      toWeek: 8,
      workouts: [
        w('A', ['pushup', 'decline_pushup', 'diamond_pushup', 'chair_dips', 'plyo_pushup', 'pushup_hold'], 50, 10, 3),
        w('B', ['spiderman_pushup', 'wide_pushup', 'negative_pushup', 'chair_dips', 'pushup', 'chest_squeeze'], 50, 10, 3),
        w('C', ['incline_pushup', 'chest_squeeze', 'pushup', 'wide_pushup', 'chest_squeeze', 'pushup_hold'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 9,
      toWeek: 13,
      workouts: [
        w('A', ['pushup', 'decline_pushup', 'diamond_pushup', 'chair_dips', 'plyo_pushup', 'pushup_hold', 'spiderman_pushup'], 50, 10, 3),
        w('B', ['plyo_pushup', 'wide_pushup', 'negative_pushup', 'chair_dips', 'decline_pushup', 'diamond_pushup', 'chest_squeeze'], 50, 10, 3),
        w('C', ['incline_pushup', 'chest_squeeze', 'pushup', 'wide_pushup', 'chest_squeeze', 'pushup_hold'], 45, 15, 3),
      ],
    },
  ],
};

export const GOGUS_PROGRAMS: Program[] = [toparla, gelistir, guclendir];
