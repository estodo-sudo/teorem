import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { checkAchievements } from '@/features/gamification/service';
import { bestHold } from '@/features/progress/stats';
import { playCue } from '@/features/training/haptics';
import { positionCard } from '@/features/training/player/playerUi';
import { clampHold, HOLD_ATTEMPTS, HOLD_MAX_MS, HOLD_REST_SEC, MIN_HOLD_MS, personalRecords, QUICK_SEC, scoreFor, TEST_POSITION } from '@/features/training/strengthV2';
import { toDateKey } from '@/lib/date';
import { goHome } from '@/lib/nav';
import { makeId } from '@/lib/random';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTrainingStore } from '@/stores/trainingStore';

type Phase = 'conditions' | 'introA' | 'hold' | 'rest' | 'introB' | 'quick' | 'introC' | 'release' | 'done';

/**
 * Güç Testi v2 (SPEC_KEGEL_V2 §9). Same conditions every time (sitting, before the session, rested).
 * A — hold: press and hold while squeezing; the button fills from the bottom with a rising vibration;
 * let go when the muscle lets go or at 60 s; 3 attempts with 20 s rest, the best counts.
 * B — quick: tap once per full squeeze-and-release for 10 s.
 * C — release awareness (relaxation track only): a 1–5 self rating, not a speed test.
 * Results: personal records (confetti + vibration) and the optional Kas Skoru (own progress, not medical).
 */
