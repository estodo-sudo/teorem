import { HARD_MODE_FREE_WORKOUTS } from '@/config/monetization';
import { isEntitlementValid, resolveEntitlement } from '@/features/purchases/entitlement';
import { hasAccess, type GateContext } from '@/features/purchases/gate';
import { monthlyEquivalent, trialDaysFromPeriod, trialEndDate, yearlySavingPercent, type Offer } from '@/features/purchases/pricing';

const now = new Date('2026-11-15T12:00:00Z');
const DAY = 86_400_000;

describe('entitlement cache', () => {
  it('inactive is never valid', () => {
    expect(isEntitlementValid({ active: false }, now)).toBe(false);
  });
  it('lifetime (no expiry) is valid', () => {
    expect(isEntitlementValid({ active: true, productId: 'life' }, now)).toBe(true);
  });
  it('subscription stays valid during offline grace after expiry', () => {
    const exp = new Date(now.getTime() - 3 * DAY).toISOString();
    expect(isEntitlementValid({ active: true, expiresAt: exp }, now, 7)).toBe(true);
    const old = new Date(now.getTime() - 8 * DAY).toISOString();
    expect(isEntitlementValid({ active: true, expiresAt: old }, now, 7)).toBe(false);
  });
  it('keeps the cache when verification could not run (offline)', () => {
    const cached = { active: true, productId: 'y', expiresAt: '2026-12-01T00:00:00Z' };
    expect(resolveEntitlement(cached, null, now)).toBe(cached);
  });
  it('picks the latest-expiring live subscription', () => {
    const r = resolveEntitlement(
      { active: false },
      [
        { productId: 'm', expiresAtMs: now.getTime() + 5 * DAY },
        { productId: 'y', expiresAtMs: now.getTime() + 300 * DAY },
        { productId: 'old', expiresAtMs: now.getTime() - DAY },
      ],
      now,
    );
    expect(r).toMatchObject({ active: true, productId: 'y' });
    expect(r.lastVerifiedAt).toBe(now.toISOString());
  });
  it('lifetime wins over subscriptions', () => {
    const r = resolveEntitlement({ active: false }, [{ productId: 'm', expiresAtMs: now.getTime() + DAY }, { productId: 'life' }], now);
    expect(r).toMatchObject({ active: true, productId: 'life' });
    expect(r.expiresAt).toBeUndefined();
  });
  it('becomes inactive when the store reports nothing live', () => {
    expect(resolveEntitlement({ active: true, productId: 'y' }, [], now)).toMatchObject({ active: false });
  });
});

const ctx = (patch: Partial<GateContext>): GateContext => ({
  mode: 'hard',
  entitled: false,
  completedWorkouts: 0,
  level: 1,
  devBypass: false,
  ...patch,
});

describe('paywall gate', () => {
  it('hard mode: first workout free, then premium', () => {
    expect(hasAccess('workout', ctx({}))).toBe(true);
    expect(hasAccess('workout', ctx({ completedWorkouts: HARD_MODE_FREE_WORKOUTS }))).toBe(false);
    expect(hasAccess('stories', ctx({}))).toBe(false);
    expect(hasAccess('workout', ctx({ completedWorkouts: 9, entitled: true }))).toBe(true);
  });
  it('freemium: base plan free, advanced levels + courses + fitness premium', () => {
    const f = (p: Partial<GateContext>) => ctx({ mode: 'freemium', ...p });
    expect(hasAccess('workout', f({ level: 5, completedWorkouts: 40 }))).toBe(true);
    expect(hasAccess('workout', f({ level: 6 }))).toBe(false);
    expect(hasAccess('stories', f({}))).toBe(true);
    expect(hasAccess('mind', f({}))).toBe(true);
    expect(hasAccess('courses', f({}))).toBe(false);
    expect(hasAccess('fitness', f({}))).toBe(false);
    expect(hasAccess('courses', f({ entitled: true }))).toBe(true);
  });
  it('dev bypass unlocks everything', () => {
    expect(hasAccess('courses', ctx({ devBypass: true, completedWorkouts: 99 }))).toBe(true);
  });
});

