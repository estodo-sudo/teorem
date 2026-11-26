/**
 * Timeline of the "Pelvik taban kasın nerede?" animation (SPEC_ANIMASYON_PELVIK §4, ANIM_A0_DUZELTME §4).
 * The single source of every duration and key frame: components read their values from `poseAt(t)` and
 * never write a time of their own.
 *
 * Everything here is a plain worklet function, so the scene computes its pose on the UI thread from one
 * shared time value, with no JS work per frame.
 */
import { FIGURE_CENTRE, LANDMARKS } from './paths';

export const TOTAL_MS = 50000;

export interface Scene {
  id: number;
  start: number;
  end: number;
  /** i18n key of the caption under the scene. */
  caption: string;
}

export const SCENES: readonly Scene[] = [
  { id: 1, start: 0, end: 5000, caption: 'introAnatomy.captions.s1' },
  { id: 2, start: 5000, end: 11000, caption: 'introAnatomy.captions.s2' },
  { id: 3, start: 11000, end: 18000, caption: 'introAnatomy.captions.s3' },
  { id: 4, start: 18000, end: 24000, caption: 'introAnatomy.captions.s4' },
  { id: 5, start: 24000, end: 31000, caption: 'introAnatomy.captions.s5' },
  { id: 6, start: 31000, end: 37000, caption: 'introAnatomy.captions.s6' },
  { id: 7, start: 37000, end: 45000, caption: 'introAnatomy.captions.s7' },
  { id: 8, start: 45000, end: 50000, caption: 'introAnatomy.captions.s8' },
];

/** Index of the scene playing at time t (the last one from its end on). */
export function sceneIndexAt(t: number): number {
  'worklet';
  for (let i = 0; i < SCENES.length; i++) if (t < SCENES[i]!.end) return i;
  return SCENES.length - 1;
}

/** Camera targets: the whole figure, the pelvis, and the wider view of scene 7 (belly, buttock, thigh). */
export const FOCUS = {
  full: { scale: 1, cx: FIGURE_CENTRE[0], cy: FIGURE_CENTRE[1] },
  pelvis: { scale: 2.6, cx: LANDMARKS.pelvisCentre[0], cy: LANDMARKS.pelvisCentre[1] },
  pelvisClose: { scale: 2.8, cx: LANDMARKS.pelvisCentre[0], cy: LANDMARKS.pelvisCentre[1] },
  hips: { scale: 1.4, cx: 200, cy: 386 },
} as const;

// ------------------------------------------------------------------ easing

export type EasingName = 'standard' | 'sine' | 'linear';

/** CSS-style cubic bezier (x1, y1, x2, y2) evaluated at progress x. */
function bezier(x: number, x1: number, y1: number, x2: number, y2: number): number {
  'worklet';
  let lo = 0;
  let hi = 1;
  let s = x;
  for (let i = 0; i < 24; i++) {
    s = (lo + hi) / 2;
    const u = 1 - s;
    const bx = 3 * u * u * s * x1 + 3 * u * s * s * x2 + s * s * s;
    if (bx < x) lo = s;
    else hi = s;
  }
  const u = 1 - s;
  return 3 * u * u * s * y1 + 3 * u * s * s * y2 + s * s * s;
}

/** `standard` = Easing.bezier(0.4, 0, 0.2, 1); `sine` = Easing.inOut(Easing.sin) (contraction, release). */
export function ease(name: EasingName, x: number): number {
  'worklet';
  const p = Math.min(1, Math.max(0, x));
  if (name === 'linear') return p;
  if (name === 'sine') return (1 - Math.cos(Math.PI * p)) / 2;
  return bezier(p, 0.4, 0, 0.2, 1);
}

/** A track: [time, value, easing used to reach this key]. Before the first key it holds the first value. */
export type Key = readonly [number, number, EasingName?];

export function track(keys: readonly Key[], t: number): number {
  'worklet';
  if (t <= keys[0]![0]) return keys[0]![1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i]!;
    const [t0, v0] = keys[i - 1]!;
    if (t < t1) return v0 + (v1 - v0) * ease(e ?? 'standard', (t - t0) / (t1 - t0));
  }
  return keys[keys.length - 1]![1];
}

// ------------------------------------------------------------------ tracks

