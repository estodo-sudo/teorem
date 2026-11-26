import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, useTheme } from '@/components';

import { generateMoveDemo } from './generateSession';
import type { MoveId } from './moves';
import { MuscleSphere } from './player/MuscleSphere';
import { sphereWord } from './player/sphereMotion';

type NewMove = Exclude<MoveId, 'elevator'>;

/** The circle doing one rep of the move on a loop, with the step word under it ("⅓ SIK", "YARIYA İN" …). */
export function MoveLoop({ move, size = 180 }: { move: NewMove; size?: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const phases = useMemo(() => generateMoveDemo(move).phases.filter((p) => p.kind !== 'countdown' && p.rep === 1), [move]);
  const [i, setI] = useState(0);
  const [key, setKey] = useState(0);
  const phase = phases[i % phases.length]!;
  // a long step turns into its hold word ("YARIMDA TUT") after a moment, as in the player
  const [lateKey, setLateKey] = useState(-1);
  const late = lateKey === key;
  useEffect(() => {
    const hold = setTimeout(() => setLateKey(key), 1300);
    const id = setTimeout(() => {
      setI((x) => (x + 1) % phases.length);
      setKey((k) => k + 1);
    }, phase.durationMs);
    return () => {
      clearTimeout(id);
      clearTimeout(hold);
    };
  }, [key, phase.durationMs, phases.length]);
  const f = t.player;
  const colors = { neutral: f.idle, accent: f.orbEdge, cool: f.relax, breath: t.tokens.breathe, ring: f.text, track: f.track, paused: f.paused, glow: f.glow, highlight: f.orbCenter, halo: f.halo, gap: f.bg };
  return (
    <View style={{ alignItems: 'center', gap: t.space.sm, paddingVertical: t.space.lg, borderRadius: t.radius.lg, backgroundColor: f.bg }} accessible accessibilityLabel={tr('moveIntro.demoA11y')}>
      <MuscleSphere size={size} phase={phase} exerciseType={move} phaseKey={key} elapsedMs={0} paused={false} colors={colors} />
      <AppText variant="title3" weight="600" color={f.text}>
        {tr(`player.phase.${sphereWord(phase, late ? phase.durationMs : 0, move)}`)}
      </AppText>
    </View>
  );
}
