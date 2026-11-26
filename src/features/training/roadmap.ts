import type { ModuleTone } from '@/config/theme';
import type { IconName } from '@/components/Icon';
import { pick } from '@/i18n/content';
import tasksJsonTr from '@/content/kegel/functional-tasks.tr.json';
import tasksJsonEn from '@/content/kegel/functional-tasks.en.json';
import { CYCLE_DAYS, PLAN_LENGTH_DAYS, PLAN_STAGE_DAYS, PLAN_STAGES } from '@/config/app';
import { createRng, hashString, shuffle } from '@/lib/random';
import type { TrackId, TrainingState } from '@/types';

import { advancedToday, isCycle, todayPlanDay, todayPlanPosition, todayWeekIndex } from './plan';
import { deloadDue, planStageOf, planWeekNumber, planWeekOf } from './schedule';
import { functionalUnlocked, KEGEL_WEEK_THEME_CYCLE, KEGEL_WEEK_THEME_RESTART, KEGEL_WEEK_THEMES } from './tracks';

const tasksJson = pick({ tr: tasksJsonTr, en: tasksJsonEn });

/** Plan roadmap (SPEC_KEGEL_V2 §8) and functional tasks (§5). Pure. */

export type NodeState = 'done' | 'today' | 'future';

export interface RoadmapNode {
  /** 0-based day: of the 180-day plan, or of the 7-day cycle when `cycle`. */
  day: number;
  state: NodeState;
  /** 0..3: which week header of its 30-day stage (days 29–30 of a stage stay under week 4); 0 in the cycle. */
  week: number;
  /** 0..5: the 30-day stage; CYCLE_STAGE (6) for the 7-day cycle after the 180 days. */
  stage: number;
  /** A day of the endless 7-day cycle (not of the 180-day plan). */
  cycle?: boolean;
}

/** Stage number used for the 7-day cycle after the six 30-day stages. */
export const CYCLE_STAGE = PLAN_STAGES;

/** Today's stage (0..5, CYCLE_STAGE in the cycle) and week in it (0..3). */
export function currentPlanWeek(t: TrainingState, today: string): { stage: number; week: number } {
  const pos = todayPlanPosition(t, today);
  if (isCycle(pos.planNumber)) return { stage: CYCLE_STAGE, week: 0 };
  return { stage: planStageOf(pos.planDay), week: planWeekOf(pos.planDay) };
}

/**
 * The whole path (2026-11-26: "tüm plan, şimdiki 30 günlük gibi"): the 180 days of the plan, then the 7 days
 * of the cycle that repeats after it. Finished days filled, today ringed, the rest faded; in the cycle
 * the 180 days are all done and the current cycle's days show where today is.
 */
export function roadmapNodes(t: TrainingState, today: string): RoadmapNode[] {
  const pos = todayPlanPosition(t, today);
  const inCycle = isCycle(pos.planNumber);
  const todayIdx = todayPlanDay(t, today);
  const doneUpTo = advancedToday(t, today) ? todayIdx + 1 : t.planDayIndex;
  const state = (day: number, current: boolean): NodeState => (!current ? 'future' : day < doneUpTo ? 'done' : day === todayIdx ? 'today' : 'future');
  const plan: RoadmapNode[] = Array.from({ length: PLAN_LENGTH_DAYS }, (_, day) => ({ day, state: inCycle ? 'done' : state(day, true), week: planWeekOf(day), stage: planStageOf(day) }));
  const cycle: RoadmapNode[] = Array.from({ length: CYCLE_DAYS }, (_, day) => ({ day, state: state(day, inCycle), week: 0, stage: CYCLE_STAGE, cycle: true }));
  return [...plan, ...cycle];
}

/**
 * Whether a plan day's session is a lighter (deload) one — the same rule the session uses: plan week 4
 * always; the current plan week too when an early deload is running or due now.
 */
export function deloadOnPlanDay(t: TrainingState, today: string, day: number, strengthFalling = false, cycle = false): boolean {
  const pos = todayPlanPosition(t, today);
  // the cycle's light day is its 7th (the whole cycle while an early deload runs); in the cycle the
  // plan's days show only their own light weeks
  if (cycle) {
    if (!isCycle(pos.planNumber)) return day === CYCLE_DAYS - 1;
    return deloadDue({ planNumber: pos.planNumber, planDay: day, lastDeloadWeek: t.lastDeloadWeek, strengthFalling }) || planWeekNumber(pos.planNumber, day) === t.lastDeloadWeek;
  }
  if (planWeekOf(day) === 3) return true;
  if (isCycle(pos.planNumber)) return false;
  if (planWeekOf(day) !== planWeekOf(pos.planDay)) return false;
  return deloadDue({ planNumber: pos.planNumber, planDay: day, lastDeloadWeek: t.lastDeloadWeek, strengthFalling }) || planWeekNumber(pos.planNumber, day) === t.lastDeloadWeek;
}

/**
 * Week header title and text for week 0..3 of a stage, numbered across the plan ("5. Hafta: Kontrol"
 * in stage 2). Stages 2–6 open with "Tazele" instead of "Kası tanı"; the light week names its days.
 */
export function weekTheme(week: number, stage = 0): { title: string; text: string } {
  if (stage >= CYCLE_STAGE) return KEGEL_WEEK_THEME_CYCLE;
  const w = Math.min(3, Math.max(0, week));
  const base = stage > 0 && w === 0 ? KEGEL_WEEK_THEME_RESTART : KEGEL_WEEK_THEMES[w]!;
  const off = stage * PLAN_STAGE_DAYS;
  return {
    title: base.title.replace(/\d+/, String(stage * 4 + w + 1)),
    text: off ? base.text.replace(/(\d+)(\.?)(\s*[–-]\s*)(\d+)/, (_m, a: string, dot: string, dash: string, b: string) => `${Number(a) + off}${dot}${dash}${Number(b) + off}`) : base.text,
  };
}

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
