import Svg, { Circle, Line, Path } from 'react-native-svg';

import { useTheme } from '@/components';

import type { Posture } from './routines';

/** Minimal original stick-figure placeholders for each posture. */
export function PostureArt({ posture, size = 140 }: { posture: Posture; size?: number }) {
  const t = useTheme();
  const c = t.colors.text;
  const a = t.colors.accent;
  const s = { stroke: c, strokeWidth: 6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const floor = <Line x1={10} y1={130} x2={190} y2={130} stroke={t.colors.border} strokeWidth={4} strokeLinecap="round" />;
  const body = (() => {
    switch (posture) {
      case 'bridge':
        return (
          <>
            <Circle cx={30} cy={118} r={10} fill={c} />
            <Path {...s} d="M42 122 L100 92 L130 100 L150 128" />
            <Path {...s} d="M42 124 L60 128" />
            <Circle cx={100} cy={92} r={7} fill={a} />
          </>
        );
      case 'lying':
        return (
          <>
            <Circle cx={30} cy={118} r={10} fill={c} />
            <Path {...s} d="M42 122 L110 122 L135 95 L155 128" />
            <Circle cx={105} cy={122} r={7} fill={a} />
          </>
        );
      case 'seated':
        return (
          <>
            <Circle cx={100} cy={40} r={11} fill={c} />
            <Path {...s} d="M100 54 L100 110 M100 110 L60 100 L95 126 M100 110 L140 100 L105 126" />
            <Path {...s} d="M100 70 L75 95 M100 70 L125 95" />
            <Circle cx={100} cy={112} r={7} fill={a} />
          </>
        );
      case 'squat':
        return (
          <>
            <Circle cx={110} cy={30} r={11} fill={c} />
            <Path {...s} d="M108 44 L95 88 L130 98 L120 128 M95 88 L70 100 L80 128" />
            <Path {...s} d="M106 58 L145 66" />
            <Circle cx={95} cy={88} r={7} fill={a} />
          </>
        );
      case 'plank':
        return (
          <>
            <Circle cx={40} cy={88} r={10} fill={c} />
            <Path {...s} d="M52 94 L160 118 M60 96 L60 128 L80 128" />
            <Circle cx={105} cy={106} r={7} fill={a} />
          </>
        );
      case 'kneeling':
        return (
          <>
            <Circle cx={45} cy={70} r={10} fill={c} />
            <Path {...s} d="M58 78 L120 84 L120 128 M58 80 L58 128 M58 78 L20 70 M120 84 L175 80" />
            <Circle cx={118} cy={84} r={7} fill={a} />
          </>
        );
      case 'lunge':
        return (
          <>
            <Circle cx={100} cy={30} r={11} fill={c} />
            <Path {...s} d="M100 44 L100 92 L140 96 L140 128 M100 92 L60 128 L30 128" />
            <Circle cx={100} cy={92} r={7} fill={a} />
          </>
        );
      case 'side':
        return (
          <>
            <Circle cx={30} cy={110} r={10} fill={c} />
            <Path {...s} d="M42 116 L110 120 L140 100 L160 124 M110 120 L150 126" />
            <Circle cx={110} cy={120} r={7} fill={a} />
          </>
        );
    }
  })();
  return (
    <Svg width={size * 1.4} height={size} viewBox="0 0 200 140" accessibilityRole="image">
      {floor}
      {body}
    </Svg>
  );
}
