import type { CigaretteLog, PriceEntry, QuitAttempt } from '../types';

import { slipsOf } from './counters';
import { quitStart } from './phase';
import { DAY_MS, ms } from './time';

const byFrom = (a: PriceEntry, b: PriceEntry) => ms(a.from) - ms(b.from);
const perCig = (p: PriceEntry) => (p.packSize > 0 ? p.packPriceTRY / p.packSize : 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Price in effect at a moment (the earliest entry also covers anything before it). */
export function priceAt(history: PriceEntry[], at: Date): PriceEntry | null {
  const sorted = [...history].sort(byFrom);
  if (!sorted.length) return null;
  let cur = sorted[0]!;
  for (const p of sorted) if (ms(p.from) <= at.getTime()) cur = p;
  return cur;
}

/**
 * Money saved since the quit start. Each price period is valued at its own price per cigarette:
 * cigarettes not smoked in the period (daily average × its length − its slips) × that price.
 * Updating the price later never changes what was already saved.
 */
export function moneySaved(history: PriceEntry[], perDay: number, a: QuitAttempt, logs: CigaretteLog[], now: Date): number {
  const start = ms(quitStart(a));
  const end = now.getTime();
  if (end <= start || !history.length) return 0;
  const sorted = [...history].sort(byFrom);
  const slips = slipsOf(a, logs).filter((l) => ms(l.at) <= end);
  let total = 0;
  sorted.forEach((p, i) => {
    // The first entry also covers the time before it.
    const from = i === 0 ? start : Math.max(start, ms(p.from));
    const to = i + 1 < sorted.length ? Math.min(end, ms(sorted[i + 1]!.from)) : end;
    if (to <= from) return;
    const expected = (perDay * (to - from)) / DAY_MS;
    const smoked = slips.filter((l) => ms(l.at) >= from && ms(l.at) < to).length;
    total += Math.max(0, expected - smoked) * perCig(p);
  });
  return round2(total);
}

/** Estimated savings for the plan summary (average month = 30.44 days). */
export function estimatedSavings(perDay: number, price: PriceEntry): { month: number; year: number } {
  const day = perDay * perCig(price);
  return { month: Math.round(day * 30.44), year: Math.round(day * 365) };
}
