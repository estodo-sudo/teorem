import { useState } from 'react';

import { useNow } from '@/lib/useNow';

/** Small helpers shared by the camps' crisis screens (SPEC_V4: surfing and the old breath tool are gone). */
/** A plain countdown with start / pause. */
export function useCountdown(totalSec: number) {
  const now = useNow(250).getTime();
  const [runningSince, setRunningSince] = useState<number | null>(null);
  const [before, setBefore] = useState(0);
  const elapsed = Math.min(totalSec, before + (runningSince !== null ? (now - runningSince) / 1000 : 0));
  const finished = elapsed >= totalSec;
  // Adjust state while rendering: stop at the end.
  if (finished && runningSince !== null) {
    setBefore(totalSec);
    setRunningSince(null);
  }
  return {
    elapsed,
    left: Math.max(0, Math.ceil(totalSec - elapsed)),
    running: runningSince !== null,
    finished,
    start: () => !finished && setRunningSince(Date.now()),
    pause: () => {
      if (runningSince === null) return;
      setBefore((b) => b + (Date.now() - runningSince) / 1000);
      setRunningSince(null);
    },
  };
}

export const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
