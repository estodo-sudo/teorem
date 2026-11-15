import { checkAchievements } from '@/features/gamification/service';
import { onWorkoutFinalized } from '@/features/training/service';

let registered = false;

/** Wires cross-feature side effects once at startup. */
export function registerHooks() {
  if (registered) return;
  registered = true;
  onWorkoutFinalized(() => checkAchievements());
}
