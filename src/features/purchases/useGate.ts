import { router, type Href } from 'expo-router';
import { useCallback } from 'react';

import { useEntitlementStore } from '@/stores/entitlementStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useTrainingStore } from '@/stores/trainingStore';

import { isEntitlementValid } from './entitlement';
import { defaultGateContext, hasAccess, type GatedFeature } from './gate';

export function gateContextNow() {
  return defaultGateContext({
    entitled: isEntitlementValid(useEntitlementStore.getState().entitlement, new Date()),
    completedWorkouts: useHistoryStore.getState().workouts.filter((w) => w.completed).length,
    level: useTrainingStore.getState().training.level,
  });
}

export function canAccess(feature: GatedFeature): boolean {
  return hasAccess(feature, gateContextNow());
}

/** Opens a route if the user has access, otherwise the paywall. */
export function openGated(feature: GatedFeature, href: Href) {
  if (canAccess(feature)) router.push(href);
  else router.push({ pathname: '/paywall', params: { source: feature } });
}

export function useAccess() {
  // Subscribe to the inputs so components re-render when they change.
  useEntitlementStore((s) => s.entitlement);
  useHistoryStore((s) => s.workouts.length);
  useTrainingStore((s) => s.training.level);
  return useCallback((feature: GatedFeature) => canAccess(feature), []);
}
