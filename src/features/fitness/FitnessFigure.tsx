import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Rect } from 'react-native-svg';

import { useTheme } from '@/components';

import { motionAt, type Joint, type MoveSpec, type Pose } from './motion';

/**
 * Original body figure for the pelvic fitness moves: near limbs solid, far limbs lighter (side view),
 * a mat under it and the worked area (the pelvis) marked. Side 2 is drawn mirrored. Front views draw
 * both sides alike.
 */
export function FitnessFigure({ move, pose, mirrored, width = 280 }: { move: MoveSpec; pose: Pose; mirrored?: boolean; width?: number }) {
  const t = useTheme();
  const near = t.tokens.foreground;
  const far = move.view === 'front' ? near : t.tokens.mutedForeground;
  const target = t.tokens.primary;
  const L = (a: Joint, b: Joint, w: number, c: string, o = 1) => <Line x1={pose[a][0]} y1={pose[a][1]} x2={pose[b][0]} y2={pose[b][1]} stroke={c} strokeWidth={w} strokeLinecap="round" opacity={o} />;
  const farO = move.view === 'front' ? 1 : 0.55;
  const k1 = pose.k1;
  // Framed around the move (all its poses), so lying moves are as large as standing ones.
  const vb = frameOf(move);
  const height = Math.round((width * vb.h) / vb.w);
  return (
    <View accessibilityRole="image" style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}>
        <Rect x={vb.x + 4} y={128} width={vb.w - 8} height={5} rx={2.5} fill={t.tokens.border} />
        <G transform={mirrored ? `translate(${2 * vb.x + vb.w} 0) scale(-1 1)` : undefined}>
          {L('p', 'k2', 9, far, farO)}
          {L('k2', 'a2', 8, far, farO)}
          {L('n', 'e2', 7, far, farO)}
          {L('e2', 'w2', 6, far, farO)}
          {move.prop === 'pillow' ? <Ellipse cx={k1[0] + 4} cy={k1[1] + 4} rx={9} ry={7} fill={t.tone.mind.fg} opacity={0.75} /> : null}
          {L('n', 'p', 14, near)}
          <Circle cx={pose.p[0]} cy={pose.p[1]} r={12} fill={target} opacity={0.4} />
          {L('p', 'k1', 10, near)}
          {L('k1', 'a1', 9, near)}
          {L('n', 'e1', 8, near)}
          {L('e1', 'w1', 7, near)}
          <Circle cx={pose.h[0]} cy={pose.h[1]} r={9.5} fill={near} />
        </G>
      </Svg>
    </View>
  );
}

const frames = new WeakMap<MoveSpec, { x: number; y: number; w: number; h: number }>();
/** Box around every pose of a move (plus head, limbs' thickness and the mat), at least 3:2 wide. */
function frameOf(move: MoveSpec) {
  const hit = frames.get(move);
  if (hit) return hit;
  let minX = 200;
  let maxX = 0;
  let minY = 140;
  for (const pose of Object.values(move.poses)) {
    if (!pose) continue;
    for (const [x, y] of Object.values(pose)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
    }
  }
  const pad = 14;
  let x = minX - pad;
  let w = maxX - minX + 2 * pad;
  const y = minY - pad;
  const h = 136 - y;
  // Not taller than 3:2 wide: widen around the middle instead.
  if (w < h * 1.5) {
    x -= (h * 1.5 - w) / 2;
    w = h * 1.5;
  }
  const f = { x, y, w, h };
  frames.set(move, f);
  return f;
}

/** The figure doing the move on a loop at its real tempo (exercise list, "Sıradaki" preview). */
export function FitnessDemo({ move, width, paused }: { move: MoveSpec; width?: number; paused?: boolean }) {
  const [ms, setMs] = useState(0);
  const start = useRef(0);
  useEffect(() => {
    if (paused) return;
    start.current = Date.now() - ms;
    const id = setInterval(() => setMs(Date.now() - start.current), 40);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, move]);
  return <FitnessFigure move={move} pose={motionAt(move, ms).pose} width={width} />;
}