export default function StrengthTest() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const relaxTrack = useTrainingStore((s) => s.training.track === 'relax');
  const previous = useHistoryStore((s) => s.strengthTests);
  const [phase, setPhase] = useState<Phase>('conditions');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [pressStart, setPressStart] = useState<number | null>(null);
  const [restStart, setRestStart] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [taps, setTaps] = useState(0);
  const [quickStart, setQuickStart] = useState<number | null>(null);
  const [released, setReleased] = useState(false);
  const [releaseRating, setReleaseRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const tapsRef = useRef(0);
  const lastSecond = useRef(0);

  const endHold = (at: number) => {
    if (pressStart === null) return;
    const ms = clampHold(at - pressStart);
    setPressStart(null);
    playCue('releaseStart', strength);
    if (ms < MIN_HOLD_MS) return; // accidental tap
    const next = [...attempts, ms];
    setAttempts(next);
    if (next.length >= HOLD_ATTEMPTS) setPhase('introB');
    else {
      setRestStart(Date.now());
      setPhase('rest');
    }
  };

  // Live clock: hold timer (ticks each second, ends at 60 s), rest countdown, quick countdown.
  useEffect(() => {
    if (pressStart === null && quickStart === null && restStart === null) return;
    const id = setInterval(() => {
      const at = Date.now();
      setNow(at);
      if (pressStart !== null) {
        const sec = Math.floor((at - pressStart) / 1000);
        if (sec > lastSecond.current) {
          lastSecond.current = sec;
          playCue(HOLD_MAX_MS / 1000 - sec <= 3 ? 'holdTickFinal' : 'holdTick', strength);
        }
        if (at - pressStart >= HOLD_MAX_MS) endHold(at);
      }
      if (quickStart !== null && at - quickStart >= QUICK_SEC * 1000) {
        setQuickStart(null);
        playCue('blockChange', strength);
        setPhase(relaxTrack ? 'introC' : 'done');
      }
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressStart, quickStart, restStart, strength, relaxTrack]);

  const holdMs = pressStart !== null ? clampHold(now - pressStart) : 0;
  const restLeft = restStart !== null ? Math.max(0, HOLD_REST_SEC - Math.floor((now - restStart) / 1000)) : 0;
  const quickLeft = quickStart !== null ? Math.max(0, QUICK_SEC - Math.floor((now - quickStart) / 1000)) : QUICK_SEC;
  const result = { holdBestMs: bestHold(attempts), quickCount: taps };
  const records = personalRecords(previous, result);
  const score = scoreFor(previous, result);

  const save = () => {
    useHistoryStore.getState().addStrengthTest({
      id: makeId('st_'),
      date: toDateKey(),
      holdBestMs: result.holdBestMs,
      holdAttemptsMs: attempts,
      quickCount: tapsRef.current,
      position: TEST_POSITION,
      ...(releaseRating ? { releaseSelfRating: releaseRating } : {}),
      muscleScore: score,
    });
    checkAchievements();
    if (router.canGoBack()) router.back();
    else goHome();
  };

  useEffect(() => {
    if (phase === 'done' && (records.hold || records.quick)) playCue('sessionEnd', strength);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const intro = (kicker: string, title: string, body: string, onReady: () => void) => (
    <View style={{ gap: 12 }}>
      <AppText variant="small" weight="700" color={t.colors.accent}>
        {kicker}
      </AppText>
      <AppText variant="h1">{title}</AppText>
      <AppText>{body}</AppText>
      <Card>
        <AppText variant="small" muted>
          {tr('strength.honest')}
        </AppText>
      </Card>
      <Button label={tr('strength.ready')} size="lg" variant="accent" onPress={onReady} />
    </View>
  );

  return (
    <Screen scroll={phase !== 'hold' && phase !== 'quick'} edges={['top', 'bottom']}>
      <Header title={tr('strength.title')} close />

      {phase === 'conditions' ? (
        <View style={{ gap: 12 }}>
          <AppText variant="display">{positionCard(TEST_POSITION).emoji}</AppText>
          <AppText variant="h1">{tr('strength.conditions.title')}</AppText>
          <AppText>{tr('strength.conditions.body')}</AppText>
          {(tr('strength.conditions.items', { returnObjects: true }) as string[]).map((x) => (
            <AppText key={x} weight="700">
              ✓ {x}
            </AppText>
          ))}
          <Button label={tr('common.continue')} size="lg" variant="accent" onPress={() => setPhase('introA')} />
        </View>
      ) : null}

      {phase === 'introA' ? intro(tr('strength.testA'), tr('strength.holdTitle'), tr('strength.holdBody', { n: HOLD_ATTEMPTS, max: HOLD_MAX_MS / 1000 }), () => setPhase('hold')) : null}
      {phase === 'introB' ? intro(tr('strength.testB'), tr('strength.quickTitle'), tr('strength.quickBody', { sec: QUICK_SEC }), () => setPhase('quick')) : null}
      {phase === 'introC' ? intro(tr('strength.testC'), tr('strength.releaseTitle'), tr('strength.releaseBody'), () => setPhase('release')) : null}

      {phase === 'hold' ? (
        <View style={{ flex: 1, gap: 16 }}>
          <AppText variant="h2" center>
            {tr('strength.attempt', { n: Math.min(attempts.length + 1, HOLD_ATTEMPTS), total: HOLD_ATTEMPTS })}
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
                lastSecond.current = 0;
                setPressStart(Date.now());
                playCue('squeezeStart', strength);
              }}
              onPressOut={() => endHold(Date.now())}
              style={[styles.big, { backgroundColor: t.colors.primary, overflow: 'hidden' }]}
            >
              {/* Fills from the bottom up over the 60 s. */}
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(holdMs / HOLD_MAX_MS) * 100}%`, backgroundColor: t.colors.contract }} />
              <AppText variant="display" color="#FFFFFF">
                {(holdMs / 1000).toFixed(1)}
              </AppText>
              <AppText color="#FFFFFF" weight="700">
                {pressStart !== null ? tr('strength.release') : tr('strength.pressHold')}
              </AppText>
            </Pressable>
          </View>
          <Attempts attempts={attempts} />
        </View>
      ) : null}

      {phase === 'rest' ? (
        <View style={{ gap: 16, alignItems: 'center', marginTop: 24 }}>
          <AppText variant="h2">{tr('strength.restTitle')}</AppText>
          <AppText variant="display">{restLeft}</AppText>
          <AppText muted center>
            {tr('strength.restBody')}
          </AppText>
          <Attempts attempts={attempts} />
          <Button label={restLeft > 0 ? tr('strength.restSkip') : tr('strength.nextAttempt')} variant={restLeft > 0 ? 'secondary' : 'accent'} size="lg" onPress={() => (setRestStart(null), setPhase('hold'))} />
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
                playCue('quickFlick', strength);
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

      {phase === 'release' ? (
        <View style={{ gap: 14 }}>
          <AppText variant="h2">{released ? tr('strength.releaseRate') : tr('strength.releaseDo')}</AppText>
          {!released ? (
            <Button label={tr('strength.releaseTap')} size="lg" variant="accent" onPress={() => (setReleased(true), playCue('releaseStart', strength))} />
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
                {([1, 2, 3, 4, 5] as const).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setReleaseRating(v)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: releaseRating === v }}
                    accessibilityLabel={tr('strength.releaseScale', { v })}
                    style={{ flex: 1, minHeight: 56, borderRadius: t.radius.md, borderWidth: 2, borderColor: releaseRating === v ? t.colors.accent : t.colors.border, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <AppText variant="h2">{v}</AppText>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="small" muted>
                  {tr('strength.releaseLow')}
                </AppText>
                <AppText variant="small" muted>
                  {tr('strength.releaseHigh')}
                </AppText>
              </View>
              <Button label={tr('common.continue')} size="lg" variant="accent" disabled={!releaseRating} onPress={() => setPhase('done')} />
            </>
          )}
        </View>
      ) : null}

      {phase === 'done' ? (
        <View style={{ gap: 12 }}>
          {records.hold || records.quick ? <Confetti /> : null}
          <AppText variant="display" center>
            {records.hold || records.quick ? '🏅' : '💪'}
          </AppText>
          <AppText variant="h1" center>
            {records.hold || records.quick ? tr('strength.recordTitle') : tr('strength.doneTitle')}
          </AppText>
          <Card style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Stat value={`${(result.holdBestMs / 1000).toFixed(1)} sn`} label={tr('strength.bestHold')} record={records.hold} />
            <Stat value={String(taps)} label={tr('strength.quickCount')} record={records.quick} />
            {releaseRating ? <Stat value={`${releaseRating}/5`} label={tr('strength.releaseShort')} /> : null}
          </Card>
          <Card style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <AppText variant="h2">{score}</AppText>
              <AppText weight="800">{tr('strength.scoreTitle')}</AppText>
            </View>
            <AppText variant="small" muted>
              {previous.length ? tr('strength.scoreBody') : tr('strength.scoreFirst')}
            </AppText>
            <AppText variant="small" weight="700" muted>
              {tr('strength.scoreLabel')}
            </AppText>
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

function Attempts({ attempts }: { attempts: number[] }) {
  const { t: tr } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
      {attempts.map((a, i) => (
        <AppText key={i} weight="700">
          {tr('strength.attemptResult', { n: i + 1, sec: (a / 1000).toFixed(1) })}
        </AppText>
      ))}
    </View>
  );
}

function Stat({ value, label, record }: { value: string; label: string; record?: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ alignItems: 'center' }}>
      <AppText variant="h2">{value}</AppText>
      <AppText variant="small" muted>
        {label}
      </AppText>
      {record ? (
        <AppText variant="small" weight="800" color={t.colors.accent}>
          {tr('strength.record')}
        </AppText>
      ) : null}
    </View>
  );
}

/** Short confetti burst for a personal record. */
function Confetti() {
  const pieces = ['🎉', '✨', '🎊', '⭐', '✨', '🎉'];
  return (
    <View pointerEvents="none" style={{ height: 0 }}>
      {pieces.map((p, i) => (
        <Piece key={i} emoji={p} index={i} />
      ))}
    </View>
  );
}

function Piece({ emoji, index }: { emoji: string; index: number }) {
  const y = useSharedValue(0);
  const o = useSharedValue(1);
  useEffect(() => {
    y.value = withTiming(-120 - (index % 3) * 30, { duration: 900, easing: Easing.out(Easing.cubic) });
    o.value = withDelay(500, withTiming(0, { duration: 500 }));
  }, [y, o, index]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }, { translateX: (index - 2.5) * 34 }] }));
  return <Animated.Text style={[{ position: 'absolute', left: '50%', top: 80, fontSize: 28 }, style]}>{emoji}</Animated.Text>;
}

const styles = StyleSheet.create({
  big: { width: 240, height: 240, borderRadius: 120, alignItems: 'center', justifyContent: 'center' },
});
