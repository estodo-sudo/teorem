/** Shared SOS helpers (pure): urge-surf timing and the wave shape. */
/** Urge-surfing lengths offered (minutes); 3 is the default. */
export const SURF_MINUTES = [3, 5] as const;
export const BREATH_MINUTES = 2;

/** Which guidance line to show: the prompts are spread evenly over the session. */
export function surfPromptIndex(elapsedSec: number, totalSec: number, count: number): number {
  if (count <= 0 || totalSec <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.floor((elapsedSec / totalSec) * count)));
}

/**
 * Height of the urge wave (0–1) over the session: it builds up to a peak at 40% of the time,
 * then fades — the shape the guidance describes ("it rises, peaks and falls").
 */
export function waveAmplitude(elapsedSec: number, totalSec: number): number {
  if (totalSec <= 0) return 0;
  const x = Math.min(1, Math.max(0, elapsedSec / totalSec));
  const peak = 0.4;
  const v = x <= peak ? Math.sin((x / peak) * (Math.PI / 2)) : Math.cos(((x - peak) / (1 - peak)) * (Math.PI / 2));
  return 0.15 + 0.85 * Math.max(0, v);
}
