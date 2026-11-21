/**
 * Geometry and rules of the urge gauge (SPEC_V4 §C.1), kept free of React Native so it can be tested:
 * a 180° arc of 10 segments, 14 px thick, with a visible 4 px gap between the rounded segment ends.
 */
export const GAUGE = { width: 280, stroke: 14, gap: 4, segments: 10 } as const;

export type UrgeWord = 'low' | 'mid' | 'strong' | 'veryStrong';

export interface GaugeGeometry {
  cx: number;
  cy: number;
  r: number;
  /** Angular size of one segment and of one gap (radians, round caps included in the gap). */
  seg: number;
  gapAngle: number;
  height: number;
}

export function gaugeGeometry(width: number = GAUGE.width): GaugeGeometry {
  const { stroke, gap, segments } = GAUGE;
  const r = (width - stroke) / 2 - 2;
  // Round caps reach stroke/2 past each end, so the visible gap needs gap + stroke of arc between ends.
  const gapAngle = (gap + stroke) / r;
  const seg = (Math.PI - gapAngle * (segments - 1)) / segments;
  const cy = r + stroke / 2 + 4;
  return { cx: width / 2, cy, r, seg, gapAngle, height: cy + stroke / 2 + 4 };
}

/** Start and end angle of segment i (0 = leftmost), counter-clockwise from the +x axis. */
export function segmentAngles(i: number, g: GaugeGeometry): [number, number] {
  const start = Math.PI - i * (g.seg + g.gapAngle);
  return [start, start - g.seg];
}

/** SVG arc path of segment i, drawn left to right over the top. */
export function segmentPath(i: number, g: GaugeGeometry): string {
  const [a, b] = segmentAngles(i, g);
  const p = (t: number) => `${(g.cx + g.r * Math.cos(t)).toFixed(2)} ${(g.cy - g.r * Math.sin(t)).toFixed(2)}`;
  return `M ${p(a)} A ${g.r.toFixed(2)} ${g.r.toFixed(2)} 0 0 1 ${p(b)}`;
}

/** Needle angle in degrees (180 = left end, 0 = right end): the middle of the chosen segment. */
export function needleDegrees(value: number | null, g: GaugeGeometry): number {
  if (value === null) return 180;
  const [a] = segmentAngles(clampUrge(value) - 1, g);
  return ((a - g.seg / 2) * 180) / Math.PI;
}

export const clampUrge = (v: number): number => Math.min(10, Math.max(1, Math.round(v)));

/**
 * Value under a touch at (x, y) in the gauge's own coordinates: the angle around the pivot, split
 * into 10 equal parts. Touches below the pivot snap to the nearer end.
 */
export function valueFromPoint(x: number, y: number, g: GaugeGeometry): number {
  const dx = x - g.cx;
  const dy = g.cy - y;
  let theta = Math.atan2(dy, dx);
  if (dy < 0) theta = dx < 0 ? Math.PI : 0;
  const share = (Math.PI - theta) / Math.PI;
  return clampUrge(Math.floor(share * GAUGE.segments) + 1);
}

/** True when a touch starts on or near the arc (so the page can still scroll elsewhere). */
export function onArc(x: number, y: number, g: GaugeGeometry): boolean {
  const d = Math.hypot(x - g.cx, y - g.cy);
  return d >= g.r - 48 && d <= g.r + 28 && y <= g.cy + 20;
}

export function urgeWord(v: number): UrgeWord {
  if (v <= 3) return 'low';
  if (v <= 6) return 'mid';
  if (v <= 8) return 'strong';
  return 'veryStrong';
}

/** Screen reader swipe up / down: from "not chosen" the first step is 1; always within 1–10. */
export function stepUrge(v: number | null, dir: 1 | -1): number {
  if (v === null) return 1;
  return clampUrge(v + dir);
}

/** Colour band of a segment value (1–3 light, 4–6 main, 7–8 between main and amber, 9–10 amber). */
export function segmentBand(v: number): 'light' | 'main' | 'mix' | 'amber' {
  if (v <= 3) return 'light';
  if (v <= 6) return 'main';
  if (v <= 8) return 'mix';
  return 'amber';
}

/** Mixes two #RRGGBB colours (t = 0 → a, 1 → b). */
export function mixHex(a: string, b: string, t: number): string {
  const n = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return `#${x.map((c, i) => Math.round(c + (y[i]! - c) * t).toString(16).padStart(2, '0')).join('')}`;
}
