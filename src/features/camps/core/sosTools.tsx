import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ProgressBar, useTheme } from '@/components';
import { Slider } from '@/components/ui/Blocks';
import { tint } from '@/features/campus/shared/ui';
import { breathingPhases, type BreathPatternId, type BreathPhase } from '@/features/mind/breathing';
import { cancelHaptics, playCue } from '@/features/training/haptics';
import { BreathCircle } from '@/features/training/player/BreathCircle';
import { currentPhase, progress, remainingInPhase, type PlayerEvent } from '@/features/training/player/machine';
import { usePlayer } from '@/features/training/player/usePlayer';
import { useNow } from '@/lib/useNow';
import { useSettingsStore } from '@/stores/settingsStore';

import { BREATH_MINUTES, surfPromptIndex, SURF_MINUTES, waveAmplitude } from './sosEngine';

/** Shared SOS tools (any camp passes its own texts). */

/** 1–10 intensity (SPEC_UI_V3 §5 Slider): a thick-track slider with a big value and the end labels; a selection haptic per step. */
export function IntensityScale({ value, onChange, label, labels }: { value: number | null; onChange: (v: number) => void; label: string; labels: { low: string; high: string } }) {
  return <Slider value={value} onChange={onChange} min={1} max={10} label={label} minLabel={labels.low} maxLabel={labels.high} />;
}

/** A plain countdown with start / pause. */
export function useCountdown(totalSec: number) {
  const now = useNow(250).getTime();
  const [runningSince, setRunningSince] = useState<number | null>(null);
  const [before, setBefore] = useState(0);
  const elapsed = Math.min(totalSec, before + (runningSince !== null ? (now - runningSince) / 1000 : 0));
  const finished = elapsed >= totalSec;
  // Adjust state while rendering: stop at the end.
  if (finished && runningSince !== null) {
    setBefore(totalSec);
    setRunningSince(null);
  }
  return {
    elapsed,
    left: Math.max(0, Math.ceil(totalSec - elapsed)),
    running: runningSince !== null,
    finished,
    start: () => !finished && setRunningSince(Date.now()),
    pause: () => {
      if (runningSince === null) return;
      setBefore((b) => b + (Date.now() - runningSince) / 1000);
      setRunningSince(null);
    },
  };
}