const F = FOCUS;
export const TRACKS = {
  /** Camera. Scene 2 zooms on the pelvis, 5 closes in a little, 7 pulls back to the hips, 8 to the figure. */
  scale: [[5000, F.full.scale], [7500, F.pelvis.scale], [24000, F.pelvis.scale], [26000, F.pelvisClose.scale], [37000, F.pelvisClose.scale], [39000, F.hips.scale], [45000, F.hips.scale], [47000, F.full.scale]],
  cx: [[5000, F.full.cx], [7500, F.pelvis.cx], [37000, F.pelvis.cx], [39000, F.hips.cx], [45000, F.hips.cx], [47000, F.full.cx]],
  cy: [[5000, F.full.cy], [7500, F.pelvis.cy], [37000, F.pelvis.cy], [39000, F.hips.cy], [45000, F.hips.cy], [47000, F.full.cy]],
  /** Silhouette: fades in while rising 12 units (scene 1), dims behind the pelvis (2), returns for scene 7. */
  silhouette: [[0, 0], [1200, 1], [6000, 1], [8000, 0.35], [37000, 0.35], [39000, 1]],
  silhouetteRise: [[0, 12], [1200, 0]],
  /** Bones: drawn on in scene 2 (stroke dash 1 → 0). */
  bones: [[7000, 0], [7001, 1]],
  bonesDraw: [[7000, 0], [9000, 1]],
  /** Muscle: drawn from the pubis to the coccyx in scene 3. */
  muscle: [[11500, 0], [11501, 1]],
  muscleDraw: [[11500, 0], [14500, 1]],
  /** Organs land on the muscle from 4 units above (scene 4). */
  organs: [[18000, 0], [19000, 1]],
  organsDrop: [[18000, -4], [19000, 0]],
  /** Muscle sag: one 2-unit swing after it is drawn (scene 3), a 3-unit stretch as the organs land (4). */
  sag: [[14500, 0], [15000, 2, 'sine'], [15500, 0, 'sine'], [19000, 0], [19300, 3, 'sine'], [19900, 0, 'sine']],
  /** Contraction (scene 5) and release (scene 6, 4 s on purpose: longer than the contraction). */
  contract: [[25000, 0], [28000, 1, 'sine'], [31000, 1], [35000, 0, 'sine']],
  /** Labels: "Pelvik taban" at 14.5 s, "Mesane" and "Bağırsak" at 19.5 s, all off as scene 7 starts. */
  labelFloor: [[14500, 0], [14800, 1], [37000, 1], [37500, 0]],
  labelOrgans: [[19500, 0], [19800, 1], [37000, 1], [37500, 0]],
  /**
   * Scene 7: belly, buttock and thigh light up one after another (1.5 s apart), then settle a little;
   * each one's cross appears and stays. Scene 8 fades them all.
   */
  wrongBelly: [[39000, 0], [39400, 1], [40500, 0.6], [45000, 0.6], [46000, 0]],
  markBelly: [[39300, 0], [39600, 1], [45000, 1], [46000, 0]],
  wrongButtock: [[40500, 0], [40900, 1], [42000, 0.6], [45000, 0.6], [46000, 0]],
  markButtock: [[40800, 0], [41100, 1], [45000, 1], [46000, 0]],
  wrongThigh: [[42000, 0], [42400, 1], [43500, 0.6], [45000, 0.6], [46000, 0]],
  markThigh: [[42300, 0], [42600, 1], [45000, 1], [46000, 0]],
  /** Scene 8: the closing buttons rise in from below at 46 s. */
  buttons: [[46000, 0], [46600, 1]],
} as const satisfies Record<string, readonly Key[]>;

/** How far the closing buttons rise while they fade in (units of screen px). */
export const BUTTONS_RISE = 24;

/** Scene 8: the endless soft glow on the pelvic floor (one full in-and-out cycle). */
export const LOOP_MS = 3000;

/** Caption change (§5): the old text fades out, the new one fades in rising 6 units. */
export const CAPTION = { outMs: 200, inMs: 300, rise: 6 } as const;

/**
 * Sound (our own tones, scripts/generate-intro-sounds.js). A quiet ambient loop under the whole 50 s,
 * fading out over the last 3 s; on top, a soft tick for each cross in scene 7 and a chime with the
 * button. The contraction, hold and release have no sound of their own (the vibration carries them).
 */
export type IntroSoundId = 'tick' | 'chime';
export const SOUND = {
  /** Background music (music.m4a, 52 s: one pass covers the whole animation). */
  ambient: { loopMs: 52000, volume: 0.45, fadeFrom: 47000 },
  cues: [
    { at: 39300, id: 'tick', ms: 90 },
    { at: 40800, id: 'tick', ms: 90 },
    { at: 42300, id: 'tick', ms: 90 },
    { at: 46000, id: 'chime', ms: 1800 },
  ] as readonly { at: number; id: IntroSoundId; ms: number }[],
} as const;

/**
 * Vibration (§6). Contraction: a light tap every 180 ms, every 120 ms in its last second. Hold: a very
 * light tap every 600 ms. Release: the gap grows from 200 to 700 ms, then stops.
 */
