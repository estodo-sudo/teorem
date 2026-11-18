import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Icon, ProgressBar, useTheme } from '@/components';
import { tint } from '@/features/campus/shared/ui';
import { breathingPhases, type BreathPatternId, type BreathPhase } from '@/features/mind/breathing';
import { cancelHaptics, playCue } from '@/features/training/haptics';
import { BreathCircle } from '@/features/training/player/BreathCircle';
import { currentPhase, progress, remainingInPhase, type PlayerEvent } from '@/features/training/player/machine';
import { usePlayer } from '@/features/training/player/usePlayer';
import { useNow } from '@/lib/useNow';
import { useSettingsStore } from '@/stores/settingsStore';

import { CAMP_ONBOARDING as ONB, CAMP_SOS as SOS } from './content';
import { BREATH_MINUTES, DELAY_MINUTES, flipCard, gameWon, matchedPairs, newMatchGame, surfPromptIndex, SURF_MINUTES, waveAmplitude } from './engine/sos';
import type { CampProfile } from './types';

/** 1–10 intensity scale: ten tappable steps, adjustable for screen readers. */
export function IntensityScale({ value, onChange, label }: { value: number | null; onChange: (v: number) => void; label: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{ flexDirection: 'row', gap: 4 }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min: 1, max: 10, now: value ?? undefined, text: value ? `${value} / 10` : '' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => onChange(Math.min(10, Math.max(1, (value ?? 5) + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
      >
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1;
          const on = value !== null && n <= value;
          // Calm colours from green to orange; never alarming red.
          const c = n <= 3 ? t.colors.success : n <= 7 ? t.colors.warning : t.colors.accent;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              importantForAccessibility="no"
              style={{ flex: 1, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6, backgroundColor: on ? c : t.colors.surfaceAlt, borderWidth: value === n ? 2 : 0, borderColor: t.colors.text }}
            >
              <AppText variant="tiny" weight="800" color={on ? '#FFFFFF' : t.colors.textMuted}>
                {n}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="tiny" muted>
          {SOS.intensityLabels.low}
        </AppText>
        <AppText variant="tiny" muted>
          {SOS.intensityLabels.high}
        </AppText>
      </View>
    </View>
  );
}

/** A plain countdown with start / pause. */
function useCountdown(totalSec: number) {
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

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/** Urge surfing (ACT): a wave that builds and fades over 3–5 minutes, with spoken-style prompts. */
export function UrgeSurf({ onUsed }: { onUsed: () => void }) {
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
  const prompt = cd.finished ? SOS.surf.done : SOS.surf.prompts[surfPromptIndex(cd.elapsed, total, SOS.surf.prompts.length)]!;
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
      <AppText muted>{SOS.surf.desc}</AppText>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AppText variant="h2" style={{ minWidth: 70 }} accessibilityLabel={tr('camp.sos.timeLeft', { time: mmss(cd.left) })}>
          {mmss(cd.left)}
        </AppText>
        <View style={{ flex: 1 }}>
          <ProgressBar value={cd.elapsed / total} height={8} color={t.colors.breathe} />
        </View>
      </View>
      {!cd.running && cd.elapsed === 0 ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
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
export function SosBreath({ onUsed }: { onUsed: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [pattern, setPattern] = useState<BreathPatternId>('box');
  const [running, setRunning] = useState(false);
  return (
    <View style={{ gap: 12 }}>
      <AppText muted>{SOS.breath.desc}</AppText>
      {running ? (
        <BreathRun pattern={pattern} onDone={() => setRunning(false)} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
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
    <View style={{ gap: 12, alignItems: 'center' }}>
      <ProgressBar value={progress(state, now)} color={t.colors.breathe} />
      <View>
        <BreathCircle size={200} target={done ? 0.7 : target} durationMs={phase?.kind === 'inhale' || phase?.kind === 'exhale' ? phase.durationMs : 300} color={t.colors.breathe} animKey={state.index} ringColor={t.colors.border} />
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
          <AppText variant="h2" color="#FFFFFF" accessibilityLiveRegion="polite">
            {done ? '🌿' : tr(`mind.breathing.phase.${phase?.kind ?? 'inhale'}`)}
          </AppText>
          {!done ? (
            <AppText variant="h2" color="#FFFFFF">
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

/** "Just wait 10 minutes" countdown with small things to do meanwhile. */
export function DelayTimer({ onUsed }: { onUsed: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const cd = useCountdown(DELAY_MINUTES * 60);
  const [done, setDone] = useState<string[]>([]);
  return (
    <View style={{ gap: 12 }}>
      <AppText muted>{SOS.delay.desc}</AppText>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <AppText variant="display" style={{ fontSize: 56, lineHeight: 64 }} accessibilityLabel={tr('camp.sos.timeLeft', { time: mmss(cd.left) })}>
          {mmss(cd.left)}
        </AppText>
        <View style={{ alignSelf: 'stretch' }}>
          <ProgressBar value={cd.elapsed / (DELAY_MINUTES * 60)} height={8} />
        </View>
      </View>
      {cd.finished ? (
        <Card style={{ borderLeftWidth: 4, borderLeftColor: t.colors.success }}>
          <AppText weight="700">{SOS.delay.done}</AppText>
        </Card>
      ) : (
        <Button
          label={cd.running ? tr('camp.sos.pause') : cd.elapsed > 0 ? tr('camp.sos.resume') : tr('camp.sos.delayStart')}
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
      )}
      <AppText weight="800">{tr('camp.sos.meanwhile')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SOS.delay.ideas.map((idea) => {
          const on = done.includes(idea);
          return (
            <Pressable
              key={idea}
              onPress={() => setDone((d) => (on ? d.filter((x) => x !== idea) : [...d, idea]))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                minHeight: 48,
                paddingHorizontal: 12,
                borderRadius: t.radius.pill,
                borderWidth: 1.5,
                borderColor: on ? t.colors.success : t.colors.border,
                backgroundColor: on ? tint(t.colors.success, '1A') : t.colors.surface,
              }}
            >
              {on ? <Icon name="check" color={t.colors.success} size={14} strokeWidth={3} /> : null}
              <AppText variant="small" weight="700">
                {idea}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** The 4E card (Ertele · Elini meşgul et · En sevdiğin içeceği iç · Eğlenceli bir şey yap). */
export function FourECard() {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <AppText muted>{SOS.fourE.desc}</AppText>
      {SOS.fourE.items.map((it, i) => (
        <Card key={it.title} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="h3" weight="800" color="#FFFFFF">
              {it.letter}
              <AppText variant="tiny" weight="800" color="#FFFFFF">
                {i + 1}
              </AppText>
            </AppText>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText weight="800">{it.title}</AppText>
            <AppText variant="small" muted>
              {it.text}
            </AppText>
          </View>
        </Card>
      ))}
    </View>
  );
}

/** The user's own reasons and photo. */
export function ReasonsView({ profile }: { profile: CampProfile }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const items = profile.reasons.map((r) =>
    r.id === 'custom' ? { key: 'custom', emoji: '💬', text: `“${r.text ?? ''}”` } : { key: r.id, emoji: ONB.reasons.find((x) => x.id === r.id)?.emoji ?? '•', text: ONB.reasons.find((x) => x.id === r.id)?.label ?? '' },
  );
  return (
    <View style={{ gap: 10 }}>
      <AppText muted>{SOS.reasons.desc}</AppText>
      {profile.reasonPhotoUri ? <Image source={{ uri: profile.reasonPhotoUri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: t.radius.lg }} accessibilityLabel={tr('camp.onb.reasons.photoAlt')} /> : null}
      {items.length ? (
        items.map((it) => (
          <Card key={it.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: tint(t.colors.accent, '10') }}>
            <AppText variant="h2">{it.emoji}</AppText>
            <AppText variant="h3" style={{ flex: 1 }}>
              {it.text}
            </AppText>
          </Card>
        ))
      ) : (
        <AppText muted>{SOS.reasons.empty}</AppText>
      )}
    </View>
  );
}

const SYMBOLS = ['🌿', '🌊', '☀️', '🍎', '🎧', '🚲'];

/** 60-second matching game (offline distraction). Each round remounts, so its timer starts fresh. */
export function MatchGameView({ onUsed }: { onUsed: () => void }) {
  const [round, setRound] = useState(0);
  return <MatchRound key={round} onUsed={onUsed} onRestart={() => setRound((n) => n + 1)} />;
}

function MatchRound({ onUsed, onRestart }: { onUsed: () => void; onRestart: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [game, setGame] = useState(() => newMatchGame(SYMBOLS));
  const [started, setStarted] = useState(false);
  const cd = useCountdown(SOS.game.seconds);
  const won = gameWon(game);
  const over = won || cd.finished;
  const { width } = useWindowDimensions();
  const size = Math.min(84, (Math.min(width, 520) - 32 - 3 * 8) / 4);
  return (
    <View style={{ gap: 12 }}>
      <AppText muted>{SOS.game.desc}</AppText>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText weight="800">{tr('camp.sos.gameTime', { sec: started ? cd.left : SOS.game.seconds })}</AppText>
        <AppText weight="800">{tr('camp.sos.gamePairs', { n: matchedPairs(game), total: SYMBOLS.length })}</AppText>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {game.cards.map((c, i) => {
          const up = c.matched || game.open.includes(i);
          return (
            <Pressable
              key={i}
              disabled={over || c.matched}
              onPress={() => {
                if (!started) {
                  setStarted(true);
                  onUsed();
                  cd.start();
                }
                setGame((g) => flipCard(g, i));
              }}
              accessibilityRole="button"
              accessibilityLabel={up ? c.symbol : tr('camp.sos.gameCard', { n: i + 1 })}
              style={{
                width: size,
                height: size,
                borderRadius: t.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: c.matched ? tint(t.colors.success, '33') : up ? t.colors.surface : t.colors.primary,
                borderWidth: 2,
                borderColor: c.matched ? t.colors.success : t.colors.border,
              }}
            >
              <AppText style={{ fontSize: size * 0.45 }}>{up ? c.symbol : ''}</AppText>
            </Pressable>
          );
        })}
      </View>
      {over ? (
        <Card style={{ gap: 8 }}>
          <AppText weight="800" center>
            {won ? tr('camp.sos.gameWon', { moves: game.moves }) : tr('camp.sos.gameOver', { n: matchedPairs(game) })}
          </AppText>
          <Button label={tr('camp.sos.gameAgain')} variant="secondary" onPress={onRestart} />
        </Card>
      ) : null}
    </View>
  );
}
