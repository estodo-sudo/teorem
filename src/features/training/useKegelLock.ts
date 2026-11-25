import { useNow } from '@/lib/useNow';
import { useHistoryStore } from '@/stores/historyStore';

import { formatLockLeft, kegelLock } from './cooldown';

/** The Kegel rest lock with a live "hh:mm:ss" countdown (refreshed every second). */
export function useKegelLock(): { locked: boolean; left: string; rounds: number } {
  const workouts = useHistoryStore((s) => s.workouts);
  const now = useNow(1000);
  const lock = kegelLock(workouts, now);
  return { locked: !!lock.until, left: lock.until ? formatLockLeft(lock.until, now) : '', rounds: lock.rounds };
}
