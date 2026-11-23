import { ENTITLEMENT_OFFLINE_GRACE_DAYS, ONE_TIME_SKUS } from '@/config/monetization';
import type { Entitlement } from '@/types';

const DAY = 86_400_000;

/**
 * Whether the cached entitlement should be honoured right now.
 * - Active with no expiry (lifetime) → valid.
 * - Active subscription → valid until expiresAt + offline grace period.
 *   (When online, the platform is re-checked at launch and the cache updated.)
 */
export function isEntitlementValid(e: Entitlement, now: Date, graceDays = ENTITLEMENT_OFFLINE_GRACE_DAYS): boolean {
  if (!e || e.active !== true) return false;
  // No expiry is only right for a one-time (lifetime) product; a damaged or edited cache never unlocks
  // forever (security review 2026-11-23).
  if (!e.expiresAt) return typeof e.productId === 'string' && ONE_TIME_SKUS.includes(e.productId);
  const exp = Date.parse(e.expiresAt);
  if (Number.isNaN(exp)) return false;
  return now.getTime() <= exp + graceDays * DAY;
}

export interface VerifiedPurchase {
  productId: string;
  /** ms epoch; undefined for non-expiring (lifetime) */
  expiresAtMs?: number;
}

/**
 * Merges a platform verification result into the cached entitlement.
 * `verified === null` means verification could not run (offline / store error):
 * the cache is kept untouched so the user is not locked out on a plane.
 */
export function resolveEntitlement(
  cached: Entitlement,
  verified: VerifiedPurchase[] | null,
  now: Date,
): Entitlement {
  if (verified === null) return cached;
  const nowMs = now.getTime();
  const lifetime = verified.find((v) => v.expiresAtMs === undefined);
  if (lifetime) {
    return { active: true, productId: lifetime.productId, lastVerifiedAt: now.toISOString() };
  }
  const live = verified
    .filter((v) => (v.expiresAtMs ?? 0) > nowMs)
    .sort((a, b) => (b.expiresAtMs ?? 0) - (a.expiresAtMs ?? 0))[0];
  if (live) {
    return {
      active: true,
      productId: live.productId,
      expiresAt: new Date(live.expiresAtMs!).toISOString(),
      lastVerifiedAt: now.toISOString(),
    };
  }
  return { active: false, lastVerifiedAt: now.toISOString() };
}
