import { LIST_PREVIEW_PRICES, LIST_SKUS, OFFER_LIFETIME, OFFER_PREVIEW_PRICES, OFFER_PRODUCT_IDS, OFFER_SKUS, PREVIEW_PRICES, PRODUCT_IDS, PROMO_PRODUCT_IDS, REGULAR_SKUS, SUBSCRIPTION_SKUS, TRIAL_DAYS, YEARLY_TRIAL_DAYS } from '@/config/monetization';
import { isEntitlementValid, resolveEntitlement } from '@/features/purchases/entitlement';
import { hasAccess, type GateContext } from '@/features/purchases/gate';
import { monthlyEquivalent, previewOffers, trialDaysFromPeriod, trialEndDate, withCompareAt, yearlySavingPercent, type Offer } from '@/features/purchases/pricing';

const now = new Date('2026-11-15T12:00:00Z');
const DAY = 86_400_000;

describe('entitlement cache', () => {
  it('inactive is never valid', () => {
    expect(isEntitlementValid({ active: false }, now)).toBe(false);
  });
  it('lifetime (no expiry) is valid only for the one-time product', () => {
    expect(isEntitlementValid({ active: true, productId: 'premium_lifetime' }, now)).toBe(true);
    // An edited / damaged cache never unlocks forever (security review 2026-11-23).
    expect(isEntitlementValid({ active: true, productId: 'premium_yearly' }, now)).toBe(false);
    expect(isEntitlementValid({ active: true }, now)).toBe(false);
    expect(isEntitlementValid({ active: true, productId: 'premium_yearly', expiresAt: 'not-a-date' }, now)).toBe(false);
    expect(isEntitlementValid({ active: 'true' } as never, now)).toBe(false);
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
  it('hard mode: Tur 1 free every day; Tur 2, fitness, İlerleme and Keşfet need premium', () => {
    expect(hasAccess('workout', ctx({}))).toBe(true);
    expect(hasAccess('workout', ctx({ completedWorkouts: 40 }))).toBe(true);
    for (const f of ['round2', 'fitness', 'progress', 'discover', 'stories', 'courses', 'camp'] as const) {
      expect(hasAccess(f, ctx({}))).toBe(false);
      expect(hasAccess(f, ctx({ entitled: true }))).toBe(true);
    }
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

describe('plans and trial (preview) prices', () => {
  it('offers weekly, monthly and yearly subscriptions only (plus the lower "fırsat" monthly and weekly)', () => {
    expect(OFFER_LIFETIME).toBe(false);
    // the weekly plan sells reduced; the full-price weekly product is only shown crossed out
    expect(REGULAR_SKUS).toEqual([PROMO_PRODUCT_IDS.weekly, PRODUCT_IDS.monthly, PRODUCT_IDS.yearly]);
    expect(LIST_SKUS).toEqual([PRODUCT_IDS.weekly]);
    expect(OFFER_SKUS).toEqual([PRODUCT_IDS.yearly, OFFER_PRODUCT_IDS.weekly, OFFER_PRODUCT_IDS.monthly]);
    // every plan someone can buy (or bought before) counts as premium when the store lists the active subscriptions
    expect([...REGULAR_SKUS, ...OFFER_SKUS, ...LIST_SKUS].every((s) => SUBSCRIPTION_SKUS.includes(s))).toBe(true);
    expect(TRIAL_DAYS).toBe(14);
    expect(YEARLY_TRIAL_DAYS).toBe(TRIAL_DAYS);
  });

  it('preview offers: three subscriptions, each with the 14-day trial, weekly 99,90 → 89,90, never real products', () => {
    const o = previewOffers(PREVIEW_PRICES, TRIAL_DAYS, 'tr-TR', undefined, LIST_PREVIEW_PRICES);
    expect(o.map((x) => x.key)).toEqual(['yearly', 'monthly', 'weekly']);
    expect(o.every((x) => x.preview && x.type === 'subs' && !Object.values(PRODUCT_IDS).includes(x.productId as never))).toBe(true);
    expect(o.map((x) => x.trialDays)).toEqual([14, 14, 14]);
    expect(o.map((x) => x.displayPrice.replace(/\s/g, ''))).toEqual(['₺669,90', '₺189,99', '₺89,90']);
    expect(o.map((x) => x.compareAt?.replace(/\s/g, ''))).toEqual([undefined, undefined, '₺99,90']);
    expect(o[2]!.compareAtPrice).toBe(99.9);
    // without a list price nothing is crossed out
    expect(previewOffers(PREVIEW_PRICES, TRIAL_DAYS).some((x) => x.compareAt)).toBe(false);
  });

  it('the "fırsat" preview: monthly 169,90 and weekly 39,90 with the regular prices crossed out; yearly unchanged', () => {
    const o = previewOffers(PREVIEW_PRICES, YEARLY_TRIAL_DAYS, 'tr-TR', OFFER_PREVIEW_PRICES);
    const by = Object.fromEntries(o.map((x) => [x.key, x]));
    expect(by.monthly!.displayPrice.replace(/\s/g, '')).toBe('₺169,90');
    expect(by.monthly!.compareAt!.replace(/\s/g, '')).toBe('₺189,99');
    expect(by.weekly!.displayPrice.replace(/\s/g, '')).toBe('₺39,90');
    // crossed out: what the regular paywall charges (weekly 89,90), not the old full price
    expect(by.weekly!.compareAt!.replace(/\s/g, '')).toBe('₺89,90');
    expect(by.yearly!.compareAt).toBeUndefined();
    expect(by.yearly!.trialDays).toBe(14);
    // the offer plans start with the same 14-day free trial (user decision 2026-11-26)
    expect(by.monthly!.trialDays).toBe(14);
    expect(by.weekly!.trialDays).toBe(14);
    expect(o.every((x) => x.preview && !Object.values(OFFER_PRODUCT_IDS).includes(x.productId as never))).toBe(true);
  });

  it('withCompareAt crosses out only a really higher regular price of the same plan and currency', () => {
    const mk = (key: Offer['key'], productId: string, price: number, currency = 'TRY'): Offer => ({ key, productId, displayPrice: `${price}`, price, currency, type: 'subs' });
    const regular = [mk('yearly', 'premium_yearly', 669.9), mk('monthly', 'premium_monthly', 189.99), mk('weekly', 'premium_weekly', 49.9)];
    const offer = [mk('yearly', 'premium_yearly', 669.9), mk('monthly', 'premium_monthly_offer', 169.9), mk('weekly', 'premium_weekly_offer', 39.9)];
    const r = withCompareAt(offer, regular);
    expect(r.map((x) => x.compareAt)).toEqual([undefined, '189.99', '49.9']);
    expect(r.map((x) => x.compareAtPrice)).toEqual([undefined, 189.99, 49.9]);
    // the regular paywall: the reduced weekly against the full-price weekly product
    const promo = withCompareAt([mk('weekly', 'premium_weekly_promo', 89.9), mk('monthly', 'premium_monthly', 189.99)], [mk('weekly', 'premium_weekly', 99.9)]);
    expect(promo.map((x) => x.compareAt)).toEqual(['99.9', undefined]);
    // a store that prices the offer at or above the regular plan shows no fake discount
    expect(withCompareAt([mk('monthly', 'premium_monthly_offer', 199)], regular)[0]!.compareAt).toBeUndefined();
    expect(withCompareAt([mk('monthly', 'premium_monthly_offer', 5, 'USD')], regular)[0]!.compareAt).toBeUndefined();
    expect(withCompareAt(offer, [])[1]!.compareAt).toBeUndefined();
  });

  it('yearly is the honest best value at the trial prices', () => {
    const o = previewOffers(PREVIEW_PRICES, YEARLY_TRIAL_DAYS);
    const saving = yearlySavingPercent(o[0], o[1]);
    expect(saving).toBeGreaterThan(0);
    expect(PREVIEW_PRICES.weekly * 52).toBeGreaterThan(PREVIEW_PRICES.monthly * 12);
  });
});
