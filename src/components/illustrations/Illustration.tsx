import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import type { ModuleTone } from '@/config/theme';
import { useTheme } from '../useTheme';
import shapes from './shapes.json';

type Role = 'fg' | 'soft' | 'line' | null;
type Shape =
  | { t: 'c'; x: number; y: number; r: number; fill: Role; stroke: Role; w: number }
  | { t: 'l'; x1: number; y1: number; x2: number; y2: number; stroke: Role; w: number }
  | { t: 'p'; d: string; fill: Role; stroke: Role; w: number };

const DATA = shapes as unknown as Record<string, { tone: ModuleTone; shapes: Shape[] }>;
export type IllustrationName = keyof typeof shapes;
export const ILLUSTRATION_NAMES = Object.keys(shapes) as IllustrationName[];

/**
 * Geometric placeholder illustrations (SPEC_UI_V3 §4.2): two-tone line drawings in the module tone,
 * drawn from `shapes.json` with theme colours (works in light and dark). See ILLUSTRATIONS.md.
 */
export function Illustration({ name, size = 160, tone }: { name: IllustrationName; size?: number; tone?: ModuleTone }) {
  const t = useTheme();
  const item = DATA[name]!;
  const c = t.tone[tone ?? item.tone];
  const color = (r: Role) => (r === 'fg' ? c.fg : r === 'soft' ? c.soft : r === 'line' ? t.tokens.subtle : 'none');
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
        {item.shapes.map((s, i) =>
          s.t === 'c' ? (
            <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={color(s.fill)} stroke={color(s.stroke)} strokeWidth={s.w} />
          ) : s.t === 'l' ? (
            <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={color(s.stroke)} strokeWidth={s.w} strokeLinecap="round" />
          ) : (
            <Path key={i} d={s.d} fill={color(s.fill)} stroke={color(s.stroke)} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" />
          ),
        )}
      </Svg>
    </View>
  );
}
