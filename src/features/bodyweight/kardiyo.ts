import type { Program, Workout } from './program';

/**
 * Kardiyo programmes (2026-11-22). Built from:
 *  - WHO 2020: 150–300 min moderate or 75–150 min vigorous aerobic activity a week; any bout counts;
 *  - interval training raises VO2max; its edge over continuous training shows with longer, higher
 *    volume and multi-week programmes (meta-analyses 2015 / 2019) — so work periods and weeks grow;
 *  - low-impact moves first (march, step jacks, shadow boxing): Toparla has no jumping; jumps,
 *    skaters and full burpees come in Geliştir and Güçlendir.
 * In Güçlendir the third workout (C) is a lighter, low-impact day.
 */

const w = (id: string, moves: string[], workSec: number, restSec: number, rounds: number, roundRestSec = 60): Workout => ({ id, moves, workSec, restSec, rounds, roundRestSec });

/** 30 days, 3 a week (days 1, 3, 5), about 10 minutes, no jumping. */
const toparla: Program = {
  id: 'toparla',
  days: 30,
  trainDays: [0, 2, 4],
  phases: [
    {
      fromWeek: 1,
      toWeek: 2,
      workouts: [w('A', ['march_in_place', 'step_jack', 'shadow_boxing', 'butt_kicks', 'march_in_place'], 30, 30, 2), w('B', ['march_in_place', 'shadow_boxing', 'step_jack', 'fast_feet', 'march_in_place'], 30, 30, 2)],
    },
    {
      fromWeek: 3,
      toWeek: 5,
      workouts: [w('A', ['march_in_place', 'step_jack', 'half_burpee', 'shadow_boxing', 'fast_feet'], 40, 20, 2), w('B', ['butt_kicks', 'mountain_climber', 'step_jack', 'shadow_boxing', 'march_in_place'], 40, 20, 2)],
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
      workouts: [w('A', ['jumping_jack', 'high_knees', 'half_burpee', 'shadow_boxing', 'mountain_climber'], 40, 20, 3, 45), w('B', ['jump_rope', 'butt_kicks', 'fast_feet', 'step_jack', 'mountain_climber'], 40, 20, 3, 45)],
    },
    {
      fromWeek: 5,
      toWeek: 9,
      workouts: [w('A', ['jumping_jack', 'skater', 'burpee', 'high_knees', 'mountain_climber'], 45, 15, 3, 45), w('B', ['jump_rope', 'jump_squat', 'shadow_boxing', 'fast_feet', 'half_burpee'], 45, 15, 3, 45)],
    },
  ],
};

/** 90 days, 5 a week (days 1–3, 5, 6), about 20 minutes; weeks 4, 8 and 12 lighter; C = low-impact day. */
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
        w('A', ['jumping_jack', 'high_knees', 'burpee', 'skater', 'mountain_climber', 'fast_feet'], 45, 15, 3),
        w('B', ['jump_rope', 'jump_squat', 'shadow_boxing', 'butt_kicks', 'half_burpee', 'mountain_climber'], 45, 15, 3),
        w('C', ['march_in_place', 'step_jack', 'shadow_boxing', 'butt_kicks', 'fast_feet', 'march_in_place'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 5,
      toWeek: 8,
      workouts: [
        w('A', ['jumping_jack', 'skater', 'burpee', 'high_knees', 'jump_squat', 'mountain_climber'], 50, 10, 3),
        w('B', ['jump_rope', 'burpee', 'shadow_boxing', 'skater', 'fast_feet', 'mountain_climber'], 50, 10, 3),
        w('C', ['march_in_place', 'step_jack', 'shadow_boxing', 'butt_kicks', 'fast_feet', 'march_in_place'], 40, 20, 3),
      ],
    },
    {
      fromWeek: 9,
      toWeek: 13,
      workouts: [
        w('A', ['jumping_jack', 'skater', 'burpee', 'high_knees', 'jump_squat', 'mountain_climber', 'fast_feet'], 50, 10, 3),
        w('B', ['jump_rope', 'burpee', 'shadow_boxing', 'skater', 'high_knees', 'jump_squat', 'mountain_climber'], 50, 10, 3),
        w('C', ['march_in_place', 'step_jack', 'shadow_boxing', 'butt_kicks', 'fast_feet', 'march_in_place'], 45, 15, 3),
      ],
    },
  ],
};

export const KARDIYO_PROGRAMS: Program[] = [toparla, gelistir, guclendir];
