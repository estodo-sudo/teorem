/**
 * SVG geometry for the "Pelvik taban kasın nerede?" animation (SPEC_ANIMASYON_PELVIK §3, ANIM_A0_DUZELTME).
 *
 * Canvas: viewBox 0 0 360 640. Side (sagittal) view, the person faces RIGHT and sits upright on a stool,
 * so "front" (pubis, belly) is +x and "back" (sacrum, coccyx) is −x. No face, hair, clothes or external
 * genitals; the prostate is not drawn either.
 *
 * Proportions (stature ≈ 615 units, so 1 cm ≈ 3.5 units): body depth at the hips ≈ 25 cm → ≈ 88 units;
 * sacral promontory → top of the pubic symphysis ≈ 11 cm → ≈ 40 units; pubis → coccyx tip ≈ 11 cm.
 */

export type Pt = readonly [number, number];

export const VIEWBOX = { w: 360, h: 640 } as const;

/** Landmarks the muscle and organs hang on. */
export const LANDMARKS = {
  /** Back-lower edge of the pubic symphysis: the muscle's front end. */
  pubisBackLower: [194, 410] as Pt,
  /** Tip of the coccyx: the muscle's back end. */
  coccyxTip: [155, 417] as Pt,
  /** Point the camera keeps in the middle while it is on the pelvis (scenes 2–6). */
  pelvisCentre: [172, 392] as Pt,
} as const;

/** Seated body outline (one closed path): neck, back, buttock, thigh, calf, foot, shin, belly, chest. */
export const SILHOUETTE_BODY =
  'M166 180 C152 196 146 214 146 236 C144 270 141 300 140 332 C139 356 128 374 122 396 C118 414 122 432 134 437 ' +
  'L282 440 C296 442 302 452 302 470 L300 582 C300 592 306 596 316 596 L350 597 C356 597 357 588 350 584 ' +
  'L330 574 C322 570 320 562 320 552 L322 432 C324 410 312 394 292 392 L214 389 C210 360 214 330 212 300 ' +
  'C210 262 206 236 198 214 C194 202 192 192 192 180 Z';

/** Head: a plain circle (radius 10 % smaller than the first draft). */
export const HEAD = { cx: 179, cy: 150, r: 30 } as const;

/** Arm: from the shoulder down to the elbow, then the forearm to a hand resting on the middle of the thigh. */
export const ARM = 'M178 226 C182 270 184 308 186 332 C204 350 228 372 250 386';
export const ARM_WIDTH = 20;

/** Stool: one thin line for the seat and two for the legs. */
export const STOOL = ['M108 440 L238 440', 'M124 440 L114 604', 'M222 440 L232 604'] as const;

/** Whole figure (head top 120 … stool feet 604, stool 108 … toes 357): the full view keeps this in the middle. */
export const FIGURE_CENTRE: Pt = [232, 362];

/**
 * Pelvis, side view (stroke only):
 * - sacrum + coccyx: one "comma", thick at the top behind, tapering downwards, its tip curling slightly
 *   forwards; the tip is where the muscle attaches;
 * - pubis: a small rounded oval at the front, low down;
 * - iliac wing: one thin arc on top, from the sacrum forwards (drawn fainter).
 * The bowl's floor is left open: the muscle closes it.
 */
export const SACRUM = 'M163 365 C160 381 157 396 154 406 C152 410 152 414 155 417 C151 417 147 414 144 408 C138 396 136 380 139 369 C141 362 147 359 154 359 C159 359 162 361 163 365 Z';
export const PUBIS = 'M199 392 C204 394 203 402 199 410 C196 414 192 412 193 406 C194 399 195 391 199 392 Z';
export const ILIUM = 'M150 352 C156 336 178 330 196 338 C206 344 210 356 208 368 C206 376 203 382 200 388';

/**
 * Pelvic floor muscle: a cubic curve from the pubis to the coccyx tip. Its two inner control points move
 * between rest and contraction; the end points never move.
 * - rest: hangs as a bowl, deepest point 14 units below the line joining its ends;
 * - contracted: the middle and back part lift up and forwards; the deepest point rises 12 and moves
 *   6 towards the pubis, and the curve stays a shallow bowl.
 */
export const FLOOR = {
  rest: [[184, 431.54], [164, 432.94]] as const,
  contracted: [[189, 416], [170, 417.4]] as const,
};

// Called from UI-thread worklets (floorControls), so they must be worklets too.
function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}
function clamp01(v: number): number {
  'worklet';
  return Math.min(1, Math.max(0, v));
}

