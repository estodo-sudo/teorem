/**
 * Monetisation configuration. No prices are hard-coded anywhere: they are
 * always fetched from the store (App Store / Google Play).
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

/** Number of free main workouts in hard mode. */
export const HARD_MODE_FREE_WORKOUTS = 1;

export const PRODUCT_IDS = {
  weekly: 'premium_weekly',
  monthly: 'premium_monthly',
  yearly: 'premium_yearly',
  lifetime: 'premium_lifetime',
} as const;

export type PlanKey = keyof typeof PRODUCT_IDS;

/** Subscription products (lifetime is a one-time purchase). */
export const SUBSCRIPTION_SKUS: string[] = [PRODUCT_IDS.weekly, PRODUCT_IDS.monthly, PRODUCT_IDS.yearly];
export const ONE_TIME_SKUS: string[] = [PRODUCT_IDS.lifetime];

/** Whether the optional lifetime product is offered on the paywall. */
export const OFFER_LIFETIME = true;

/** Free trial length attached to the yearly plan (configured in the stores). */
export const YEARLY_TRIAL_DAYS = 7;

/**
 * When offline, the last verified entitlement stays valid for this long after
 * its expiry / last verification (tolerance for flights, roaming, etc.).
 */
export const ENTITLEMENT_OFFLINE_GRACE_DAYS = 7;

/** Developer flag: skip the paywall entirely in development builds. */
export const DEV_BYPASS_PAYWALL = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