export const HAPTIC = {
  contract: { start: 25000, end: 28000, gap: 180, fastFrom: 27000, fastGap: 120 },
  hold: { start: 28000, end: 31000, gap: 600 },
  release: { start: 31000, end: 35000, fromGap: 200, toGap: 700 },
} as const;

/** Scene 1: the soft light on the pelvis blinks twice (1.4 s cycle) from 1.5 s, then is off. */
export const PELVIS_LIGHT = { start: 1500, cycle: 1400, count: 2 } as const;

function pelvisLight(t: number): number {
  'worklet';
  const { start, cycle, count } = PELVIS_LIGHT;
  if (t < start || t >= start + cycle * count) return 0;
  return Math.sin((Math.PI * ((t - start) % cycle)) / cycle);
}

/**
 * Glow around the muscle: opens with the contraction, breathes 80–100 % while held, fades on release.
 * From scene 8 on it follows `pulse` (0–1, the endless 3 s loop that keeps going after the 50 s).
 */
function glow(t: number, pulse: number): number {
  'worklet';
  if (t < 25000) return 0;
  if (t < 28000) return ease('sine', (t - 25000) / 3000);
  if (t < 31000) return 0.9 + 0.1 * Math.cos((2 * Math.PI * (t - 28000)) / 1500);
  if (t < 35000) return 1 - ease('sine', (t - 31000) / 4000);
  if (t < 37000) return 0;
  // Scene 7: the muscle keeps glowing softly. Scene 8: the endless loop.
  if (t < 45000) return 0.4 * ease('standard', (t - 37000) / 1000);
  return 0.4 + 0.4 * pulse;
}

// ------------------------------------------------------------------ pose

/** Everything the scene draws at one moment. */
export interface TimelinePose {
  scale: number;
  cx: number;
  cy: number;
  silhouette: number;
  silhouetteRise: number;
  pelvisLight: number;
  bones: number;
  /** 0–1 share of the bone lines drawn. */
  bonesDraw: number;
  organs: number;
  organsDrop: number;
  muscle: number;
  muscleDraw: number;
  sag: number;
  contract: number;
  glow: number;
  labelFloor: number;
  labelOrgans: number;
  wrongBelly: number;
  markBelly: number;
  wrongButtock: number;
  markButtock: number;
  wrongThigh: number;
  markThigh: number;
  buttons: number;
  /** Opacity of the whole drawing (only below 1 during reduce-motion cross-fades). */
  fade: number;
}

/** The pose at time t (ms). `pulse` is the scene-8 loop (0–1), 0 when not running. */
export function poseAt(t: number, pulse = 0): TimelinePose {
  'worklet';
  const k = TRACKS;
  return {
    scale: track(k.scale, t),
    cx: track(k.cx, t),
    cy: track(k.cy, t),
    silhouette: track(k.silhouette, t),
    silhouetteRise: track(k.silhouetteRise, t),
    pelvisLight: pelvisLight(t),
    bones: track(k.bones, t),
    bonesDraw: track(k.bonesDraw, t),
    organs: track(k.organs, t),
    organsDrop: track(k.organsDrop, t),
    muscle: track(k.muscle, t),
    muscleDraw: track(k.muscleDraw, t),
    sag: track(k.sag, t),
    contract: track(k.contract, t),
    glow: glow(t, pulse),
    labelFloor: track(k.labelFloor, t),
    labelOrgans: track(k.labelOrgans, t),
    wrongBelly: track(k.wrongBelly, t),
    markBelly: track(k.markBelly, t),
    wrongButtock: track(k.wrongButtock, t),
    markButtock: track(k.markButtock, t),
    wrongThigh: track(k.wrongThigh, t),
    markThigh: track(k.markThigh, t),
    buttons: track(k.buttons, t),
    fade: 1,
  };
}

/** Reduce motion: cross-fade length between scenes, and how long the contraction takes. */
export const REDUCED = { fadeMs: 300, contractMs: 600 } as const;

/**
 * Reduce motion (§8): no camera moves and nothing is drawn on; each scene shows its own last frame,
 * faded in over 300 ms. The contraction is still shown, rising over 600 ms.
 */
export function poseAtReduced(t: number, pulse = 0): TimelinePose {
  'worklet';
  const s = SCENES[sceneIndexAt(t)]!;
  const p = poseAt(s.end - 1, pulse);
  const into = t - s.start;
  p.fade = s.id === 1 ? 1 : Math.min(1, into / REDUCED.fadeMs);
  if (s.id === 1) p.silhouetteRise = 0;
  if (s.id === 5) {
    const c = ease('sine', into / REDUCED.contractMs);
    p.contract = c;
    p.glow = c;
  }
  return p;
}
