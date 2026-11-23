import posesJson from './poses.json';

/**
 * Pelvic fitness motion (user request 2026-11-22: "ne yapacağımı bilemedim"): every move has a tempo
 * — e.g. köprü = KALDIR 2 s → TUT 2 s → İNDİR 2 s — and two or three key poses. At any moment of an
 * exercise this gives the word to show, the rep, the side and the figure's pose. Pure.
 */

export type Joint = 'h' | 'n' | 'p' | 'k1' | 'a1' | 'k2' | 'a2' | 'e1' | 'w1' | 'e2' | 'w2';
/**
 * Optional toe points (t1 near, t2 far); without them the feet are drawn automatically. Optional m: the
 * middle of the back, so the spine can round or arch (cat-cow); without it the torso is straight.
 */
export type Pose = Record<Joint, [number, number]> & { t1?: [number, number]; t2?: [number, number]; m?: [number, number] };
export type PoseKey = 'A' | 'B' | 'C' | 'D';
/** Word keys under fitness.tempo. */
export type TempoWord = 'lift' | 'hold' | 'lower' | 'press' | 'release' | 'squeeze' | 'relax' | 'open' | 'close' | 'reach' | 'back' | 'down' | 'up' | 'forward' | 'breatheIn' | 'breatheOut' | 'pull' | 'left' | 'right' | 'circle' | 'jump';
/** Body areas the figure marks as worked. */
export type Focus = 'core' | 'chest' | 'back' | 'shoulders' | 'arms' | 'thighs' | 'hips' | 'calves' | 'full';

export interface MoveSpec {
  view: 'side' | 'front';
  /** reps = a repeated movement; hold = keep the position and breathe. */
  kind: 'reps' | 'hold';
  /** One side first, the other after half the time. */
  sides: boolean;
  prop?: 'pillow';
  /** Which way the toes point when the feet are drawn automatically (default right). */
  facing?: 'left' | 'right';
  /** Worked area to mark (default: the pelvis). */
  focus?: Focus[];
  /** Furniture drawn behind the figure: a wall, a chair, a step (rectangles in figure units). */
  props?: { x: number; y: number; w: number; h: number }[];
  tempo: { word: TempoWord; sec: number; to: PoseKey }[];
  poses: Partial<Record<PoseKey, Pose>> & { A: Pose; B: Pose };
}

const JOINTS: Joint[] = ['h', 'n', 'p', 'k1', 'a1', 'k2', 'a2', 'e1', 'w1', 'e2', 'w2'];

type RawMove = { view: 'side' | 'front'; kind: 'reps' | 'hold'; sides: boolean; prop?: 'pillow'; facing?: 'left' | 'right'; focus?: Focus[]; props?: MoveSpec['props']; tempo: [string, number, string][] } & Record<string, unknown>;

/** Moves from a poses JSON file (keys starting with "_" are notes). */
export function buildMoves(raw: unknown): Record<string, MoveSpec> {
  return Object.fromEntries(
    Object.entries(raw as Record<string, RawMove>)
      .filter(([k]) => !k.startsWith('_'))
      .map(([id, m]) => [
        id,
        {
          view: m.view,
          kind: m.kind,
          sides: m.sides,
          ...(m.prop ? { prop: m.prop } : {}),
          ...(m.facing ? { facing: m.facing } : {}),
          ...(m.focus ? { focus: m.focus } : {}),
          ...(m.props ? { props: m.props } : {}),
          tempo: m.tempo.map(([word, sec, to]) => ({ word: word as TempoWord, sec, to: to as PoseKey })),
          poses: Object.fromEntries((['A', 'B', 'C', 'D'] as const).filter((k) => m[k]).map((k) => [k, m[k] as Pose])) as MoveSpec['poses'],
        },
      ]),
  );
}

/** Kasık Fitness moves. */
export const MOVES: Record<string, MoveSpec> = buildMoves(posesJson);

/** One tempo cycle (ms). */
export const cycleMs = (m: MoveSpec) => m.tempo.reduce((a, s) => a + s.sec * 1000, 0);
/** Whole reps in `workMs` (per side when the move has sides). */
export const repsIn = (m: MoveSpec, workMs: number) => Math.max(1, Math.floor((m.sides ? workMs / 2 : workMs) / cycleMs(m)));

export interface MotionState {
  word: TempoWord;
  /** 1-based rep and reps per side. */
  rep: number;
  reps: number;
  /** 1 or 2 (always 1 without sides). */
  side: 1 | 2;
  /** Index of the tempo step overall (changes on every new word: a cue for a tap). */
  stepKey: number;
  /** Seconds left in this tempo step. */
  stepLeft: number;
  pose: Pose;
}

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const mix = (x: [number, number], y: [number, number], f: number): [number, number] => [x[0] + (y[0] - x[0]) * f, x[1] + (y[1] - x[1]) * f];
const lerp = (a: Pose, b: Pose, f: number): Pose => {
  const out = Object.fromEntries(JOINTS.map((j) => [j, mix(a[j], b[j], f)])) as Pose;
  if (a.t1 && b.t1) out.t1 = mix(a.t1, b.t1, f);
  if (a.t2 && b.t2) out.t2 = mix(a.t2, b.t2, f);
  if (a.m && b.m) out.m = mix(a.m, b.m, f);
  return out;
};

/**
 * Where the move is `elapsedMs` into an exercise of `workMs`. Each step moves the figure towards its
 * pose over the whole step (a hold step keeps it), so the figure goes at the speed the user should.
 */
export function motionAt(m: MoveSpec, elapsedMs: number, workMs = Number.POSITIVE_INFINITY): MotionState {
  const half = m.sides && Number.isFinite(workMs) ? workMs / 2 : Number.POSITIVE_INFINITY;
  const side: 1 | 2 = elapsedMs >= half ? 2 : 1;
  const local = Math.max(0, side === 2 ? elapsedMs - half : elapsedMs);
  const cyc = cycleMs(m);
  const cycle = Math.floor(local / cyc);
  let within = local - cycle * cyc;
  let i = 0;
  while (i < m.tempo.length - 1 && within >= m.tempo[i]!.sec * 1000) within -= m.tempo[i++]!.sec * 1000;
  const step = m.tempo[i]!;
  // A hold starts in its first pose; a rep starts from A.
  const prevKey: PoseKey = i > 0 ? m.tempo[i - 1]!.to : cycle === 0 ? (m.kind === 'hold' ? m.tempo[0]!.to : 'A') : m.tempo[m.tempo.length - 1]!.to;
  const from = m.poses[prevKey] ?? m.poses.A;
  const to = m.poses[step.to] ?? m.poses.A;
  const f = ease(Math.min(1, within / (step.sec * 1000)));
  const perSide = Number.isFinite(workMs) ? repsIn(m, workMs) : Number.POSITIVE_INFINITY;
  return {
    word: step.word,
    rep: Math.min(cycle + 1, perSide === Number.POSITIVE_INFINITY ? cycle + 1 : perSide),
    reps: perSide === Number.POSITIVE_INFINITY ? 0 : perSide,
    side,
    stepKey: (side - 1) * 10000 + cycle * m.tempo.length + i,
    stepLeft: Math.max(0, Math.ceil(step.sec - within / 1000)),
    pose: lerp(from, to, f),
  };
}
