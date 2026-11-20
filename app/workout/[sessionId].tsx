import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/components';
import { ThemeOverride } from '@/components/useTheme';
import { generateMicroSet, generateReleaseSession } from '@/features/training/generateSession';
import { WorkoutPlayer, type PlayerResult } from '@/features/training/player/WorkoutPlayer';
import { todayWeekIndex } from '@/features/training/plan';
import { buildTodaySession, recordWorkout, reportPain } from '@/features/training/service';
import { goHome } from '@/lib/nav';
import { toDateKey } from '@/lib/date';
import { useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';

/**
 * Kegel player screen. `sessionId`: "release" = release-only session (after pain or over the daily
 * cap), "micro" = micro set, anything else = today's session. Always dark (SPEC_UI_V3 §7.4).
 */
export default function WorkoutScreen() {
  return (
    <ThemeOverride dark>
      <WorkoutScreenBody />
    </ThemeOverride>
  );
}

function WorkoutScreenBody() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  // Snapshot the training state at mount: the session must not change mid-play.
  const session = useMemo(() => {
    const training = useTrainingStore.getState().training;
    const today = toDateKey();
    if (sessionId === 'release') return generateReleaseSession(today);
    if (sessionId === 'micro') return generateMicroSet({ track: training.track, level: training.level, hypertonic: useKegelStore.getState().profile?.hypertonicFlag ?? false, seed: `${today}-micro`, weekIndex: todayWeekIndex(training, today) });
    // "Start (3 min)" from a reminder: today's session in the Quick preset.
    if (sessionId === 'quick') return buildTodaySession(training, today, { preset: 'quick' });
    return buildTodaySession(training);
  }, [sessionId]);

  const onDone = useCallback(
    (result: PlayerResult) => {
      const w = recordWorkout(session, result);
      // Pain: no feedback (no level change); continue with release only, or stop for today.
      if (result.pain === 'release') return router.replace({ pathname: '/workout/[sessionId]', params: { sessionId: 'release' } });
      if (result.pain === 'end' || session.id.endsWith('-release')) return goHome();
      router.replace({ pathname: '/workout/feedback', params: { id: w.id } });
    },
    [session],
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.focus.bg }}>
      <StatusBar style="light" />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="focusBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.focus.bg} />
            <Stop offset="1" stopColor={t.focus.bgEnd} />
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
