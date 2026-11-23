/**
 * Sigarasız Kamp assessment (K2): turns the 10 answers into a profile, a price and a quit plan.
 * Pure functions; the screen only collects answers.
 */
import { computeHSI, hsiLevel } from './engine/hsi';
import { cutDownPlan } from './engine/plans';
import { DAY_MS } from '@/features/camps/core/time';
import { DEFAULT_PREP_DAYS, MAX_PREP_DAYS, MIN_PREP_DAYS, quitDateIn } from './state';
import type { AgeRange, CampProfile, FirstCigMinutes, ProductType, QuitMethod, Reason, ReasonId, RelapseCause, TriggerId } from './types';

export const PER_DAY_MIN = 1;
export const PER_DAY_MAX = 80;
export const HOOKAH_WEEK_MAX = 30;
export const PACK_SIZE_DEFAULT = 20;
export const CUT_WEEKS = [2, 3, 4] as const;
/** "Already quit": how far back the last cigarette may be (beyond this the camp is mostly done). */
export const ALREADY_QUIT_MAX_DAYS = 90;
/** First if–then plans made during the assessment. */
export const FIRST_PLANS = 3;

export interface Answers {
  products: ProductType[];
  perDay: number;
  hookahPerWeek: number;
  firstCig: FirstCigMinutes | null;
  years: number;
  /** Text as typed (comma or dot decimals). */
  priceText: string;
  packSize: number;
  reasonIds: ReasonId[];
  customReason: string;
  /** Private copy in the app's documents (optional). */
  reasonPhotoUri?: string;
  triggers: TriggerId[];
  pastAttempts: 0 | 1 | 3 | null;
  relapseCauses: RelapseCause[];
  method: QuitMethod;
  quitInDays: number;
  cutWeeks: number;
  quitDaysAgo: number;
  supporterName: string;
  ageRange: AgeRange | null;
}

export const defaultAnswers = (): Answers => ({
  products: [],
  perDay: 15,
  hookahPerWeek: 3,
  firstCig: null,
  years: 5,
  priceText: '',
  packSize: PACK_SIZE_DEFAULT,
  reasonIds: [],
  customReason: '',
  triggers: [],
  pastAttempts: null,
  relapseCauses: [],
  method: 'quit_day',
  quitInDays: DEFAULT_PREP_DAYS,
  cutWeeks: 3,
  quitDaysAgo: 0,
  supporterName: '',
  ageRange: null,
});

/** Products counted per day (everything except hookah, which is counted per week). */
export const hasDailyProduct = (p: ProductType[]) => p.some((x) => x !== 'hookah');
export const hasHookah = (p: ProductType[]) => p.includes('hookah');

/** Daily amount used for counters and savings: per-day products, or hookah sessions spread over the week. */
export function effectivePerDay(a: Pick<Answers, 'products' | 'perDay' | 'hookahPerWeek'>): number {
  if (hasDailyProduct(a.products)) return a.perDay;
  if (hasHookah(a.products)) return Math.round((a.hookahPerWeek / 7) * 100) / 100;
  return a.perDay;
}

/** Parses a typed price ("85", "85,50", "1.250") into TL; null when empty or invalid. */
export function parsePriceTRY(text: string): number | null {
  const t = text.trim().replace(/\s/g, '');
  if (!t) return null;
  // "1.250" or "1.250,50" → thousands dot; otherwise a single dot/comma is the decimal mark.
  const normal = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(',', '.');
  const n = Number(normal);
  return Number.isFinite(n) && n > 0 && n < 100_000 ? Math.round(n * 100) / 100 : null;
}

export type StepId = 'products' | 'amount' | 'firstCig' | 'years' | 'price' | 'reasons' | 'triggers' | 'attempts' | 'method' | 'support';

/** Error key (i18n `camp.onb.err.*`) when a step can't be left yet; null when it's fine. */
export function stepError(step: StepId, a: Answers): string | null {
  switch (step) {
    case 'products':
      return a.products.length ? null : 'products';
    case 'firstCig':
      return a.firstCig === null ? 'firstCig' : null;
    case 'price':
      return parsePriceTRY(a.priceText) === null ? 'price' : a.packSize < 1 ? 'packSize' : null;
    case 'reasons':
      return a.reasonIds.length || a.customReason.trim() ? null : 'reasons';
    case 'triggers':
      return a.triggers.length ? null : 'triggers';
    case 'attempts':
      return a.pastAttempts === null ? 'attempts' : null;
    // The support step no longer asks the age (2026-11-23); the profile uses a default range.
    default:
      return null;
  }
}

/** The quit plan for the chosen method: a planned quit day, or the moment of the last cigarette for "already quit". */
export function quitPlan(a: Pick<Answers, 'method' | 'quitInDays' | 'cutWeeks' | 'quitDaysAgo'>, now: Date): { plannedQuitDate: string; quitAt?: string } {
  if (a.method === 'already_quit') {
    const days = Math.min(ALREADY_QUIT_MAX_DAYS, Math.max(0, Math.round(a.quitDaysAgo)));
    const quitAt = new Date(now.getTime() - days * DAY_MS).toISOString();
    return { plannedQuitDate: quitAt, quitAt };
  }
  if (a.method === 'cut_down') {
    const weeks = cutDownPlan(1, a.cutWeeks).length;
    return { plannedQuitDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + weeks * 7).toISOString() };
  }
  return { plannedQuitDate: quitDateIn(Math.min(MAX_PREP_DAYS, Math.max(MIN_PREP_DAYS, a.quitInDays)), now) };
}

export function buildProfile(a: Answers, now: Date): CampProfile {
  const perDay = effectivePerDay(a);
  const hsiScore = computeHSI(perDay, a.firstCig ?? 61);
  const reasons: Reason[] = a.reasonIds.map((id) => ({ id }));
  if (a.customReason.trim()) reasons.push({ id: 'custom', text: a.customReason.trim().slice(0, 200) });
  return {
    products: a.products,
    perDay,
    hookahPerWeek: hasHookah(a.products) ? a.hookahPerWeek : undefined,
    firstCigMinutes: a.firstCig ?? 61,
    hsiScore,
    hsiLevel: hsiLevel(hsiScore),
    years: a.years,
    ageRange: a.ageRange ?? '25to39',
    reasons,
    reasonPhotoUri: a.reasonPhotoUri,
    triggers: a.triggers,
    pastAttempts: a.pastAttempts ?? 0,
    relapseCauses: a.pastAttempts ? a.relapseCauses : [],
    method: a.method,
    supporterName: a.supporterName.trim() ? a.supporterName.trim().slice(0, 40) : undefined,
    createdAt: now.toISOString(),
  };
}

/** Triggers that get a first if–then plan: the first three chosen, in the order shown. */
export const planTriggers = (triggers: TriggerId[], order: TriggerId[]) => order.filter((t) => triggers.includes(t)).slice(0, FIRST_PLANS);
