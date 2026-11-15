/**
 * Thin wrapper around expo-iap (StoreKit 2 / Play Billing). The ONLY network
 * use in the app, and it goes through the platform store — no own backend,
 * no RevenueCat. Everything is guarded so the app works offline / on web.
 */
import { Platform } from 'react-native';

import { OFFER_LIFETIME, ONE_TIME_SKUS, PRODUCT_IDS, SUBSCRIPTION_SKUS, type PlanKey } from '@/config/monetization';
import { useEntitlementStore } from '@/stores/entitlementStore';

import { resolveEntitlement, type VerifiedPurchase } from './entitlement';
import { sortOffers, trialDaysFromPeriod, type Offer } from './pricing';

type IapModule = typeof import('expo-iap');
let mod: IapModule | null | undefined;

function iap(): IapModule | null {
  if (mod !== undefined) return mod;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return (mod = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('expo-iap') as IapModule;
  } catch {
    mod = null; // e.g. Expo Go without the native module
  }
  return mod;
}

let connected: Promise<boolean> | null = null;
function connect(): Promise<boolean> {
  const m = iap();
  if (!m) return Promise.resolve(false);
  if (!connected) {
    connected = m.initConnection().then(
      (ok) => !!ok,
      () => {
        connected = null;
        return false;
      },
    );
  }
  return connected;
}

const keyFor = (productId: string): PlanKey | undefined =>
  (Object.keys(PRODUCT_IDS) as PlanKey[]).find((k) => PRODUCT_IDS[k] === productId);

type AnyProduct = {
  id: string;
  displayPrice: string;
  price?: number | null;
  currency: string;
  type: 'subs' | 'in-app';
  subscriptionOffers?: { offerTokenAndroid?: string | null; paymentMode?: string | null; period?: { unit: string; value: number } | null; periodCount?: number | null; type?: string }[] | null;
  introductoryPricePaymentModeIOS?: string;
  introductoryPriceSubscriptionPeriodIOS?: string | null;
  introductoryPriceNumberOfPeriodsIOS?: string | null;
};

function toOffer(p: AnyProduct): Offer | null {
  const key = keyFor(p.id);
  if (!key) return null;
  const offers = p.subscriptionOffers ?? [];
  const trial = offers.find((o) => o.paymentMode === 'free-trial');
  let trialDays = trial ? trialDaysFromPeriod(trial.period as never) : undefined;
  if (!trialDays && p.introductoryPricePaymentModeIOS === 'free-trial') {
    const unit = (p.introductoryPriceSubscriptionPeriodIOS ?? '').toLowerCase();
    const n = Number(p.introductoryPriceNumberOfPeriodsIOS ?? '1') || 1;
    trialDays = trialDaysFromPeriod({ unit: (['day', 'week', 'month', 'year'].includes(unit) ? unit : 'unknown') as never, value: 1, count: n });
  }
  // Android: prefer the free-trial offer token, else the base plan's token.
  const androidOfferToken = (trial?.offerTokenAndroid ?? offers.find((o) => o.offerTokenAndroid)?.offerTokenAndroid) ?? undefined;
  return {
    key,
    productId: p.id,
    displayPrice: p.displayPrice,
    price: p.price ?? undefined,
    currency: p.currency,
    trialDays,
    androidOfferToken,
    type: p.type,
  };
}

/** Fetches the paywall plans with real store prices. Returns [] when unavailable. */
export async function loadOffers(): Promise<Offer[]> {
  const m = iap();
  if (!m || !(await connect())) return [];
  try {
    const subs = ((await m.fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' })) ?? []) as unknown as AnyProduct[];
    const once = OFFER_LIFETIME ? (((await m.fetchProducts({ skus: ONE_TIME_SKUS, type: 'in-app' })) ?? []) as unknown as AnyProduct[]) : [];
    return sortOffers([...subs, ...once].map(toOffer).filter((o): o is Offer => !!o));
  } catch {
    return [];
  }
}

/** Starts a purchase; the result arrives via the purchase listener. */
export async function purchase(offer: Offer): Promise<void> {
  const m = iap();
  if (!m || !(await connect())) throw new Error('store-unavailable');
  if (offer.type === 'subs') {
    await m.requestPurchase({
      type: 'subs',
      request: {
        apple: { sku: offer.productId },
        google: {
          skus: [offer.productId],
          subscriptionOffers: offer.androidOfferToken ? [{ sku: offer.productId, offerToken: offer.androidOfferToken }] : undefined,
        },
      },
    });
  } else {
    await m.requestPurchase({ type: 'in-app', request: { apple: { sku: offer.productId }, google: { skus: [offer.productId] } } });
  }
}

export function isUserCancelled(e: unknown): boolean {
  const m = iap();
  try {
    return !!m && m.isUserCancelledError(e);
  } catch {
    return false;
  }
}

/** Asks the store what is currently owned. null = could not verify (offline). */
async function verifyWithStore(): Promise<VerifiedPurchase[] | null> {
  const m = iap();
  if (!m || !(await connect())) return null;
  try {
    const active = await m.getActiveSubscriptions(SUBSCRIPTION_SKUS);
    const out: VerifiedPurchase[] = active
      .filter((s) => s.isActive)
      .map((s) => ({
        productId: s.productId,
        // Android does not expose expiry client-side: treat as active for a
        // renewal cycle from now; it is re-verified at every launch.
        expiresAtMs: s.expirationDateIOS ?? Date.now() + 35 * 86_400_000,
      }));
    if (OFFER_LIFETIME) {
      const owned = await m.getAvailablePurchases();
      owned.filter((p) => ONE_TIME_SKUS.includes(p.productId)).forEach((p) => out.push({ productId: p.productId }));
    }
    return out;
  } catch {
    return null;
  }
}

/** Silently re-verifies the entitlement; keeps the cache when offline. */
export async function refreshEntitlement(): Promise<void> {
  const verified = await verifyWithStore();
  const store = useEntitlementStore.getState();
  store.set(resolveEntitlement(store.entitlement, verified, new Date()));
}

export async function restorePurchases(): Promise<boolean> {
  const m = iap();
  if (!m || !(await connect())) return false;
  try {
    await m.restorePurchases();
  } catch {
    // fall through to verification
  }
  await refreshEntitlement();
  return useEntitlementStore.getState().entitlement.active;
}

/** Listens for completed purchases: finish the transaction and unlock. */
export function startPurchaseListener(onUnlocked?: () => void): () => void {
  const m = iap();
  if (!m) return () => {};
  const sub = m.purchaseUpdatedListener(async (p) => {
    try {
      if (p.purchaseState === 'purchased') {
        await m.finishTransaction({ purchase: p, isConsumable: false });
        await refreshEntitlement();
        if (useEntitlementStore.getState().entitlement.active) onUnlocked?.();
      }
    } catch {
      // ignore; restore will pick it up
    }
  });
  return () => sub.remove();
}

export async function openManageSubscriptions(): Promise<void> {
  const m = iap();
  if (!m) return;
  try {
    await m.deepLinkToSubscriptions();
  } catch {
    // ignore
  }
}
