import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Icon, Screen, useTheme, type IconName } from '@/components';
import { Badge, Button, Card, IconTile, ScalePressable, StatRow } from '@/components/ui';
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
 * ui-v3 look (SPEC_UI_V3 §7.11): chair icon tile, the conditions as a checklist, calm primary controls.
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
    <View style={{ gap: t.space.lg }}>
      <AppText variant="caption" muted style={{ letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {kicker}
      </AppText>
      <AppText variant="title1">{title}</AppText>
      <AppText variant="body">{body}</AppText>
      <View style={{ flexDirection: 'row', gap: t.space.md, padding: t.space.lg, borderRadius: t.radius.lg, backgroundColor: t.tokens.infoSoft }}>
        <Icon name="info" size="md" color={t.tokens.info} />
        <AppText variant="callout" style={{ flex: 1 }}>
          {tr('strength.honest')}
        </AppText>
      </View>
      <Button label={tr('strength.ready')} size="lg" onPress={onReady} fullWidth />
    </View>
  );

  return (
    <Screen scroll={phase !== 'hold' && phase !== 'quick'} edges={['top', 'bottom']}>
      <Header title={tr('strength.title')} close />

      {phase === 'conditions' ? (
        <View style={{ gap: t.space.lg }}>
          <IconTile icon={positionCard(TEST_POSITION).icon} size="lg" />
          <AppText variant="title1">{tr('strength.conditions.title')}</AppText>
          <AppText variant="body" muted>
            {tr('strength.conditions.body')}
          </AppText>
          <Card style={{ paddingHorizontal: t.space.lg }}>
            {(tr('strength.conditions.items', { returnObjects: true }) as string[]).map((x, i) => (
              <View key={x} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: t.space.md, borderTopWidth: i ? t.border.thin : 0, borderTopColor: t.tokens.border }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.tokens.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={14} color={t.tokens.primary} />
                </View>
                <AppText variant="body" style={{ flex: 1 }}>
                  {x}
                </AppText>
              </View>
            ))}
          </Card>
          <Button label={tr('common.continue')} size="lg" onPress={() => setPhase('introA')} fullWidth />
        </View>
      ) : null}

      {phase === 'introA' ? intro(tr('strength.testA'), tr('strength.holdTitle'), tr('strength.holdBody', { n: HOLD_ATTEMPTS, max: HOLD_MAX_MS / 1000 }), () => setPhase('hold')) : null}
      {phase === 'introB' ? intro(tr('strength.testB'), tr('strength.quickTitle'), tr('strength.quickBody', { sec: QUICK_SEC }), () => setPhase('quick')) : null}
      {phase === 'introC' ? intro(tr('strength.testC'), tr('strength.releaseTitle'), tr('strength.releaseBody'), () => setPhase('release')) : null}

      {phase === 'hold' ? (
        <View style={{ flex: 1, gap: 16 }}>
          <AppText variant="title2" center>
            {tr('strength.attempt', { n: Math.min(attempts.length + 1, HOLD_ATTEMPTS), total: HOLD_ATTEMPTS })}
          </AppText>
          <AppText variant="callout" muted center>
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
              style={[styles.big, { backgroundColor: t.tokens.primary, overflow: 'hidden' }]}
            >
              {/* Fills from the bottom up over the 60 s (a darker layer over the primary disc). */}
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(holdMs / HOLD_MAX_MS) * 100}%`, backgroundColor: t.tokens.foreground, opacity: 0.22 }} />
              <AppText variant="display" tabular color={t.tokens.primaryForeground}>
                {(holdMs / 1000).toFixed(1)}
              </AppText>
              <AppText variant="bodyStrong" color={t.tokens.primaryForeground}>
                {pressStart !== null ? tr('strength.release') : tr('strength.pressHold')}
              </AppText>
            </Pressable>
          </View>
          <Attempts attempts={attempts} />
        </View>
      ) : null}

      {phase === 'rest' ? (
        <View style={{ gap: t.space.lg, alignItems: 'center', marginTop: t.space.xl }}>
          <AppText variant="title2">{tr('strength.restTitle')}</AppText>
          <AppText variant="display" tabular>
            {restLeft}
          </AppText>
          <AppText variant="callout" muted center>
            {tr('strength.restBody')}
          </AppText>
          <Attempts attempts={attempts} />
          <Button label={restLeft > 0 ? tr('strength.restSkip') : tr('strength.nextAttempt')} variant={restLeft > 0 ? 'secondary' : 'primary'} size="lg" onPress={() => (setRestStart(null), setPhase('hold'))} fullWidth />
        </View>
      ) : null}

      {phase === 'quick' ? (
        <View style={{ flex: 1, gap: 16 }}>
          <AppText variant="title2" center tabular>
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
              style={[styles.big, { backgroundColor: t.tokens.primary }]}
            >
              <AppText variant="display" tabular color={t.tokens.primaryForeground}>
                {taps}
              </AppText>
              <AppText variant="bodyStrong" color={t.tokens.primaryForeground}>
                {tr('strength.tap')}
              </AppText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {phase === 'release' ? (
        <View style={{ gap: t.space.lg }}>
          <AppText variant="title2">{released ? tr('strength.releaseRate') : tr('strength.releaseDo')}</AppText>
          {!released ? (
            <Button label={tr('strength.releaseTap')} size="lg" onPress={() => (setReleased(true), playCue('releaseStart', strength))} fullWidth />
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
                {([1, 2, 3, 4, 5] as const).map((v) => (
                  <ScalePressable
                    key={v}
                    onPress={() => setReleaseRating(v)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: releaseRating === v }}
                    accessibilityLabel={tr('strength.releaseScale', { v })}
                    style={{ flex: 1, minHeight: 56, borderRadius: t.radius.md, borderWidth: releaseRating === v ? t.border.medium : t.border.thin, borderColor: releaseRating === v ? t.tokens.primary : t.tokens.border, backgroundColor: releaseRating === v ? t.tokens.primarySoft : t.tokens.card, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <AppText variant="title2" tabular color={releaseRating === v ? t.tokens.primary : t.tokens.foreground}>
                      {v}
                    </AppText>
                  </ScalePressable>
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="footnote" muted>
                  {tr('strength.releaseLow')}
                </AppText>
                <AppText variant="footnote" muted>
                  {tr('strength.releaseHigh')}
                </AppText>
              </View>
              <Button label={tr('common.continue')} size="lg" disabled={!releaseRating} onPress={() => setPhase('done')} fullWidth />
            </>
          )}
        </View>
      ) : null}

      {phase === 'done' ? (
        <View style={{ gap: t.space.lg }}>
          {records.hold || records.quick ? <Confetti /> : null}
          <View style={{ alignItems: 'center' }}>
            <IconTile icon={records.hold || records.quick ? 'medal' : 'dumbbell'} size="lg" round background={records.hold || records.quick ? t.tokens.highlightSoft : undefined} color={records.hold || records.quick ? t.tokens.foreground : undefined} />
          </View>
          <AppText variant="title1" center>
            {records.hold || records.quick ? tr('strength.recordTitle') : tr('strength.doneTitle')}
          </AppText>
          <Card style={{ padding: t.space.lg, gap: t.space.md }}>
            <StatRow
              stats={[
                { value: `${(result.holdBestMs / 1000).toFixed(1)} sn`, label: tr('strength.bestHold') },
                { value: String(taps), label: tr('strength.quickCount') },
                ...(releaseRating ? [{ value: `${releaseRating}/5`, label: tr('strength.releaseShort') }] : []),
              ]}
            />
            {records.hold || records.quick ? (
              <View style={{ flexDirection: 'row', gap: t.space.sm, flexWrap: 'wrap' }}>
                {records.hold ? <Badge variant="highlight" label={`${tr('strength.bestHold')} · ${tr('strength.record')}`} /> : null}
                {records.quick ? <Badge variant="highlight" label={`${tr('strength.quickCount')} · ${tr('strength.record')}`} /> : null}
              </View>
            ) : null}
          </Card>
          <Card style={{ padding: t.space.gutter, gap: t.space.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.space.sm }}>
              <AppText variant="title1" tabular>
                {score}
              </AppText>
              <AppText variant="title3">{tr('strength.scoreTitle')}</AppText>
            </View>
            <AppText variant="callout" muted>
              {previous.length ? tr('strength.scoreBody') : tr('strength.scoreFirst')}
            </AppText>
            <AppText variant="footnote" muted>
              {tr('strength.scoreLabel')}
            </AppText>
          </Card>
          <AppText variant="callout" muted center>
            {tr('strength.doneBody')}
          </AppText>
          <Button label={tr('common.save')} size="lg" onPress={save} fullWidth />
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
        <AppText key={i} variant="footnote" tabular style={{ fontWeight: '600' }}>
          {tr('strength.attemptResult', { n: i + 1, sec: (a / 1000).toFixed(1) })}
        </AppText>
      ))}
    </View>
  );
}

/** Short confetti burst for a personal record. */
function Confetti() {
  const pieces: IconName[] = ['party', 'sparkle', 'party', 'star', 'sparkle', 'party'];
  return (
    <View pointerEvents="none" style={{ height: 0 }}>
      {pieces.map((p, i) => (
        <Piece key={i} icon={p} index={i} />
      ))}
    </View>
  );
}

function Piece({ icon, index }: { icon: IconName; index: number }) {
  const t = useTheme();
  const y = useSharedValue(0);
  const o = useSharedValue(1);
  useEffect(() => {
    y.value = withTiming(-120 - (index % 3) * 30, { duration: 900, easing: Easing.out(Easing.cubic) });
    o.value = withDelay(500, withTiming(0, { duration: 500 }));
  }, [y, o, index]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }, { translateX: (index - 2.5) * 34 }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: '50%', top: 80 }, style]}>
      <Icon name={icon} size="xl" color={t.tokens.highlight} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  big: { width: 240, height: 240, borderRadius: 120, alignItems: 'center', justifyContent: 'center' },
});
