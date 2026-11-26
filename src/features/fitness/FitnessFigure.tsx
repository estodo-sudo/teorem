import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useLive } from '@/lib/useLive';
import { useTheme } from '@/components';

import { motionAt, pillowRx, type MoveSpec, type Pose, type TempoWord } from './motion';

type P = [number, number];
const mid = (a: P, b: P, f = 0.5): P => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];

/**
 * Toes: given in the pose, or drawn automatically — forward (in `facing`) when the shin is upright,
 * pointing down to the floor when the shin lies flat (plank, all fours).
 */
function toe(pose: Pose, k: 'k1' | 'k2', a: 'a1' | 'a2', given: P | undefined, facing: 1 | -1): P {
  if (given) return given;
  const [kx, ky] = pose[k];
  const [ax, ay] = pose[a];
  const dx = ax - kx;
  const dy = ay - ky;
  if (Math.abs(dy) >= Math.abs(dx)) return [ax + 9 * facing, ay];
  return [ax, ay + 7];
}

/**
 * Original body figure (improved for Aletsiz Fitness, 2026-11-22; aesthetic pass 2026-11-25: spotlight,
 * mat and shadow, limb sheen, a breathing glow and a direction arrow): limbs with a thin outline so
 * crossing limbs stay apart, a torso that narrows from chest to waist, neck, hands and feet; near
 * limbs solid, far limbs lighter (side view); the worked area glows in the accent colour. Side 2 is
 * drawn mirrored. Front views draw both sides alike.
 */
/** Which way the worked area moves for a tempo word (aesthetic pass 2026-11-25): a small arrow shows it. */
const ARROW: Partial<Record<TempoWord, 'up' | 'down' | 'in' | 'out'>> = {
  lift: 'up', up: 'up', reach: 'out', lower: 'down', down: 'down', press: 'down', squeeze: 'in', close: 'in', open: 'out', pull: 'in', forward: 'out',
};

