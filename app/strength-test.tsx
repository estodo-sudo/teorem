import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { checkAchievements } from '@/features/gamification/service';
import { bestHold } from '@/features/progress/stats';
import { playCue } from '@/features/training/haptics';
import { toDateKey } from '@/lib/date';
import { goHome } from '@/lib/nav';
import { makeId } from '@/lib/random';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';

const ATTEMPTS = 3;
const QUICK_SEC = 10;
type Phase = 'introA' | 'hold' | 'introB' | 'quick' | 'done';

export default function StrengthTest() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const [phase, setPhase] = useState<Phase>('introA');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [pressStart, setPressStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [taps, setTaps] = useState(0);
  const [quickStart, setQuickStart] = useState<number | null>(null);
  const tapsRef = useRef(0);

  // Live clock for the hold timer and quick countdown.
  useEffect(() => {
    if (pressStart === null && quickStart === null) return;
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(id);
  }, [pressStart, quickStart]);

  // End quick test after 10 s (wall-clock based).
  useEffect(() => {
    if (quickStart !== null && now - quickStart >= QUICK_SEC * 1000) {
      setQuickStart(null);
      playCue('exerciseEnd', strength);
      setPhase('done');
    }
  }, [now, quickStart, strength]);

  const save = () => {
    useHistoryStore.getState().addStrengthTest({
      id: makeId('st_'),
      date: toDateKey(),
      holdBestMs: bestHold(attempts),
      holdAttemptsMs: attempts,
      quickCount: tapsRef.current,
    });
    checkAchievements();
    if (router.canGoBack()) router.back();
    else goHome();
  };

  const holdMs = pressStart !== null ? now - pressStart : 0;
  const quickLeft = quickStart !== null ? Math.max(0, QUICK_SEC - Math.floor((now - quickStart) / 1000)) : QUICK_SEC;

  return (
    <Screen scroll={phase !== 'hold' && phase !== 'quick'} edges={['top', 'bottom']}>
      <Header title={tr('strength.title')} close />
      {phase === 'introA' || phase === 'introB' ? (
        <View style={{ gap: 12 }}>
          <AppText variant="small" weight="700" color={t.colors.accent}>
            {phase === 'introA' ? tr('strength.testA') : tr('strength.testB')}
          </AppText>
          <AppText variant="h1">{phase === 'introA' ? tr('strength.holdTitle') : tr('strength.quickTitle')}</AppText>
          <AppText>{phase === 'introA' ? tr('strength.holdBody', { n: ATTEMPTS }) : tr('strength.quickBody', { sec: QUICK_SEC })}</AppText>
          <Card>
            <AppText variant="small" muted>
              {tr('strength.honest')}
            </AppText>
          </Card>
          <Button label={tr('strength.ready')} size="lg" variant="accent" onPress={() => setPhase(phase === 'introA' ? 'hold' : 'quick')} />
        </View>
      ) : null}

      {phase === 'hold' ? (
        <View style={{ flex: 1, gap: 16 }}>
          <AppText variant="h2" center>
            {tr('strength.attempt', { n: Math.min(attempts.length + 1, ATTEMPTS), total: ATTEMPTS })}
          </AppText>
          <AppText muted center>
            {pressStart !== null ? tr('strength.holdingHint') : tr('strength.holdHint')}
          </AppText>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tr('strength.holdButton')}
              accessibilityHint={tr('strength.holdHint')}
              onPressIn={() => {
                setPressStart(Date.now());
                playCue('contractStart', strength);
              }}
              onPressOut={() => {
                if (pressStart === null) return;
                const ms = Date.now() - pressStart;
                setPressStart(null);
                playCue('relaxStart', strength);
                if (ms < 300) return; // accidental tap
                const next = [...attempts, ms];
                setAttempts(next);
                if (next.length >= ATTEMPTS) setPhase('introB');
              }}
              style={[styles.big, { backgroundColor: pressStart !== null ? t.colors.contract : t.colors.primary }]}
            >
              <AppText variant="display" color="#FFFFFF">
                {(holdMs / 1000).toFixed(1)}
              </AppText>
              <AppText color="#FFFFFF" weight="700">
                {pressStart !== null ? tr('strength.release') : tr('strength.pressHold')}
              </AppText>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
            {attempts.map((a, i) => (
              <AppText key={i} weight="700">
                {tr('strength.attemptResult', { n: i + 1, sec: (a / 1000).toFixed(1) })}
              </AppText>
            ))}
          </View>
        </View>
      ) : null}

      {phase === 'quick' ? (
        <View style={{ flex: 1, gap: 16 }}>
          <AppText variant="h2" center>
            {quickStart === null ? tr('strength.tapToStart') : tr('strength.secondsLeft', { sec: quickLeft })}
          </AppText>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tr('strength.tapButton')}
              onPressIn={() => {
                if (quickStart === null) setQuickStart(Date.now());
                tapsRef.current += 1;
                setTaps(tapsRef.current);
                playCue('tap', strength);
              }}
              style={[styles.big, { backgroundColor: t.colors.accent }]}
            >
              <AppText variant="display" color={t.colors.accentText}>
                {taps}
              </AppText>
              <AppText color={t.colors.accentText} weight="700">
                {tr('strength.tap')}
              </AppText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {phase === 'done' ? (
        <View style={{ gap: 12 }}>
          <AppText variant="display" center>
            💪
          </AppText>
          <AppText variant="h1" center>
            {tr('strength.doneTitle')}
          </AppText>
          <Card style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <AppText variant="h2">{(bestHold(attempts) / 1000).toFixed(1)} sn</AppText>
              <AppText variant="small" muted>
                {tr('strength.bestHold')}
              </AppText>
            </View>
            <View style={{ alignItems: 'center' }}>
              <AppText variant="h2">{taps}</AppText>
              <AppText variant="small" muted>
                {tr('strength.quickCount')}
              </AppText>
            </View>
          </Card>
          <AppText muted center>
            {tr('strength.doneBody')}
          </AppText>
          <Button label={tr('common.save')} size="lg" variant="accent" onPress={save} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { width: 240, height: 240, borderRadius: 120, alignItems: 'center', justifyContent: 'center' },
});
