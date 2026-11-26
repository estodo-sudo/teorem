import { useCallback, useEffect, useState } from 'react';

import { useAppActive } from './useLive';

/**
 * Current time, refreshed every `intervalMs` while mounted. `refresh()` updates it
 * immediately — call it right after storing a time based on `new Date()` so the
 * screen does not compare against a stale clock.
 */
export function useClock(intervalMs: number): { now: Date; refresh: () => void } {
  const [now, setNow] = useState(() => new Date());
  // Battery (round 8): no ticking in the background; on return the time is refreshed at once.
  const active = useAppActive();
  useEffect(() => {
    if (!active) return;
    const first = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs, active]);
  const refresh = useCallback(() => setNow(new Date()), []);
  return { now, refresh };
}

/** Current time, refreshed every `intervalMs` while mounted. */
export function useNow(intervalMs: number): Date {
  return useClock(intervalMs).now;
}
