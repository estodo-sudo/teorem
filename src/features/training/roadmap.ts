import type { ModuleTone } from '@/config/theme';
import type { IconName } from '@/components/Icon';
import { pick } from '@/i18n/content';
import tasksJsonTr from '@/content/kegel/functional-tasks.tr.json';
import tasksJsonEn from '@/content/kegel/functional-tasks.en.json';
import { PLAN_LENGTH_DAYS } from '@/config/app';
import { createRng, hashString, shuffle } from '@/lib/random';
import type { TrackId, TrainingState } from '@/types';

import { advancedToday, todayPlanDay, todayPlanPosition, todayWeekIndex } from './plan';
import { deloadDue, planWeekNumber, planWeekOf } from './schedule';
import { functionalUnlocked, KEGEL_WEEK_THEMES } from './tracks';

const tasksJson = pick({ tr: tasksJsonTr, en: tasksJsonEn });

/** Plan roadmap (SPEC_KEGEL_V2 §8) and functional tasks (§5). Pure. */

export type NodeState = 'done' | 'today' | 'future';

export interface RoadmapNode {
  /** 0-based plan day. */
  day: number;
  state: NodeState;
  /** 0..3: which week header (days 29–30 stay under week 4). */
  week: number;
}

/** 30 nodes on the path: finished days filled, today ringed, the rest faded. */
export function roadmapNodes(t: TrainingState, today: string): RoadmapNode[] {
  const todayIdx = todayPlanDay(t, today);
  const doneUpTo = advancedToday(t, today) ? todayIdx + 1 : t.planDayIndex;
  return Array.from({ length: PLAN_LENGTH_DAYS }, (_, day) => ({ day, state: day < doneUpTo ? 'done' : day === todayIdx ? 'today' : 'future', week: Math.min(3, Math.floor(day / 7)) }));
}

/**
 * Whether a plan day's session is a lighter (deload) one — the same rule the session uses: plan week 4
 * always; the current plan week too when an early deload is running or due now.
 */
export function deloadOnPlanDay(t: TrainingState, today: string, day: number, strengthFalling = false): boolean {
  const pos = todayPlanPosition(t, today);
  if (planWeekOf(day) === 3) return true;
  if (planWeekOf(day) !== planWeekOf(pos.planDay)) return false;
  return deloadDue({ planNumber: pos.planNumber, planDay: day, lastDeloadWeek: t.lastDeloadWeek, strengthFalling }) || planWeekNumber(pos.planNumber, day) === t.lastDeloadWeek;
}

/** Week header titles ("1. Hafta: Kası tanı" …). */
export const weekTheme = (week: number) => KEGEL_WEEK_THEMES[Math.min(3, Math.max(0, week))]!;

/** Programme week a plan day falls in (for the preview of past and future days). */
export function weekIndexForPlanDay(t: TrainingState, today: string, day: number): number {
  const todayIdx = todayPlanDay(t, today);
  const w = todayWeekIndex(t, today);
  const dayInWeek = advancedToday(t, today) ? (t.dayIndex + 6) % 7 : t.dayIndex;
  return Math.max(0, w + Math.floor((dayInWeek + (day - todayIdx)) / 7));
}

// ---------------------------------------------------------------- functional tasks

export interface FunctionalTaskDef {
  id: string;
  icon: IconName;
  tone?: ModuleTone;
  title: string;
  text: string;
  tracks: string[];
}
export const FUNCTIONAL_TASKS = tasksJson.tasks as FunctionalTaskDef[];

/** Tasks that suit a track ("all" = every track except relaxation, which gets its calm ones). */
export const tasksForTrack = (track: TrackId) => FUNCTIONAL_TASKS.filter((x) => x.tracks.includes(track) || (track !== 'relax' && x.tracks.includes('all')));

/** 1–2 tasks for the day, the same all day, changing day to day; none before week 6. */
export function tasksForDay(track: TrackId, weekIndex: number, date: string, count = 2): FunctionalTaskDef[] {
  if (!functionalUnlocked(weekIndex)) return [];
  const pool = tasksForTrack(track);
  return shuffle(createRng(hashString(`${date}|${track}`)), pool).slice(0, Math.max(1, Math.min(2, count)));
}
