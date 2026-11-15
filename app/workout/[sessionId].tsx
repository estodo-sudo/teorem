import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/components';
import { WorkoutPlayer, type PlayerResult } from '@/features/training/player/WorkoutPlayer';
import { buildTodaySession, recordWorkout } from '@/features/training/service';
import { useTrainingStore } from '@/stores/trainingStore';

export default function WorkoutScreen() {
  const t = useTheme();
  useLocalSearchParams<{ sessionId: string }>();
  // Snapshot the training state at mount: the session must not change mid-play.
  const session = useMemo(() => buildTodaySession(useTrainingStore.getState().training), []);

  const onDone = useCallback(
    (result: PlayerResult) => {
      const w = recordWorkout(session, result);
      router.replace({ pathname: '/workout/feedback', params: { id: w.id } });
    },
    [session],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={{ flex: 1, padding: 20 }}>
        <WorkoutPlayer session={session} onDone={onDone} />
      </View>
    </SafeAreaView>
  );
}
