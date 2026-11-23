import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { AppText, Card, Icon, useTheme } from '@/components';
import { playCue } from '@/features/training/haptics';
import { remainingInPhase, type PlayerState } from '@/features/training/player/machine';
import type { HapticStrength } from '@/types';

import { FitnessDemo, FitnessFigure } from '../fitness/FitnessFigure';
import { motionAt, repsIn, type MoveSpec } from '../fitness/motion';
import type { BwExercise } from './catalog';
import type { WorkoutPhase } from './program';

/** Works · start position · numbered steps · tip · usual mistake (compact: start + steps only). */
export function HowTo({ ex, compact }: { ex: BwExercise; compact?: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ gap: 10 }}>
      {!compact ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Icon name="target" size="sm" color={t.tokens.primary} />
          <AppText variant="footnote" weight="600" color={t.tokens.primary} style={{ flex: 1 }}>
            {tr('fitness.works', { target: ex.target })}
          </AppText>
        </View>
      ) : null}
      <View style={{ gap: 2 }}>
        <AppText variant="footnote" weight="700" muted>
          {tr('fitness.setup')}
        </AppText>
        <AppText variant="callout">{ex.setup}</AppText>
      </View>
      <View style={{ gap: 6 }}>
        {ex.steps.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <AppText variant="callout" weight="700" color={t.tokens.primary} style={{ width: 18 }}>
              {i + 1}.
            </AppText>
            <AppText variant="callout" style={{ flex: 1 }}>
              {s}
            </AppText>
          </View>
        ))}
      </View>
      {!compact ? (
        <>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
            <Icon name="bulb" size="sm" color={t.tokens.mutedForeground} />
            <AppText variant="footnote" muted style={{ flex: 1 }}>
              {ex.tip}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
            <Icon name="alert" size="sm" color={t.tokens.destructive} />
            <AppText variant="footnote" style={{ flex: 1, color: t.tokens.destructive }}>
              {ex.mistake}
            </AppText>
          </View>
        </>
      ) : null}
    </View>
  );
}

/** A move in a list: name and what it works; opens to the moving figure and how to do it. */
export function MoveCard({ ex, move, meta, open, onToggle, n }: { ex: BwExercise; move?: MoveSpec; meta?: string; open: boolean; onToggle: () => void; n?: number }) {
  const t = useTheme();
  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: t.touch }}>
        {n !== undefined ? (
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.tokens.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="footnote" weight="700" color={t.tokens.primary}>
              {n}
            </AppText>
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <AppText weight="700">{ex.name}</AppText>
          <AppText variant="small" muted>
            {meta ?? ex.target}
          </AppText>
        </View>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="chevron" color={t.tokens.mutedForeground} size={18} />
        </View>
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}>
          {move ? (
            <View style={{ alignItems: 'center', borderRadius: t.radius.lg, backgroundColor: t.tokens.muted, paddingVertical: 8 }}>
              <FitnessDemo move={move} width={260} />
            </View>
          ) : null}
          <HowTo ex={ex} />
        </View>
      ) : null}
    </Card>
  );
}

/** "40 sn · 6 tekrar", "40 sn · her taraf 3 tekrar", "40 sn tut". */
export function moveMeta(tr: TFunction, move: MoveSpec | undefined, workSec: number): string {
  if (!move) return tr('fitness.metaWork', { sec: workSec });
  if (move.kind === 'hold') return move.sides ? tr('bodyweight.metaHoldSides', { sec: workSec }) : tr('fitness.metaHold', { sec: workSec });
  const reps = repsIn(move, workSec * 1000);
  return move.sides ? tr('fitness.metaSides', { sec: workSec, reps }) : tr('fitness.metaReps', { sec: workSec, reps });
}

/**
 * While working: the figure at the real tempo (own 40 ms clock), the big word, rep and side, seconds
 * left. A light tap on every new word; a longer one at the side change.
 */
export function WorkView({ move, state, paused, durationMs, strength, remain }: { move: MoveSpec; state: PlayerState<WorkoutPhase>; paused: boolean; durationMs: number; strength: HapticStrength; remain: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setClock(Date.now()), 40);
    return () => clearInterval(id);
  }, [paused]);
  // A paused player freezes its own time, so the clock value does not matter then.
  const elapsed = Math.max(0, durationMs - remainingInPhase(state, clock));
  const m = motionAt(move, elapsed, durationMs);
  const lastStep = useRef(m.stepKey);
  const lastSide = useRef(m.side);
  useEffect(() => {
    if (m.side !== lastSide.current) playCue('blockChange', strength);
    else if (m.stepKey !== lastStep.current) playCue('tap', strength);
    lastStep.current = m.stepKey;
    lastSide.current = m.side;
  }, [m.stepKey, m.side, strength]);
  const sideJustChanged = move.sides && m.side === 2 && elapsed - durationMs / 2 < 2500;
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <FitnessFigure move={move} pose={m.pose} mirrored={m.side === 2} width={290} />
      <AppText variant="display" center color={t.colors.accent} accessibilityLiveRegion="polite" style={{ fontSize: 40, lineHeight: 48 }}>
        {tr(`fitness.tempo.${m.word}`)}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <AppText variant="callout" weight="700" muted>
          {move.kind === 'hold' ? tr('fitness.holdOn') : tr('fitness.rep', { rep: m.rep, reps: m.reps })}
        </AppText>
        {move.sides ? (
          <AppText variant="callout" weight="700" color={sideJustChanged ? t.colors.accent : t.tokens.mutedForeground}>
            {sideJustChanged ? tr('fitness.switchSide') : tr('fitness.side', { n: m.side })}
          </AppText>
        ) : null}
        <AppText variant="callout" weight="700" muted tabular>
          {tr('fitness.secLeft', { sec: Math.ceil(remain / 1000) })}
        </AppText>
      </View>
    </View>
  );
}
