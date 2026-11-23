import type { Program, Workout } from './program';

/**
 * Karın programmes (2026-11-22). Built from:
 *  - starting with 2 sets / short work and good form, moving to 3 sets over time (ACE);
 *  - holds built up to 20–30 s before harder variations; progress by harder moves rather than
 *    endless reps (plank → plank shoulder tap, dead bug → hollow hold);
 *  - spine-friendly basics first: curl-up, side plank, bird dog (McGill "Big 3");
 *  - 2–4 core sessions a week for beginners; lighter every 4th week in the longer programmes.
 * Interval format: work / rest seconds per move, a longer rest between rounds.
 */

const w = (id: string, moves: string[], workSec: number, restSec: number, rounds: number, roundRestSec = 60): Workout => ({ id, moves, workSec, restSec, rounds, roundRestSec });

/** 30 days, 3 workouts a week (days 1, 3, 5 of each week), about 10–11 minutes. */
const toparla: Program = {
  id: 'toparla',
  days: 30,
  trainDays: [0, 2, 4],
  phases: [
    {
      fromWeek: 1,
      toWeek: 2,
      workouts: [w('A', ['crunch', 'dead_bug', 'knee_plank', 'heel_tap', 'bird_dog'], 30, 30, 2), w('B', ['reverse_crunch', 'heel_tap', 'side_plank_knee', 'dead_bug', 'knee_plank'], 30, 30, 2)],
    },
    {
      fromWeek: 3,
      toWeek: 5,
      workouts: [w('A', ['crunch', 'dead_bug', 'plank', 'heel_tap', 'bird_dog'], 40, 20, 2), w('B', ['reverse_crunch', 'bicycle_crunch', 'side_plank_knee', 'dead_bug', 'plank'], 40, 20, 2)],
    },
  ],
};

/** 60 days, 4 workouts a week (days 1, 2, 4, 5), about 15–16 minutes; week 4 and 8 lighter. */
const gelistir: Program = {
  id: 'gelistir',
  days: 60,
  trainDays: [0, 1, 3, 4],
  lightEvery: 4,
  phases: [
    {
      fromWeek: 1,
      toWeek: 4,
      workouts: [w('A', ['crunch', 'bicycle_crunch', 'plank', 'reverse_crunch', 'side_plank'], 40, 20, 3, 45), w('B', ['leg_raise', 'dead_bug', 'mountain_climber', 'heel_tap', 'plank_shoulder_tap'], 40, 20, 3, 45)],
    },
    {
      fromWeek: 5,
      toWeek: 9,
      workouts: [w('A', ['bicycle_crunch', 'leg_raise', 'side_plank', 'mountain_climber', 'hollow_hold'], 45, 15, 3, 45), w('B', ['reverse_crunch', 'plank_shoulder_tap', 'flutter_kicks', 'dead_bug', 'plank'], 45, 15, 3, 45)],
    },
  ],
};

/** 90 days, 5 workouts a week (days 1–3, 5, 6), about 20–22 minutes; weeks 4, 8 and 12 lighter. */
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
        w('A', ['bicycle_crunch', 'leg_raise', 'plank_shoulder_tap', 'side_plank', 'mountain_climber', 'hollow_hold'], 45, 15, 3),
        w('B', ['reverse_crunch', 'flutter_kicks', 'plank', 'heel_tap', 'dead_bug', 'crunch'], 45, 15, 3),
        w('C', ['mountain_climber', 'bicycle_crunch', 'side_plank', 'leg_raise', 'plank_shoulder_tap', 'hollow_hold'], 45, 15, 3),
      ],
    },
    {
      fromWeek: 5,
      toWeek: 8,
      workouts: [
        w('A', ['bicycle_crunch', 'leg_raise', 'plank_shoulder_tap', 'side_plank', 'mountain_climber', 'hollow_hold'], 50, 10, 3),
        w('B', ['reverse_crunch', 'flutter_kicks', 'plank', 'heel_tap', 'dead_bug', 'bicycle_crunch'], 50, 10, 3),
        w('C', ['mountain_climber', 'hollow_hold', 'side_plank', 'leg_raise', 'plank_shoulder_tap', 'flutter_kicks'], 50, 10, 3),
      ],
    },
    {
      fromWeek: 9,
      toWeek: 13,
      workouts: [
        w('A', ['bicycle_crunch', 'leg_raise', 'plank_shoulder_tap', 'side_plank', 'mountain_climber', 'hollow_hold', 'flutter_kicks'], 50, 10, 3),
        w('B', ['reverse_crunch', 'flutter_kicks', 'plank', 'mountain_climber', 'dead_bug', 'bicycle_crunch', 'hollow_hold'], 50, 10, 3),
        w('C', ['mountain_climber', 'hollow_hold', 'side_plank', 'leg_raise', 'plank_shoulder_tap', 'reverse_crunch', 'plank'], 50, 10, 3),
      ],
    },
  ],
};

export const KARIN_PROGRAMS: Program[] = [toparla, gelistir, guclendir];