export function FitnessFigure({ move, pose, mirrored, width = 280, word, pulse = 0.5 }: { move: MoveSpec; pose: Pose; mirrored?: boolean; width?: number; word?: TempoWord; pulse?: number }) {
  const t = useTheme();
  const near = t.tokens.foreground;
  const far = move.view === 'front' ? near : t.tokens.mutedForeground;
  const edge = t.tokens.card;
  const glow = t.tokens.primary;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const facing: 1 | -1 = move.facing === 'left' ? -1 : 1;
  const chest = pose.m ?? mid(pose.n, pose.p, 0.42);
  const t1 = toe(pose, 'k1', 'a1', pose.t1, facing);
  const t2 = toe(pose, 'k2', 'a2', pose.t2, facing);
  const head = pose.h;
  const neckEnd = mid(pose.n, head, 0.55);
  const focus = move.focus ?? ['hips'];
  // A segment drawn with an outline: first a slightly wider stroke in the card colour, then the limb.
  const seg = (a: P, b: P, w: number, c: string, key: string, o = 1) => (
    <G key={key} opacity={o}>
      <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={edge} strokeWidth={w + 2.5} strokeLinecap="round" />
      <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />
      {/* sheen: a thin lighter line along the top gives the limb some volume */}
      {o === 1 ? <Line x1={a[0]} y1={a[1] - w * 0.22} x2={b[0]} y2={b[1] - w * 0.22} stroke="#fff" strokeOpacity={0.16} strokeWidth={w * 0.28} strokeLinecap="round" /> : null}
    </G>
  );
  const halo = (a: P, b: P, w: number, key: string) => <Line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={glow} strokeWidth={w} strokeLinecap="round" opacity={0.38} />;
  const dot = (c: P, r: number, key: string) => <Circle key={key} cx={c[0]} cy={c[1]} r={r} fill={glow} opacity={0.38} />;
  const glows: ReactNode[] = [];
  for (const f of focus) {
    if (f === 'core') glows.push(halo(chest, pose.p, 24, 'g-core'));
    if (f === 'chest') glows.push(halo(pose.n, chest, 24, 'g-chest'));
    if (f === 'back') glows.push(halo(pose.n, pose.p, 24, 'g-back'));
    if (f === 'shoulders') glows.push(dot(pose.n, 12, 'g-sh'));
    if (f === 'arms') glows.push(halo(pose.n, pose.e1, 16, 'g-a1'), halo(pose.e1, pose.w1, 14, 'g-a2'));
    if (f === 'thighs') glows.push(halo(pose.p, pose.k1, 18, 'g-t1'), halo(pose.p, pose.k2, 18, 'g-t2'));
    if (f === 'hips') glows.push(dot(pose.p, 13, 'g-hip'));
    if (f === 'calves') glows.push(halo(pose.k1, pose.a1, 15, 'g-c1'), halo(pose.k2, pose.a2, 15, 'g-c2'));
    if (f === 'full') glows.push(halo(pose.n, pose.p, 26, 'g-f1'), halo(pose.p, pose.k1, 18, 'g-f2'), halo(pose.n, pose.e1, 15, 'g-f3'));
  }
  const farO = move.view === 'front' ? 1 : 0.6;
  // The worked area moves this way now (arrow), and its glow breathes with the tempo.
  const dir = word ? ARROW[word] : undefined;
  const anchor = focus.includes('thighs') ? mid(pose.p, pose.k1) : focus.includes('core') ? chest : pose.p;
  const bob = (pulse - 0.5) * 4;
  const k1 = pose.k1;
  // Framed around the move (all its poses), so lying moves are as large as standing ones.
  const vb = frameOf(move);
  const height = Math.round((width * vb.h) / vb.w);
  return (
    <View accessibilityRole="image" style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}>
        <Defs>
          <RadialGradient id={`spot${uid}`} cx="50%" cy="62%" r="60%">
            <Stop offset="0" stopColor={glow} stopOpacity={0.14} />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`shadow${uid}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#000" stopOpacity={0.28} />
            <Stop offset="1" stopColor="#000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* soft spotlight behind the figure, a mat with a lighter edge, and a shadow under the body */}
        <Rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={`url(#spot${uid})`} />
        <Rect x={vb.x + 4} y={127} width={vb.w - 8} height={7} rx={3.5} fill={t.tokens.muted} stroke={t.tokens.border} strokeWidth={1} />
        <Line x1={vb.x + 8} y1={128.2} x2={vb.x + vb.w - 8} y2={128.2} stroke="#fff" strokeOpacity={0.18} strokeWidth={1} />
        <Ellipse cx={(Math.min(pose.h[0], pose.a1[0], pose.w1[0]) + Math.max(pose.h[0], pose.a1[0], pose.k1[0])) / 2} cy={127.5} rx={Math.abs(pose.a1[0] - pose.h[0]) / 2 + 12} ry={4} fill={`url(#shadow${uid})`} />
        <G transform={mirrored ? `translate(${2 * vb.x + vb.w} 0) scale(-1 1)` : undefined}>
          {(move.props ?? []).map((r, i) => (
            <Rect key={`prop-${i}`} x={r.x} y={r.y} width={r.w} height={r.h} rx={3} fill={t.tokens.border} />
          ))}
          <G opacity={0.7 + 0.6 * pulse}>{glows}</G>
          {/* Far side */}
          {seg(pose.p, pose.k2, 10, far, 'fl1', farO)}
          {seg(pose.k2, pose.a2, 8.5, far, 'fl2', farO)}
          {seg(pose.a2, t2, 5.5, far, 'fl3', farO)}
          {seg(pose.n, pose.e2, 7.5, far, 'fa1', farO)}
          {seg(pose.e2, pose.w2, 6.5, far, 'fa2', farO)}
          <Circle cx={pose.w2[0]} cy={pose.w2[1]} r={3.6} fill={far} opacity={farO} />
          {/* Torso: wide at the chest, narrower at the waist; neck and head. */}
          {seg(pose.n, neckEnd, 6.5, near, 'neck')}
          {seg(pose.n, chest, 17, near, 'chest')}
          {seg(chest, pose.p, 13.5, near, 'waist')}
          <Circle cx={head[0]} cy={head[1]} r={10.5} fill={edge} />
          <Circle cx={head[0]} cy={head[1]} r={9.5} fill={near} />
          <Circle cx={head[0] - 3} cy={head[1] - 3.5} r={3.6} fill="#fff" opacity={0.16} />
          {/* Near side */}
          {seg(pose.p, pose.k1, 11, near, 'nl1')}
          {seg(pose.k1, pose.a1, 9, near, 'nl2')}
          {seg(pose.a1, t1, 6, near, 'nl3')}
          {seg(pose.n, pose.e1, 8, near, 'na1')}
          {seg(pose.e1, pose.w1, 7, near, 'na2')}
          <Circle cx={pose.w1[0]} cy={pose.w1[1]} r={4} fill={near} />
          {/* The pillow between the knees, drawn on top so it stays visible (2026-11-23): an outlined cushion
              in the accent colour with a seam; it gets thinner as the knees squeeze together. */}
          {move.prop === 'pillow' ? (
            <G>
              <Ellipse cx={k1[0] - 2} cy={k1[1] + 5} rx={pillowRx(pose) + 2.5} ry={10.5} fill={edge} />
              <Ellipse cx={k1[0] - 2} cy={k1[1] + 5} rx={pillowRx(pose)} ry={9} fill={glow} />
              <Ellipse cx={k1[0] - 2} cy={k1[1] + 5} rx={Math.max(2, pillowRx(pose) - 4)} ry={5.5} fill={edge} opacity={0.35} />
            </G>
          ) : null}
          {/* direction of the move now: a small chevron pair by the worked area */}
          {dir ? (
            <G transform={`translate(${anchor[0]} ${Math.max(vb.y + 12, anchor[1] - 22) + (dir === 'up' ? -bob : dir === 'down' ? bob : 0)})`} opacity={0.95}>
              {dir === 'up' || dir === 'down' ? (
                <Path d={dir === 'up' ? 'M-6 3 L0 -3 L6 3 M-6 9 L0 3 L6 9' : 'M-6 -3 L0 3 L6 -3 M-6 -9 L0 -3 L6 -9'} stroke={glow} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              ) : (
                <Path d={dir === 'in' ? `M${-14 + bob} -5 L${-8 + bob} 0 L${-14 + bob} 5 M${14 - bob} -5 L${8 - bob} 0 L${14 - bob} 5` : `M${-8 - bob} -5 L${-14 - bob} 0 L${-8 - bob} 5 M${8 + bob} -5 L${14 + bob} 0 L${8 + bob} 5`} stroke={glow} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              )}
            </G>
          ) : null}
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
  for (const r of move.props ?? []) {
    minX = Math.min(minX, r.x);
    maxX = Math.max(maxX, r.x + r.w);
    minY = Math.min(minY, r.y);
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
  // Battery (round 8): only while the screen is seen.
  const live = useLive();
  useEffect(() => {
    if (paused || !live) return;
    start.current = Date.now() - ms;
    const id = setInterval(() => setMs(Date.now() - start.current), 40);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, move, live]);
  const m = motionAt(move, ms);
  return <FitnessFigure move={move} pose={m.pose} width={width} word={m.word} pulse={(Math.sin(ms / 320) + 1) / 2} />;
}
