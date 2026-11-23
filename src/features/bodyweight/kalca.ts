import type { Program, Workout } from './program';

/**
 * Kalça programmes (2026-11-22). Built from:
 *  - gluteus medius highest in side-lying hip abduction, gluteus maximus highest in single-leg squats
 *    and single-leg deadlifts (DiStefano et al. 2009);
 *  - hip thrusts and squats grew the glutes similarly over 9 weeks, squats grew the thighs more;
 *    acute EMG did not predict growth (Plotkin et al. 2023) — so workouts mix bridges / thrusts,
 *    side-lying work and single-leg moves;
 *  - progression: bridge → single-leg bridge / hip thrust → single-leg hip thrust.
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
      workouts: [w('A', ['glute_bridge', 'clamshell', 'donkey_kick', 'side_lying_leg_raise', 'glute_bridge_hold'], 30, 30, 2), w('B', ['glute_bridge', 'standing_kickback', 'sumo_squat', 'clamshell', 'glute_bridge_hold'], 30, 30, 2)],
    },
    {
      fromWeek: 3,
      toWeek: 5,
      workouts: [w('A', ['glute_bridge_march', 'side_lying_leg_raise', 'donkey_kick', 'reverse_lunge', 'glute_bridge_hold'], 40, 20, 2), w('B', ['hip_thrust', 'clamshell', 'standing_kickback', 'sumo_squat', 'single_leg_bridge'], 40, 20, 2)],
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
      workouts: [w('A', ['hip_thrust', 'side_lying_leg_raise', 'reverse_lunge', 'donkey_kick', 'glute_bridge_hold'], 40, 20, 3, 45), w('B', ['single_leg_bridge', 'clamshell', 'single_leg_rdl', 'sumo_squat', 'glute_bridge_march'], 40, 20, 3, 45)],
    },
    {
      fromWeek: 5,
      toWeek: 9,
      workouts: [w('A', ['single_leg_hip_thrust', 'side_lying_leg_raise', 'reverse_lunge', 'donkey_kick', 'glute_bridge_hold'], 45, 15, 3, 45), w('B', ['hip_thrust', 'single_leg_rdl', 'clamshell', 'standing_kickback', 'single_leg_bridge'], 45, 15, 3, 45)],
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
        w('A', ['hip_thrust', 'side_lying_leg_raise', 'reverse_lunge', 'single_leg_bridge', 'donkey_kick', 'glute_bridge_hold'], 45, 15, 3),
        w('B', ['single_leg_rdl', 'clamshell', 'sumo_squat', 'hip_thrust', 'standing_kickback', 'glute_bridge_march'], 45, 15, 3),
        w('C', ['glute_bridge', 'clamshell', 'side_lying_leg_raise', 'standing_kickback', 'donkey_kick', 'glute_bridge_hold'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 5,
      toWeek: 8,
      workouts: [
        w('A', ['single_leg_hip_thrust', 'side_lying_leg_raise', 'reverse_lunge', 'single_leg_bridge', 'donkey_kick', 'glute_bridge_hold'], 50, 10, 3),
        w('B', ['single_leg_rdl', 'clamshell', 'hip_thrust', 'sumo_squat', 'standing_kickback', 'glute_bridge_march'], 50, 10, 3),
        w('C', ['glute_bridge', 'clamshell', 'side_lying_leg_raise', 'standing_kickback', 'donkey_kick', 'glute_bridge_hold'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 9,
      toWeek: 13,
      workouts: [
        w('A', ['single_leg_hip_thrust', 'side_lying_leg_raise', 'reverse_lunge', 'single_leg_bridge', 'donkey_kick', 'single_leg_rdl', 'glute_bridge_hold'], 50, 10, 3),
        w('B', ['hip_thrust', 'clamshell', 'single_leg_rdl', 'sumo_squat', 'single_leg_hip_thrust', 'standing_kickback', 'glute_bridge_march'], 50, 10, 3),
        w('C', ['glute_bridge', 'clamshell', 'side_lying_leg_raise', 'standing_kickback', 'donkey_kick', 'glute_bridge_hold'], 45, 15, 3),
      ],
    },
  ],
};

export const KALCA_PROGRAMS: Program[] = [toparla, gelistir, guclendir];
