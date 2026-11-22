import type { IconName } from '@/components/Icon';
import type { KegelExerciseType } from '@/types';

/** The three Kegel moves of the programme (user decision 2026-11-22), the "Egzersiz rehberi" on Profil. */
export const EXERCISE_GUIDE: { type: KegelExerciseType; icon: IconName }[] = [
  { type: 'slow_hold', icon: 'clock' },
  { type: 'quick_flick', icon: 'pulse' },
  { type: 'elevator', icon: 'layers' },
];