export const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/** Urge surfing (ACT): a wave that builds and fades over 3–5 minutes, with spoken-style prompts. */
export function UrgeSurf({ onUsed, text }: { onUsed: () => void; text: { desc: string; prompts: string[]; done: string } }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { width } = useWindowDimensions();
  const reduce = useReducedMotion();
  const [minutes, setMinutes] = useState<number>(SURF_MINUTES[0]);
  const total = minutes * 60;
  const cd = useCountdown(total);
  const phase = useNow(reduce ? 60_000 : 80).getTime() / 1000;
  const w = Math.min(width - 32, 520);
  const h = 150;
  const amp = waveAmplitude(cd.elapsed, total);
  const prompt = cd.finished ? text.done : text.prompts[surfPromptIndex(cd.elapsed, total, text.prompts.length)]!;
  const path = useMemo(() => {
    const shift = reduce ? 0 : phase * 1.6;
    const mid = h * 0.62;
    const pts: string[] = [];
    for (let x = 0; x <= w; x += 8) {
      const y = mid - amp * h * 0.45 * Math.exp(-(((x / w - 0.5) * 2.2) ** 2)) + Math.sin(x / 26 + shift) * (4 + amp * 6);
      pts.push(`${x === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return `${pts.join(' ')} L${w},${h} L0,${h} Z`;
  }, [w, amp, phase, reduce]);

  return (
    <View style={{ gap: 14 }}>
      <AppText muted>{text.desc}</AppText>
      <View style={{ borderRadius: t.radius.xl, overflow: 'hidden', backgroundColor: tint(t.colors.breathe, '18') }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={w} height={h}>
          <Path d={path} fill={tint(t.colors.breathe, 'AA')} />
        </Svg>
      </View>
      <Card style={{ minHeight: 96, justifyContent: 'center' }}>
        <AppText variant="h3" center accessibilityLiveRegion="polite">
          {prompt}
        </AppText>
      </Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
        <AppText variant="h2" style={{ minWidth: 70 }} accessibilityLabel={tr('camp.sos.timeLeft', { time: mmss(cd.left) })}>
          {mmss(cd.left)}
        </AppText>
        <View style={{ flex: 1 }}>
          <ProgressBar value={cd.elapsed / total} height={8} color={t.colors.breathe} />
        </View>
      </View>
      {!cd.running && cd.elapsed === 0 ? (
        <View style={{ flexDirection: 'row', gap: t.space.sm }}>
          {SURF_MINUTES.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMinutes(m)}
              accessibilityRole="radio"
              accessibilityState={{ selected: minutes === m }}
              style={{ flex: 1, minHeight: 48, borderRadius: t.radius.pill, borderWidth: 2, borderColor: minutes === m ? t.colors.breathe : t.colors.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <AppText weight="700">{tr('camp.sos.minutes', { count: m })}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
      {!cd.finished ? (
        <Button
          label={cd.running ? tr('camp.sos.pause') : cd.elapsed > 0 ? tr('camp.sos.resume') : tr('camp.sos.surfStart')}
          icon={cd.running ? 'pause' : 'play'}
          variant={cd.running ? 'secondary' : 'primary'}
          onPress={() => {
            if (cd.running) cd.pause();
            else {
              onUsed();
              cd.start();
            }
          }}
        />
      ) : null}
    </View>
  );
}

/** Breathing (reuses the app's breathing patterns, circle and player), 2 minutes. */
export function SosBreath({ onUsed, desc }: { onUsed: () => void; desc: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [pattern, setPattern] = useState<BreathPatternId>('box');
  const [running, setRunning] = useState(false);
  return (
    <View style={{ gap: t.space.md }}>
      <AppText muted>{desc}</AppText>
      {running ? (
        <BreathRun pattern={pattern} onDone={() => setRunning(false)} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: t.space.sm }}>
            {(['box', '478'] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPattern(p)}
                accessibilityRole="radio"
                accessibilityState={{ selected: pattern === p }}
                style={{ flex: 1, minHeight: 56, padding: 10, borderRadius: t.radius.lg, borderWidth: 2, borderColor: pattern === p ? t.colors.breathe : t.colors.border, justifyContent: 'center' }}
              >
                <AppText weight="800" center>
                  {tr(`mind.breathing.${p}.name`)}
                </AppText>
              </Pressable>
            ))}
          </View>
          <Button
            label={tr('camp.sos.breathStart', { count: BREATH_MINUTES })}
            icon="play"
            variant="primary"
            onPress={() => {
              onUsed();
              setRunning(true);
            }}
          />
        </>
      )}
    </View>
  );
}

function BreathRun({ pattern, onDone }: { pattern: BreathPatternId; onDone: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const phases = useMemo(() => breathingPhases(pattern, BREATH_MINUTES), [pattern]);
  const onEvents = useCallback(
    (events: PlayerEvent<BreathPhase>[]) => {
      for (const e of events) {
        if (e.type === 'phaseStart') playCue(e.phase.kind === 'inhale' ? 'breatheIn' : e.phase.kind === 'exhale' ? 'breatheOut' : 'tap', strength);
      }
    },
    [strength],
  );
  const player = usePlayer(phases, onEvents);
  const { state, now } = player;
  useEffect(() => {
    player.start();
    return () => cancelHaptics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const phase = currentPhase(state);
  const done = state.status === 'completed';
  const target = phase?.kind === 'inhale' || phase?.kind === 'holdIn' ? 1 : 0.5;
  return (
    <View style={{ gap: t.space.md, alignItems: 'center' }}>
      <ProgressBar value={progress(state, now)} color={t.colors.breathe} />
      <View>
        <BreathCircle size={200} target={done ? 0.7 : target} durationMs={phase?.kind === 'inhale' || phase?.kind === 'exhale' ? phase.durationMs : 300} color={t.colors.breathe} animKey={state.index} ringColor={t.colors.border} />
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
          <AppText variant="h2" color={t.tokens.primaryForeground} accessibilityLiveRegion="polite">
            {done ? tr('common.done') : tr(`mind.breathing.phase.${phase?.kind ?? 'inhale'}`)}
          </AppText>
          {!done ? (
            <AppText variant="h2" color={t.tokens.primaryForeground}>
              {Math.ceil(remainingInPhase(state, now) / 1000)}
            </AppText>
          ) : null}
        </View>
      </View>
      {done ? (
        <Button label={tr('common.done')} variant="secondary" onPress={onDone} style={{ alignSelf: 'stretch' }} />
      ) : (
        <Button
          label={state.status === 'paused' ? tr('camp.sos.resume') : tr('camp.sos.pause')}
          icon={state.status === 'paused' ? 'play' : 'pause'}
          variant="secondary"
          onPress={state.status === 'paused' ? player.resume : player.pause}
          style={{ alignSelf: 'stretch' }}
        />
      )}
    </View>
  );
}
