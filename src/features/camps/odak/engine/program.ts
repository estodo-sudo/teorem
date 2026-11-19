import { missionForDay } from '@/features/camps/core/missionScheduler';

import type { GoalConfig, OdakProfile } from '../types';

import { programStart } from './checkin';
import { ODAK_PHASE_ORDER, odakPhase, programDay, type OdakPhase } from './phase';

/**
 * Programme content selection (pure): today's mission and the lesson of the day.
 *   Missions: one a day for days 1–42, then weekly to day 90 (the latest open one of the phase shows).
 *   Lessons: in order, unlocked by phase; the values-congruence lesson moves up when the
 *   moral-incongruence answer is high (4–5), right after the first lesson (spec 5.7).
 */
export interface OdakMission {
  id: string;
  phase: OdakPhase;
  day: number;
  title: string;
  body: string;
  durationMin: number;
  type: 'action' | 'reflection' | 'learning' | 'social';
}

export interface OdakLesson {
  id: string;
  order: number;
  phase: OdakPhase;
  emoji: string;
  title: string;
  summary: string;
  slides: { emoji: string; title: string; text: string }[];
  practice: { title: string; text: string };
  quiz: { q: string; options: string[]; answer: number; explain: string }[];
  sourceIds: string[];
  evidenceLevel: string;
  minutes: number;
  bonus: boolean;
}

export const MORAL_HIGH = 4;

export function todayMission(missions: OdakMission[], goal: GoalConfig, doneIds: string[], now: Date): OdakMission | null {
  const start = programStart(goal);
  return missionForDay(missions, odakPhase(start, now), programDay(start, now), doneIds);
}

const phaseIdx = (p: OdakPhase) => ODAK_PHASE_ORDER.indexOf(p);

/** Can the lesson be opened in the current phase? (Earlier phases stay open.) */
export const lessonOpen = (l: OdakLesson, phase: OdakPhase) => phaseIdx(l.phase) <= phaseIdx(phase);

/** Lessons in the order the user should take them. */
export function lessonOrder(lessons: OdakLesson[], profile: Pick<OdakProfile, 'moralIncongruence'> | null): OdakLesson[] {
  const main = lessons.filter((l) => !l.bonus).sort((a, b) => a.order - b.order);
  const bonus = lessons.filter((l) => l.bonus);
  if (!bonus.length) return main;
  if ((profile?.moralIncongruence ?? 0) >= MORAL_HIGH) return [main[0]!, ...bonus, ...main.slice(1)].filter(Boolean);
  return [...main, ...bonus];
}

/** The next lesson to take now (open and not done), or null. */
export function lessonOfDay(lessons: OdakLesson[], profile: Pick<OdakProfile, 'moralIncongruence'> | null, doneIds: string[], phase: OdakPhase): OdakLesson | null {
  return lessonOrder(lessons, profile).find((l) => !doneIds.includes(l.id) && (lessonOpen(l, phase) || (l.bonus && (profile?.moralIncongruence ?? 0) >= MORAL_HIGH))) ?? null;
}

export const quizScore = (answers: (number | null)[], correct: number[]) => (correct.length ? correct.filter((c, i) => answers[i] === c).length / correct.length : 1);
