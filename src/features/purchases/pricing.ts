import type { PlanKey } from '@/config/monetization';

/** A purchasable plan as shown on the paywall (all values come from the store). */
export interface Offer {
  key: PlanKey;
  productId: string;
  /** Store-formatted price string, shown verbatim. */
  displayPrice: string;
  /** Numeric price for equivalence maths (may be missing on some stores). */
  price?: number;
  currency?: string;
  /** Free-trial length in days if the store reports one. */
  trialDays?: number;
  /** Android base plan / offer token needed to purchase a subscription. */
  androidOfferToken?: string;
  type: 'subs' | 'in-app';
}

export interface TrialPeriod {
  unit: 'day' | 'week' | 'month' | 'year' | 'unknown';
  value: number;
  count?: number;
}

export function trialDaysFromPeriod(p: TrialPeriod | null | undefined): number | undefined {
  if (!p || p.value <= 0) return undefined;
  const per = { day: 1, week: 7, month: 30, year: 365, unknown: 0 }[p.unit];
  const d = per * p.value * (p.count && p.count > 0 ? p.count : 1);
  return d > 0 ? d : undefined;
}

export function formatMoney(amount: number, currency: string, locale = 'tr-TR'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Real monthly-equivalent of a plan, computed from the store price.
 * Returns null if the numeric price is unknown (we never invent a number).
 */
export function monthlyEquivalent(offer: Offer, locale = 'tr-TR'): string | null {
  if (offer.price == null || !offer.currency) return null;
  const perMonth = { weekly: (offer.price * 52) / 12, monthly: offer.price, yearly: offer.price / 12, lifetime: NaN }[offer.key];
  if (!Number.isFinite(perMonth)) return null;
  // Round down to the cent so the equivalent is never overstated as a saving.
  return formatMoney(Math.floor(perMonth * 100) / 100, offer.currency, locale);
}

/**
 * Honest saving of yearly vs paying monthly for 12 months, in whole percent.
 * null when prices are missing, currencies differ, or there is no saving.
 */
export function yearlySavingPercent(yearly: Offer | undefined, monthly: Offer | undefined): number | null {
  if (!yearly || !monthly || yearly.price == null || monthly.price == null) return null;
  if (yearly.currency !== monthly.currency) return null;
  const full = monthly.price * 12;
  if (full <= 0 || yearly.price >= full) return null;
  return Math.floor(((full - yearly.price) / full) * 100);
}

export function trialEndDate(now: Date, days: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d;
}

export const PLAN_ORDER: PlanKey[] = ['yearly', 'monthly', 'weekly', 'lifetime'];

export function sortOffers(offers: Offer[]): Offer[] {
  return [...offers].sort((a, b) => PLAN_ORDER.indexOf(a.key) - PLAN_ORDER.indexOf(b.key));
}
