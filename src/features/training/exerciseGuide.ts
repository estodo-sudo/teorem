import type { IconName } from '@/components/Icon';
import type { KegelExerciseType } from '@/types';

/** The three Kegel moves of the programme (user decision 2026-11-22), the "Egzersiz rehberi" on Profil. */
export const EXERCISE_GUIDE: { type: KegelExerciseType; icon: IconName }[] = [
  { type: 'slow_hold', icon: 'clock' },
  { type: 'quick_flick', icon: 'pulse' },
  { type: 'elevator', icon: 'layers' },
];

/**
 * Nine more moves shown locked under the three ("İlerleyen seviyelerde açılacak", user request
 * 2026-11-22): together they make a 12-move guide. Their names stay hidden until they open; the ids
 * only key the rows.
 */
export const LOCKED_EXERCISES: { id: string; icon: IconName }[] = [
  { id: 'endurance', icon: 'timer' },
  { id: 'pulse', icon: 'waves' },
  { id: 'max', icon: 'dumbbell' },
  { id: 'knack', icon: 'shield' },
  { id: 'release', icon: 'leaf' },
  { id: 'breath', icon: 'wind' },
  { id: 'bridge', icon: 'body' },
  { id: 'standing', icon: 'mountain' },
  { id: 'walking', icon: 'repeat' },
];
