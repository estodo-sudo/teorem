import type { FirstCigMinutes, HsiLevel } from '../types';

/**
 * Heaviness of Smoking Index (Heatherton et al., 1989): cigarettes per day (0–3) plus
 * time to the first cigarette after waking (0–3), total 0–6.
 *   per day: ≤10 → 0, 11–20 → 1, 21–30 → 2, 31+ → 3
 *   first cigarette: ≤5 min → 3, 6–30 → 2, 31–60 → 1, 60+ → 0
 */
export function computeHSI(perDay: number, firstCigMinutes: FirstCigMinutes): number {
  const n = Math.max(0, Math.round(perDay));
  const day = n <= 10 ? 0 : n <= 20 ? 1 : n <= 30 ? 2 : 3;
  const first = firstCigMinutes === 5 ? 3 : firstCigMinutes === 30 ? 2 : firstCigMinutes === 60 ? 1 : 0;
  return day + first;
}

/** 0–2 low, 3–4 moderate, 5–6 high dependence. */
export function hsiLevel(score: number): HsiLevel {
  return score <= 2 ? 'low' : score <= 4 ? 'mid' : 'high';
}

/** Moderate/high dependence: the medication-support card (via ALO 171) is shown prominently. */
export const showMedicationCard = (level: HsiLevel) => level !== 'low';
