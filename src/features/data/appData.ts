import { campEventsSnapshot, campSnapshot, useCampEventsStore, useCampStore } from '@/stores/campStore';
import { useCampusStore } from '@/stores/campusStore';
import { useEntitlementStore } from '@/stores/entitlementStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useProfileStore } from '@/stores/profileStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrainingStore } from '@/stores/trainingStore';

import type { AppSnapshot } from './exportImport';

export function snapshotApp(): AppSnapshot {
  const p = useProgressStore.getState();
  const h = useHistoryStore.getState();
  return {
    profile: useProfileStore.getState().profile,
    settings: useSettingsStore.getState().settings,
    training: useTrainingStore.getState().training,
    progress: { content: p.content, challengeLogs: p.challengeLogs, achievements: p.achievements, lastMindSession: p.lastMindSession },
    campus: {
      smoking: useCampusStore.getState().smoking,
      masturbation: useCampusStore.getState().masturbation,
      alcohol: useCampusStore.getState().alcohol,
      porn: useCampusStore.getState().porn,
      neck: useCampusStore.getState().neck,
      feet: useCampusStore.getState().feet,
    },
    camp: { state: campSnapshot(), events: campEventsSnapshot() },
    history: { workouts: h.workouts, strengthTests: h.strengthTests, fitnessLogs: h.fitnessLogs, notes: h.notes },
  };
}

export function restoreApp(s: AppSnapshot) {
  useHistoryStore.getState().replaceAll(s.history);
  useProgressStore.getState().replace(s.progress);
  useCampusStore.getState().replace(s.campus);
  useCampStore.getState().replace(s.camp.state);
  useCampEventsStore.getState().replaceAll(s.camp.events);
  useTrainingStore.getState().replace(s.training);
  useSettingsStore.getState().replace(s.settings);
  useProfileStore.getState().replace(s.profile);
}

/** Deletes everything stored on the device (entitlement cache included). */
export function wipeApp() {
  useHistoryStore.getState().clearAll();
  useProgressStore.getState().reset();
  useCampusStore.getState().reset();
  useCampStore.getState().reset();
  useCampEventsStore.getState().clearAll();
  useTrainingStore.getState().reset();
  useSettingsStore.getState().reset();
  useEntitlementStore.getState().reset();
  useProfileStore.getState().reset();
}
