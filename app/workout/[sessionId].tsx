import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/components';
import { generateMicroSet, generateReleaseSession } from '@/features/training/generateSession';
import { WorkoutPlayer, type PlayerResult } from '@/features/training/player/WorkoutPlayer';
import { buildTodaySession, recordWorkout, reportPain } from '@/features/training/service';
import { goHome } from '@/lib/nav';
import { toDateKey } from '@/lib/date';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';

/**
 * Kegel player screen. `sessionId`: "release" = release-only session (after pain or over the daily
 * cap), "micro" = micro set, "round2" = Tur 2 (`first` = the Tur 1 workout id), anything else =
 * today's Tur 1. After Tur 1 the "Tur 2?" screen follows; feedback is asked once, for Tur 1.
 * Follows the app theme (dark: the focus look of SPEC_UI_V3 §7.4; light: a light player).
 */
export default function WorkoutScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { sessionId, first } = useLocalSearchParams<{ sessionId: string; first?: string }>();
  // Snapshot the training state at mount: the session must not change mid-play.
  const session = useMemo(() => {
    const training = useTrainingStore.getState().training;
    const today = toDateKey();
    if (sessionId === 'release') return generateReleaseSession(today);
    if (sessionId === 'micro') return generateMicroSet({ level: training.level, seed: `${today}-micro` });
    if (sessionId === 'round2') return buildTodaySession(training, today, { round: 2 });
    return buildTodaySession(training);
  }, [sessionId]);

  const onDone = useCallback(
    (result: PlayerResult) => {
      const w = recordWorkout(session, result);
      // Pain: no feedback (no level change); continue with release only, or stop for today.
      if (result.pain === 'release') return router.replace({ pathname: '/workout/[sessionId]', params: { sessionId: 'release' } });
      if (result.pain === 'end' || session.id.endsWith('-release')) return goHome();
      // Tur 2 done: the feedback belongs to Tur 1 (one level decision per day's session).
      if (session.round === 2) return router.replace({ pathname: '/workout/feedback', params: { id: first || w.id } });
      // Tur 1 finished: offer Tur 2 before the feedback.
      if (!session.isMicro && !result.endedEarly) return router.replace({ pathname: '/workout/next', params: { id: w.id } });
      router.replace({ pathname: '/workout/feedback', params: { id: w.id } });
    },
    [session, first],
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.player.bg }}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="focusBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.player.bg} />
            <Stop offset="1" stopColor={t.player.bgEnd} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#focusBg)" />
      </Svg>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: t.space.gutter }}>
          <WorkoutPlayer session={session} onDone={onDone} onPainReport={() => reportPain()} painNotice={useKegelStore.getState().profile?.painFlag ? tr('kegel.painNotice') : undefined} />
        </View>
      </SafeAreaView>
    </View>
  );
}
