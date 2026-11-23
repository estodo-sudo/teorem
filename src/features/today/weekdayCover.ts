/**
 * "Günün antrenmanı" background (user request 2026-11-23): seven photos, one per weekday — Monday is
 * photo 1, Sunday photo 7, and the next Monday starts again at photo 1. Local calendar day. Pure.
 */
export const WORKOUT_COVERS = 7;

/** 1 = Monday … 7 = Sunday. */
export const weekdayIndex = (d: Date) => ((d.getDay() + 6) % 7) + 1;

export const workoutCoverId = (d: Date = new Date()) => `today/workout-${weekdayIndex(d)}`;
