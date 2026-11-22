import { SOUND, TOTAL_MS, type IntroSoundId } from './timeline';

/** Pure timing of the animation's sound (played by sound.ts). */

/** What has to happen when playing starts at `from`: cues to start now (with an offset) or later. */
export function soundPlan(from: number): { ambient: { offsetMs: number } | null; cues: { id: IntroSoundId; inMs: number; offsetMs: number }[] } {
  if (from >= TOTAL_MS) return { ambient: null, cues: [] };
  const cues = SOUND.cues.filter((c) => c.at + c.ms > from).map((c) => ({ id: c.id, inMs: Math.max(0, c.at - from), offsetMs: Math.max(0, from - c.at) }));
  return { ambient: { offsetMs: from % SOUND.ambient.loopMs }, cues };
}

/** Ambient loudness at a time: steady, then fading to silence over the last seconds. */
export function ambientVolume(t: number): number {
  const { volume, fadeFrom } = SOUND.ambient;
  if (t <= fadeFrom) return volume;
  return volume * Math.max(0, 1 - (t - fadeFrom) / (TOTAL_MS - fadeFrom));
}
