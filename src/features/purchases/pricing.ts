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
  /** A trial price for previews (no store): shown, never purchasable. */
  preview?: boolean;
  /** "Fırsat" plans: the regular plan's store price, shown crossed out (only when it is really higher). */
  compareAt?: string;
  /** The crossed-out price as a number (for the "%11 indirim" ribbon). */
  compareAtPrice?: number;
}

/**
 * The weekly, monthly and yearly plans at the trial prices, for previews only. Every plan starts with the
 * free trial (2026-11-26). With `offer`, the monthly and weekly plans take the offer's lower prices and
 * show the regular ones crossed out; otherwise `list` gives full prices to cross out (weekly 99,90).
 */
export function previewOffers(
  prices: { currency: string; weekly: number; monthly: number; yearly: number },
  trialDays: number,
  locale = 'tr-TR',
  offer?: { weekly: number; monthly: number },
  list?: Partial<Record<'weekly' | 'monthly' | 'yearly', number>>,
): Offer[] {
  return (['yearly', 'monthly', 'weekly'] as const).map((key) => {
    const low = offer && key !== 'yearly' ? offer[key] : undefined;
    const amount = low ?? prices[key];
    const was = low !== undefined ? prices[key] : list?.[key];
    return {
      key,
      productId: low !== undefined ? `preview_${key}_offer` : `preview_${key}`,
      displayPrice: formatMoney(amount, prices.currency, locale),
      price: amount,
      currency: prices.currency,
      ...(trialDays > 0 ? { trialDays } : {}),
      ...(was !== undefined && was > amount ? { compareAt: formatMoney(was, prices.currency, locale), compareAtPrice: was } : {}),
      type: 'subs' as const,
      preview: true,
    };
  });
}

/** Offer plans with the regular plan's price crossed out, where the regular one really costs more. */
export function withCompareAt(offer: Offer[], regular: Offer[]): Offer[] {
  return offer.map((o) => {
    const r = regular.find((x) => x.key === o.key);
    return r && o.key !== 'yearly' && r.productId !== o.productId && r.price != null && o.price != null && r.price > o.price && r.currency === o.currency ? { ...o, compareAt: r.displayPrice, compareAtPrice: r.price } : o;
  });
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

/** Real weekly-equivalent of a plan (store price only, rounded down); null for weekly, lifetime or unknown prices. */
export function weeklyEquivalent(offer: Offer, locale = 'tr-TR'): string | null {
  if (offer.price == null || !offer.currency) return null;
  const perWeek = { weekly: NaN, monthly: (offer.price * 12) / 52, yearly: offer.price / 52, lifetime: NaN }[offer.key];
  if (!Number.isFinite(perWeek)) return null;
  return formatMoney(Math.floor(perWeek * 100) / 100, offer.currency, locale);
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

/**
 * How much more (+) or less (−) `other` costs per month than `selected`, store prices only.
 * null when a price or currency is missing, currencies differ, a plan is lifetime, or the difference is 0.
 */
export function monthlyDifference(other: Offer, selected: Offer, locale = 'tr-TR'): { sign: '+' | '-'; amount: string } | null {
  const per = (o: Offer) => (o.price == null ? NaN : { weekly: (o.price * 52) / 12, monthly: o.price, yearly: o.price / 12, lifetime: NaN }[o.key]);
  if (!other.currency || other.currency !== selected.currency) return null;
  const diff = per(other) - per(selected);
  if (!Number.isFinite(diff)) return null;
  // Round down to the cent so a difference is never overstated.
  const cents = Math.floor(Math.abs(diff) * 100);
  if (cents === 0) return null;
  return { sign: diff > 0 ? '+' : '-', amount: formatMoney(cents / 100, other.currency, locale) };
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
