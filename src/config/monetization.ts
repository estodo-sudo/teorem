/**
 * Monetisation configuration. Real prices are always fetched from the store
 * (App Store / Google Play); the only numbers here are PREVIEW_PRICES, which
 * are for previews without a store and can never be bought.
 *
 * PAYWALL_MODE
 *  - 'hard':     tutorial + first workout free, everything after needs a subscription.
 *  - 'freemium': base plan free (levels 1..FREEMIUM_MAX_LEVEL); higher levels,
 *                courses and pelvic fitness are premium.
 */
export type PaywallMode = 'hard' | 'freemium';

export const PAYWALL_MODE: PaywallMode = 'hard';

/** Highest training level available without a subscription in freemium mode. */
export const FREEMIUM_MAX_LEVEL = 5;

/** Number of free main workouts in hard mode (2026-11-26: Tur 1 is free every day; kept for freemium maths). */
export const HARD_MODE_FREE_WORKOUTS = 1;

export const PRODUCT_IDS = {
  weekly: 'premium_weekly',
  monthly: 'premium_monthly',
  yearly: 'premium_yearly',
  lifetime: 'premium_lifetime',
} as const;

export type PlanKey = keyof typeof PRODUCT_IDS;

/**
 * The "fırsat" plans (user decision 2026-11-26): the same premium at a lower monthly and weekly price,
 * offered when someone without premium tries Tur 2 or a locked tab. Separate products in the stores.
 */
export const OFFER_PRODUCT_IDS = {
  weekly: 'premium_weekly_offer',
  monthly: 'premium_monthly_offer',
} as const;

/**
 * The weekly plan on the regular paywall is sold reduced (user decision 2026-11-26: 99,90 → 89,90):
 * `premium_weekly` keeps the full price and is shown crossed out; this product is the reduced one.
 * Both are real store products, so the crossed-out price is a price that really exists.
 */
export const PROMO_PRODUCT_IDS = {
  weekly: 'premium_weekly_promo',
} as const;

/** Subscription products (lifetime is a one-time purchase); the promo and offer plans unlock premium too. */
export const SUBSCRIPTION_SKUS: string[] = [PRODUCT_IDS.weekly, PRODUCT_IDS.monthly, PRODUCT_IDS.yearly, PROMO_PRODUCT_IDS.weekly, OFFER_PRODUCT_IDS.weekly, OFFER_PRODUCT_IDS.monthly];
/**
 * What a paywall shows: the regular plans (weekly at the reduced price), or the yearly plan with the
 * offer's monthly and weekly. LIST_SKUS are the full prices the reduced weekly is compared with.
 */
export const REGULAR_SKUS: string[] = [PROMO_PRODUCT_IDS.weekly, PRODUCT_IDS.monthly, PRODUCT_IDS.yearly];
export const OFFER_SKUS: string[] = [PRODUCT_IDS.yearly, OFFER_PRODUCT_IDS.weekly, OFFER_PRODUCT_IDS.monthly];
export const LIST_SKUS: string[] = [PRODUCT_IDS.weekly];
export const ONE_TIME_SKUS: string[] = [PRODUCT_IDS.lifetime];

/** Whether the optional lifetime product is offered on the paywall (off: weekly, monthly, yearly only — 2026-11-22). */
export const OFFER_LIFETIME = false;

/** Free trial length on every plan (configured in the stores; 14 days on all three plans since 2026-11-26). */
export const TRIAL_DAYS = 14;
/** @deprecated the trial is on every plan now; same as TRIAL_DAYS. */
export const YEARLY_TRIAL_DAYS = TRIAL_DAYS;

/**
 * When offline, the last verified entitlement stays valid for this long after
 * its expiry / last verification (tolerance for flights, roaming, etc.).
 */
export const ENTITLEMENT_OFFLINE_GRACE_DAYS = 7;

/**
 * Developer flag: skip the paywall in development, and in test previews
 * (Expo Go updates, web preview) published with EXPO_PUBLIC_PREVIEW_UNLOCK=1.
 * Store builds never set it.
 */
export const DEV_BYPASS_PAYWALL =
  process.env.EXPO_PUBLIC_PAYWALL_TEST !== '1' && ((typeof __DEV__ !== 'undefined' && __DEV__) || process.env.EXPO_PUBLIC_PREVIEW_UNLOCK === '1');

/**
 * Trial ("denemelik") prices, user request 2026-11-22. Shown ONLY when the store cannot be reached in
 * development or test previews (Expo Go, web), so the paywall can be seen; they cannot be bought. Store
 * builds never show them: real prices are set in App Store Connect / Play Console and read from there.
 */
export const PREVIEW_PRICES = { currency: 'TRY', weekly: 89.9, monthly: 189.99, yearly: 669.9 } as const;
/** The full prices shown crossed out next to a reduced plan (previews only): weekly 99,90 → 89,90. */
export const LIST_PREVIEW_PRICES = { weekly: 99.9 } as const;
/** The offer's lower monthly and weekly prices (previews only, like PREVIEW_PRICES). */
export const OFFER_PREVIEW_PRICES = { currency: 'TRY', weekly: 39.9, monthly: 169.9 } as const;
/** Store-less previews (Expo Go, web) show the prices above; EXPO_PUBLIC_PAYWALL_TEST=1 tries the paywall in development. */
export const SHOW_PREVIEW_PRICES = DEV_BYPASS_PAYWALL || process.env.EXPO_PUBLIC_PAYWALL_TEST === '1';
