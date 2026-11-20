import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog } from '@/components/ui';
import { openGated } from '@/features/purchases/useGate';
import { toDateKey } from '@/lib/date';
import { useHistoryStore } from '@/stores/historyStore';
import { useTrainingStore } from '@/stores/trainingStore';

import { sessionAllowed } from './schedule';
import { contractionsToday } from './service';

/**
 * Starts a Kegel session with the daily contraction cap check (SPEC_KEGEL_V2 §11.5): over the cap, the
 * "Bugün yeterli" dialog offers a release-only session instead. Shared by the Today card and the
 * Training tab's quick start, so both behave the same. Render `dialog` once in the caller.
 */
export function useSessionStarter() {
  const { t: tr } = useTranslation();
  const [capOpen, setCapOpen] = useState(false);
  const go = (sessionId: string, contractions: number) => {
    const level = useTrainingStore.getState().training.level;
    const used = contractionsToday(useHistoryStore.getState().workouts, toDateKey());
    if (!sessionAllowed(used, contractions, level)) return setCapOpen(true);
    openGated('workout', { pathname: '/workout/[sessionId]', params: { sessionId } });
  };
  const dialog = (
    <Dialog
      visible={capOpen}
      onClose={() => setCapOpen(false)}
      title={tr('today.workout.capTitle')}
      description={tr('today.workout.capBody')}
      actions={[
        { label: tr('today.workout.capRelease'), variant: 'default', onPress: () => (setCapOpen(false), openGated('workout', { pathname: '/workout/[sessionId]', params: { sessionId: 'release' } })) },
        { label: tr('common.close'), onPress: () => setCapOpen(false) },
      ]}
    />
  );
  return { go, dialog };
}
