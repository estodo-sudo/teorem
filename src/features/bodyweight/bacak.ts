import type { Program, Workout } from './program';

/**
 * Bacak programmes (2026-11-22). Built from:
 *  - low loads taken close to failure grow muscle about as well as heavy loads (Schoenfeld et al. 2017,
 *    21 studies; 2021 network meta-analysis), strength favours heavy loads — so sets are long and
 *    single-leg moves add load (split squat → Bulgarian split squat → chair pistol);
 *  - the Bulgarian split squat is more hip-dominant than the back squat; unilateral and bilateral
 *    training are equally effective early on;
 *  - isometric wall squats were among the most effective exercises for resting blood pressure
 *    (Edwards et al. 2023, 270 RCTs) — so the wall sit is in most workouts.
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
      workouts: [w('A', ['chair_squat', 'split_squat', 'wall_sit', 'step_up', 'sumo_squat'], 30, 30, 2), w('B', ['squat', 'reverse_lunge', 'wall_sit', 'side_lunge', 'chair_squat'], 30, 30, 2)],
    },
    {
      fromWeek: 3,
      toWeek: 5,
      workouts: [w('A', ['squat', 'reverse_lunge', 'wall_sit', 'step_up', 'single_leg_rdl'], 40, 20, 2), w('B', ['sumo_squat', 'split_squat', 'pulse_squat', 'side_lunge', 'wall_sit'], 40, 20, 2)],
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
      workouts: [w('A', ['squat', 'bulgarian_split_squat', 'wall_sit', 'step_up', 'single_leg_rdl'], 40, 20, 3, 45), w('B', ['sumo_squat', 'reverse_lunge', 'pulse_squat', 'side_lunge', 'wall_sit'], 40, 20, 3, 45)],
    },
    {
      fromWeek: 5,
      toWeek: 9,
      workouts: [w('A', ['jump_squat', 'bulgarian_split_squat', 'pulse_squat', 'single_leg_rdl', 'wall_sit'], 45, 15, 3, 45), w('B', ['squat', 'step_up', 'side_lunge', 'reverse_lunge', 'jump_squat'], 45, 15, 3, 45)],
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
        w('A', ['jump_squat', 'bulgarian_split_squat', 'pulse_squat', 'single_leg_rdl', 'step_up', 'wall_sit'], 45, 15, 3),
        w('B', ['squat', 'reverse_lunge', 'side_lunge', 'chair_pistol', 'sumo_squat', 'wall_sit'], 45, 15, 3),
        w('C', ['chair_squat', 'split_squat', 'step_up', 'side_lunge', 'sumo_squat', 'wall_sit'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 5,
      toWeek: 8,
      workouts: [
        w('A', ['jump_squat', 'bulgarian_split_squat', 'chair_pistol', 'single_leg_rdl', 'pulse_squat', 'wall_sit'], 50, 10, 3),
        w('B', ['squat', 'reverse_lunge', 'jump_squat', 'side_lunge', 'step_up', 'wall_sit'], 50, 10, 3),
        w('C', ['chair_squat', 'split_squat', 'step_up', 'side_lunge', 'sumo_squat', 'wall_sit'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 9,
      toWeek: 13,
      workouts: [
        w('A', ['jump_squat', 'bulgarian_split_squat', 'chair_pistol', 'single_leg_rdl', 'pulse_squat', 'step_up', 'wall_sit'], 50, 10, 3),
        w('B', ['squat', 'reverse_lunge', 'jump_squat', 'side_lunge', 'bulgarian_split_squat', 'sumo_squat', 'wall_sit'], 50, 10, 3),
        w('C', ['chair_squat', 'split_squat', 'step_up', 'side_lunge', 'sumo_squat', 'wall_sit'], 45, 15, 3),
      ],
    },
  ],
};

export const BACAK_PROGRAMS: Program[] = [toparla, gelistir, guclendir];
