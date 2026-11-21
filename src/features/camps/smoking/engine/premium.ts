import type { CampPhase } from '../types';

/**
 * Sigarasız Kamp free / premium split (spec 8). Always free, never gated: the assessment,
 * counters and savings, the SOS crisis tool with all its tools, ALO 171 and the support screen,
 * the slip flow and the health timeline. Free beyond that so the camp stays useful: missions up to
 * the end of the critical week, the first lessons, a few library
 * stories, the smoke-free calendar and badges. Everything else is part of the subscription.
 */
export const FREE_MISSION_PHASES: CampPhase[] = ['preparation', 'quit_day', 'critical_week'];
export const FREE_LESSON_COUNT = 3;
export const FREE_STORIES = ['addiction', 'withdrawal-timeline', 'ecig', 'secondhand', 'any-age'];

export const missionIsFree = (phase: CampPhase) => FREE_MISSION_PHASES.includes(phase);
/** Main lessons in order: the first FREE_LESSON_COUNT are free; the bonus lesson is premium. */
export const lessonIsFree = (order: number, bonus: boolean) => !bonus && order <= FREE_LESSON_COUNT;
export const storyIsFree = (id: string) => FREE_STORIES.includes(id);

/**
 * Under-18 rule (spec 0.3/6): behavioural tools stay open, medication information is hidden and the
 * user is pointed to ALO 171 and under-18 cessation clinics instead.
 */
export const MEDICATION_STORIES = ['medication-info'];
export const isMinor = (ageRange: string | null | undefined) => ageRange === 'under18';
