import type { IconName } from '@/components/Icon';
import type { KegelExerciseType } from '@/types';

/** The 8 Kegel moves of the old "Egzersiz kütüphanesi", now the "Egzersiz rehberi" on Profil (SPEC_V4 §A.3). */
export const EXERCISE_GUIDE: { type: KegelExerciseType; icon: IconName }[] = [
  { type: 'slow_hold', icon: 'clock' },
  { type: 'quick_flick', icon: 'pulse' },
  { type: 'max_contraction', icon: 'target' },
  { type: 'elevator', icon: 'layers' },
  { type: 'endurance', icon: 'timer' },
  { type: 'knack', icon: 'zap' },
  { type: 'release', icon: 'leaf' },
  { type: 'breath', icon: 'wind' },
];