const offer = (key: Offer['key'], price?: number, currency = 'TRY'): Offer => ({
  key,
  productId: key,
  displayPrice: `${price}`,
  price,
  currency,
  type: key === 'lifetime' ? 'in-app' : 'subs',
});

describe('pricing (transparent)', () => {
  it('monthly equivalent is computed from real store prices', () => {
    expect(monthlyEquivalent(offer('yearly', 600), 'en-US')).toMatch(/^TRY\s50\.00$/);
    expect(monthlyEquivalent(offer('weekly', 30), 'en-US')).toMatch(/^TRY\s130\.00$/);
    expect(monthlyEquivalent(offer('lifetime', 900))).toBeNull();
    expect(monthlyEquivalent(offer('yearly', undefined))).toBeNull();
  });
  it('saving is real (floored) and hidden when there is none', () => {
    expect(yearlySavingPercent(offer('yearly', 600), offer('monthly', 100))).toBe(50);
    expect(yearlySavingPercent(offer('yearly', 1300), offer('monthly', 100))).toBeNull();
    expect(yearlySavingPercent(offer('yearly', 600, 'USD'), offer('monthly', 100))).toBeNull();
    expect(yearlySavingPercent(offer('yearly', 600), undefined)).toBeNull();
  });
  it('computes trial length and end date', () => {
    expect(trialDaysFromPeriod({ unit: 'day', value: 7 })).toBe(7);
    expect(trialDaysFromPeriod({ unit: 'week', value: 1 })).toBe(7);
    expect(trialDaysFromPeriod(null)).toBeUndefined();
    expect(trialEndDate(new Date(2026, 10, 28), 7)).toEqual(new Date(2026, 11, 5));
  });
});

describe('monthlyDifference (paywall plan chips)', () => {
  const { monthlyDifference } = jest.requireActual('@/features/purchases/pricing') as typeof import('@/features/purchases/pricing');
  const yearly: Offer = { key: 'yearly', productId: 'y', displayPrice: '₺600', price: 600, currency: 'TRY', type: 'subs' };
  const monthly: Offer = { key: 'monthly', productId: 'm', displayPrice: '₺80', price: 80, currency: 'TRY', type: 'subs' };
  it('shows the honest per-month difference from the selected plan', () => {
    expect(monthlyDifference(monthly, yearly)?.sign).toBe('+');
    expect(monthlyDifference(yearly, monthly)?.sign).toBe('-');
  });
  it('returns null without prices, across currencies or for lifetime', () => {
    expect(monthlyDifference({ ...monthly, price: undefined }, yearly)).toBeNull();
    expect(monthlyDifference({ ...monthly, currency: 'USD' }, yearly)).toBeNull();
    expect(monthlyDifference({ ...monthly, key: 'lifetime', type: 'in-app' }, yearly)).toBeNull();
    expect(monthlyDifference(monthly, monthly)).toBeNull();
  });
});

describe('weeklyEquivalent (paywall plan cards)', () => {
  const { weeklyEquivalent } = jest.requireActual('@/features/purchases/pricing') as typeof import('@/features/purchases/pricing');
  const yearly: Offer = { key: 'yearly', productId: 'y', displayPrice: '₺520', price: 520, currency: 'TRY', type: 'subs' };
  it('divides the store price honestly and rounds down', () => {
    expect(weeklyEquivalent(yearly)).toContain('10');
    expect(weeklyEquivalent({ ...yearly, key: 'monthly', price: 52 })).toContain('12');
  });
  it('returns null for weekly, lifetime or unknown prices', () => {
    expect(weeklyEquivalent({ ...yearly, key: 'weekly' })).toBeNull();
    expect(weeklyEquivalent({ ...yearly, key: 'lifetime', type: 'in-app' })).toBeNull();
    expect(weeklyEquivalent({ ...yearly, price: undefined })).toBeNull();
  });
});