/** Inner control points at a given contraction (0 = rest, 1 = fully contracted). */
export function floorControls(contract: number): [Pt, Pt] {
  'worklet';
  const c = clamp01(contract);
  const [r1, r2] = FLOOR.rest;
  const [c1, c2] = FLOOR.contracted;
  return [
    [lerp(r1[0], c1[0], c), lerp(r1[1], c1[1], c)],
    [lerp(r2[0], c2[0], c), lerp(r2[1], c2[1], c)],
  ];
}

/** The muscle as an SVG path, drawn from the pubis back to the coccyx. `sag` pushes the middle down. */
export function floorPath(contract: number, sag = 0): string {
  'worklet';
  const [a, b] = floorControls(contract);
  const [x0, y0] = LANDMARKS.pubisBackLower;
  const [x3, y3] = LANDMARKS.coccyxTip;
  return `M${x0} ${y0} C${a[0].toFixed(2)} ${(a[1] + sag).toFixed(2)} ${b[0].toFixed(2)} ${(b[1] + sag).toFixed(2)} ${x3} ${y3}`;
}

/** Point on the muscle at parameter t (0 = pubis, 1 = coccyx tip). */
export function floorPoint(contract: number, t: number): Pt {
  const [a, b] = floorControls(contract);
  const p0 = LANDMARKS.pubisBackLower;
  const p3 = LANDMARKS.coccyxTip;
  const u = 1 - t;
  const f = (i: 0 | 1) => u * u * u * p0[i] + 3 * u * u * t * a[i] + 3 * u * t * t * b[i] + t * t * t * p3[i];
  return [f(0), f(1)];
}

/** y of the muscle's centre line at a given x (x between the coccyx tip and the pubis). */
export function floorYAt(contract: number, x: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (floorPoint(contract, mid)[0] > x) lo = mid;
    else hi = mid;
  }
  return floorPoint(contract, (lo + hi) / 2)[1];
}

/** y of the line joining the muscle's two ends, at a given x. */
export function chordYAt(x: number): number {
  const [x0, y0] = LANDMARKS.pubisBackLower;
  const [x3, y3] = LANDMARKS.coccyxTip;
  return y0 + ((y3 - y0) * (x - x0)) / (x3 - x0);
}

/** The muscle's deepest point: the one furthest below the line joining its ends (x, y, distance below). */
export function floorDeepest(contract: number): { x: number; y: number; depth: number } {
  let best = { x: 0, y: 0, depth: -Infinity };
  for (let i = 0; i <= 400; i++) {
    const [x, y] = floorPoint(contract, i / 400);
    const depth = y - chordYAt(x);
    if (depth > best.depth) best = { x, y, depth };
  }
  return best;
}

/** Muscle line width (screen px): 8 at rest, 10 when contracted. */
export const floorWidthPx = (contract: number) => 8 + 2 * clamp01(contract);

/** Organs as ellipses: `cx` at rest (they move 3 forward with a full contraction); `cy` is fitted on the muscle. */
export interface Organ {
  cx: number;
  rx: number;
  ry: number;
  /** Clockwise rotation in degrees (positive tilts the top forwards). */
  rot: number;
}
/** Bladder: just behind and above the pubis, on the front part of the muscle. */
export const BLADDER: Organ = { cx: 181, rx: 8.5, ry: 12, rot: 0 };
/** End of the bowel (rectum): in front of the sacrum, on the back part of the muscle; its lower end leans forwards, as the anorectal angle does. */
export const RECTUM: Organ = { cx: 167, rx: 5.5, ry: 18, rot: -8 };
/** How far organs move forwards with a full contraction. */
export const ORGAN_FORWARD = 3;
/** Space left between an organ's lower edge and the muscle's upper edge. */
export const ORGAN_GAP = 1;

/** Points on an organ's outline, relative to its centre. */
export function organOutline(o: Organ, n = 72): Pt[] {
  const r = (o.rot * Math.PI) / 180;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    const x = o.rx * Math.cos(a);
    const y = o.ry * Math.sin(a);
    out.push([x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]);
  }
  return out;
}

/**
 * Where an organ sits: moved forwards with the contraction, then lowered until its lowest outline point
 * (checked along the whole outline, against the muscle at that x) is `gap` units above the muscle's upper
 * edge. `halfWidth` is half the muscle line in canvas units.
 */
export function organCentre(o: Organ, contract: number, halfWidth: number, gap = ORGAN_GAP): Pt {
  const cx = o.cx + ORGAN_FORWARD * clamp01(contract);
  const [x3] = LANDMARKS.coccyxTip;
  const [x0] = LANDMARKS.pubisBackLower;
  let cy = Infinity;
  for (const [dx, dy] of organOutline(o)) {
    const x = cx + dx;
    if (x <= x3 || x >= x0) continue;
    cy = Math.min(cy, floorYAt(contract, x) - halfWidth - gap - dy);
  }
  return [cx, cy];
}

