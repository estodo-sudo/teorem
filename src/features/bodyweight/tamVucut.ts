import type { Program, Workout } from './program';

/**
 * Tam Vücut programmes (2026-11-22). Built from:
 *  - volume-equated, training frequency hardly changes muscle growth (Schoenfeld et al. 2019, 25
 *    studies) — whole-body sessions work as well as split routines;
 *  - bodyweight high-intensity circuit training (Klika & Jordan, ACSM 2013) — short rests, compound
 *    moves; evidence from small studies;
 *  - every workout has a push, a pull / back, a legs and a core move (muscle balance); burpees start
 *    without the jump (half burpee) and the full burpee only comes in Geliştir week 5.
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
      workouts: [w('A', ['squat', 'knee_pushup', 'superman', 'glute_bridge', 'plank'], 30, 30, 2), w('B', ['inchworm', 'reverse_lunge', 'chair_dips', 'bird_dog', 'dead_bug'], 30, 30, 2)],
    },
    {
      fromWeek: 3,
      toWeek: 5,
      workouts: [w('A', ['squat', 'knee_pushup', 'table_row', 'half_burpee', 'plank'], 40, 20, 2), w('B', ['reverse_lunge', 'chair_dips', 'superman', 'glute_bridge', 'mountain_climber'], 40, 20, 2)],
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
      workouts: [w('A', ['half_burpee', 'squat', 'pushup', 'table_row', 'plank'], 40, 20, 3, 45), w('B', ['inchworm', 'reverse_lunge', 'chair_dips', 'superman', 'mountain_climber'], 40, 20, 3, 45)],
    },
    {
      fromWeek: 5,
      toWeek: 9,
      workouts: [w('A', ['burpee', 'jump_squat', 'pushup', 'table_row', 'dead_bug'], 45, 15, 3, 45), w('B', ['half_burpee', 'reverse_lunge', 'chair_dips', 'bird_dog', 'mountain_climber'], 45, 15, 3, 45)],
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
        w('A', ['burpee', 'squat', 'pushup', 'table_row', 'glute_bridge', 'plank'], 45, 15, 3),
        w('B', ['inchworm', 'jump_squat', 'chair_dips', 'superman', 'reverse_lunge', 'mountain_climber'], 45, 15, 3),
        w('C', ['half_burpee', 'squat', 'knee_pushup', 'bird_dog', 'glute_bridge', 'dead_bug'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 5,
      toWeek: 8,
      workouts: [
        w('A', ['burpee', 'jump_squat', 'pushup', 'table_row', 'reverse_lunge', 'mountain_climber'], 50, 10, 3),
        w('B', ['inchworm', 'squat', 'chair_dips', 'superman', 'glute_bridge', 'plank'], 50, 10, 3),
        w('C', ['half_burpee', 'squat', 'knee_pushup', 'bird_dog', 'glute_bridge', 'dead_bug'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 9,
      toWeek: 13,
      workouts: [
        w('A', ['burpee', 'jump_squat', 'pushup', 'table_row', 'reverse_lunge', 'mountain_climber', 'plank'], 50, 10, 3),
        w('B', ['burpee', 'squat', 'chair_dips', 'superman', 'glute_bridge', 'dead_bug', 'inchworm'], 50, 10, 3),
        w('C', ['half_burpee', 'squat', 'knee_pushup', 'bird_dog', 'glute_bridge', 'dead_bug'], 45, 15, 3),
      ],
    },
  ],
};

export const TAM_VUCUT_PROGRAMS: Program[] = [toparla, gelistir, guclendir];
