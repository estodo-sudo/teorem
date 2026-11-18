import { useCallback, useEffect, useState } from 'react';

/**
 * Current time, refreshed every `intervalMs` while mounted. `refresh()` updates it
 * immediately — call it right after storing a time based on `new Date()` so the
 * screen does not compare against a stale clock.
 */
export function useClock(intervalMs: number): { now: Date; refresh: () => void } {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  const refresh = useCallback(() => setNow(new Date()), []);
  return { now, refresh };
}

/** Current time, refreshed every `intervalMs` while mounted. */
export function useNow(intervalMs: number): Date {
  return useClock(intervalMs).now;
}