/** Smallest distance between an organ's outline and the muscle's upper edge (negative = overlapping). */
export function organClearance(o: Organ, centre: Pt, contract: number, halfWidth: number): number {
  const [x3] = LANDMARKS.coccyxTip;
  const [x0] = LANDMARKS.pubisBackLower;
  let min = Infinity;
  for (const [dx, dy] of organOutline(o, 360)) {
    const x = centre[0] + dx;
    if (x <= x3 || x >= x0) continue;
    min = Math.min(min, floorYAt(contract, x) - halfWidth - (centre[1] + dy));
  }
  return min;
}

/** One still state, as checked in A0. */
export interface Pose {
  scale: number;
  cx: number;
  cy: number;
  contract: number;
}
export const POSE_REST: Pose = { scale: 2.6, cx: LANDMARKS.pelvisCentre[0], cy: LANDMARKS.pelvisCentre[1], contract: 0 };
/** Contracted, with the rest frame's camera so the bones stay put in the side-by-side check. */
export const POSE_CONTRACTED: Pose = { ...POSE_REST, contract: 1 };
export const POSE_FULL: Pose = { scale: 1, cx: FIGURE_CENTRE[0], cy: FIGURE_CENTRE[1], contract: 0 };

/** Where the organs sit for a pose (fitted on the muscle, never below it). */
export function organCentres(pose: Pick<Pose, 'contract' | 'scale'>): { bladder: Pt; rectum: Pt } {
  const half = floorWidthPx(pose.contract) / pose.scale / 2;
  return { bladder: organCentre(BLADDER, pose.contract, half), rectum: organCentre(RECTUM, pose.contract, half) };
}

/** Point on an organ's outline at an angle (degrees, 0 = front, −90 = top), for label lines. */
export function organPoint(o: Organ, centre: Pt, angle: number): Pt {
  const a = (angle * Math.PI) / 180;
  const r = (o.rot * Math.PI) / 180;
  const x = o.rx * Math.cos(a);
  const y = o.ry * Math.sin(a);
  return [centre[0] + x * Math.cos(r) - y * Math.sin(r), centre[1] + x * Math.sin(r) + y * Math.cos(r)];
}

/** Labels on the zoomed view (canvas position of the text; the line runs to its structure). */
export const LABELS = {
  bladder: { at: [212, 380] as Pt, anchor: 'start' as const },
  bowel: { at: [170, 354] as Pt, anchor: 'middle' as const },
  floor: { at: [176, 455] as Pt, anchor: 'middle' as const },
};

/** Areas lit in scene 7 ("do not squeeze these"): front belly wall, buttock, inner thigh. */
export const WRONG = {
  belly: 'M200 318 C214 330 216 362 210 384 C204 386 200 384 199 380 C202 360 200 336 194 322 Z',
  buttock: 'M140 380 C128 392 124 414 132 432 C140 436 150 434 152 428 C146 414 146 396 150 386 Z',
  thigh: 'M212 418 C240 426 268 428 292 428 C294 434 292 438 286 438 C256 438 232 436 210 430 Z',
} as const;
/** Where each cross icon sits (next to its area). */
export const WRONG_MARKS: Record<keyof typeof WRONG, Pt> = { belly: [232, 338], buttock: [106, 402], thigh: [256, 462] };

/** Length of a path made of absolute M, L, C and Z commands (for drawing it on with a stroke dash). */
export function pathLength(d: string): number {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g) ?? [];
  let i = 0;
  let cmd = '';
  let cur: Pt = [0, 0];
  let start: Pt = [0, 0];
  let len = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[MLCZ]/.test(tokens[i]!)) cmd = tokens[i++]!;
    if (cmd === 'M') {
      cur = [num(), num()];
      start = cur;
      cmd = 'L';
    } else if (cmd === 'L') {
      const p: Pt = [num(), num()];
      len += Math.hypot(p[0] - cur[0], p[1] - cur[1]);
      cur = p;
    } else if (cmd === 'C') {
      const a: Pt = [num(), num()];
      const b: Pt = [num(), num()];
      const p: Pt = [num(), num()];
      let prev = cur;
      for (let k = 1; k <= 32; k++) {
        const t = k / 32;
        const u = 1 - t;
        const q: Pt = [u * u * u * cur[0] + 3 * u * u * t * a[0] + 3 * u * t * t * b[0] + t * t * t * p[0], u * u * u * cur[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t * t * t * p[1]];
        len += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
        prev = q;
      }
      cur = p;
    } else if (cmd === 'Z') {
      len += Math.hypot(start[0] - cur[0], start[1] - cur[1]);
      cur = start;
      cmd = '';
    } else i++;
  }
  return len;
}
