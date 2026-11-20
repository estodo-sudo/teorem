import type { IconName } from '@/components/Icon';
import cuesJson from '@/content/kegel/cues.tr.json';
import tracksJson from '@/content/kegel/tracks.tr.json';
import type { DurationPreset, Goal, KegelExerciseType, Position, TrackId } from '@/types';

/** Programme tracks (SPEC_KEGEL_V2 §3) and position progression (§5). Pure. */

export interface KegelCue {
  id: string;
  phase: 'squeeze' | 'release' | 'breath';
  types: string[];
  text: string;
}
export interface TrackInfo {
  id: TrackId;
  icon: IconName;
  title: string;
  text: string;
  note?: string;
  requiresClearance?: boolean;
  sourceIds: string[];
}

export const KEGEL_CUES = cuesJson.cues as KegelCue[];
export const KEGEL_TRACKS = tracksJson.tracks as TrackInfo[];
export const KEGEL_WEEK_THEMES = tracksJson.weekThemes;

export const DURATION_SEC: Record<DurationPreset, number> = { quick: 180, standard: 300, full: 480 };
export const DURATION_ORDER: DurationPreset[] = ['quick', 'standard', 'full'];
/** One preset shorter (for "hard" feedback); the shortest stays. */
export const shorterPreset = (p: DurationPreset): DurationPreset => DURATION_ORDER[Math.max(0, DURATION_ORDER.indexOf(p) - 1)]!;

/** Main blocks per session (§6.1: 3–5). */
export const MAIN_BLOCKS: Record<DurationPreset, number> = { quick: 3, standard: 4, full: 5 };

/**
 * Each track's main-block rotation. A session takes MAIN_BLOCKS[preset] blocks starting at an offset
 * that moves with the day, so consecutive days mix the order.
 */
export const TRACK_SEQUENCE: Record<TrackId, KegelExerciseType[]> = {
  general: ['slow_hold', 'quick_flick', 'elevator', 'endurance', 'slow_hold'],
  erection: ['max_contraction', 'slow_hold', 'max_contraction', 'quick_flick', 'max_contraction'],
  control: ['quick_flick', 'release', 'slow_hold', 'quick_flick', 'release'],
  bladder: ['slow_hold', 'quick_flick', 'knack', 'slow_hold', 'knack'],
  surgery: ['slow_hold', 'quick_flick', 'knack', 'slow_hold', 'quick_flick'],
  relax: ['release', 'slow_hold', 'release', 'quick_flick', 'release'],
};

/** Exercise types that contract the muscle (count toward caps). */
export const CONTRACTION_TYPES: ReadonlySet<KegelExerciseType> = new Set(['slow_hold', 'quick_flick', 'max_contraction', 'elevator', 'endurance', 'knack']);

/** Priority when several goals are chosen (user decision): surgery > bladder > erection > control > general. */
export const TRACK_PRIORITY: TrackId[] = ['surgery', 'bladder', 'erection', 'control', 'general'];
const GOAL_TRACK: Record<Goal, TrackId> = { postSurgery: 'surgery', bladder: 'bladder', erection: 'erection', endurance: 'control', confidence: 'general', general: 'general' };

/** Primary track from the onboarding goals. The surgery track needs the doctor's clearance (§11.3). */
export function goalsToTrack(goals: Goal[], surgeryCleared = false): TrackId {
  const wanted = new Set(goals.map((g) => GOAL_TRACK[g]));
  if (!surgeryCleared) wanted.delete('surgery');
  return TRACK_PRIORITY.find((t) => wanted.has(t)) ?? 'general';
}

/** Whether a track may be opened. */
export const trackAllowed = (track: TrackId, surgeryCleared: boolean) => track !== 'surgery' || surgeryCleared;

/**
 * In-session positions for a programme week (0-based), easiest first (§5):
 * week 1 lying → weeks 2–3 + sitting → week 4+ + standing. Erection: all three every session.
 * Relaxation: lying and sitting only. Surgery: one step slower.
 */
export function positionsFor(track: TrackId, weekIndex: number): Position[] {
  const w = Math.max(0, weekIndex);
  if (track === 'erection') return ['lying', 'sitting', 'standing'];
  if (track === 'relax') return w === 0 ? ['lying'] : ['lying', 'sitting'];
  const shift = track === 'surgery' ? 1 : 0;
  if (w < 1 + shift) return ['lying'];
  if (w < 3 + shift) return ['lying', 'sitting'];
  return ['lying', 'sitting', 'standing'];
}

/** Functional everyday tasks (stand up, stairs, after urinating) start in week 6. */
export const FUNCTIONAL_FROM_WEEK = 5;
export const functionalUnlocked = (weekIndex: number) => weekIndex >= FUNCTIONAL_FROM_WEEK;
