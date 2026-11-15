import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Small original line-icon set (24×24 grid, stroke based). */
export type IconName =
  | 'home'
  | 'pulse'
  | 'chart'
  | 'compass'
  | 'user'
  | 'flame'
  | 'trophy'
  | 'play'
  | 'pause'
  | 'skip'
  | 'stop'
  | 'check'
  | 'close'
  | 'back'
  | 'chevron'
  | 'help'
  | 'lock'
  | 'wind'
  | 'leaf'
  | 'book'
  | 'star'
  | 'starFilled'
  | 'bell'
  | 'gear'
  | 'shield'
  | 'plus'
  | 'trash'
  | 'calendar'
  | 'body'
  | 'sparkle';

interface Props {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color, strokeWidth = 2 }: Props) {
  const p = {
    stroke: color,
    strokeWidth,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderIcon(name, p, color)}
    </Svg>
  );
}

type StrokeProps = {
  stroke: string;
  strokeWidth: number;
  fill: string;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
};

function renderIcon(name: IconName, p: StrokeProps, color: string) {
  switch (name) {
    case 'home':
      return <Path {...p} d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />;
    case 'pulse':
      return <Path {...p} d="M2 12h4l3-7 4 14 3-7h6" />;
    case 'chart':
      return <Path {...p} d="M4 20V10M10 20V4M16 20v-7M22 20H2" />;
    case 'compass':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={9} />
          <Path {...p} d="M15.5 8.5l-2 5-5 2 2-5z" />
        </>
      );
    case 'user':
      return (
        <>
          <Circle {...p} cx={12} cy={8} r={4} />
          <Path {...p} d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
        </>
      );
    case 'flame':
      return (
        <Path
          {...p}
          d="M12 22c4 0 7-2.8 7-7 0-3.5-2.4-6-4-8 0 2.5-1.3 4-3 4 .5-3-1-6-4-9 .3 3-3 6.2-3 11 0 4.4 3 9 7 9z"
        />
      );
    case 'trophy':
      return (
        <Path
          {...p}
          d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6v4H9z"
        />
      );
    case 'play':
      return <Path {...p} fill={color} d="M7 4l13 8-13 8z" />;
    case 'pause':
      return (
        <>
          <Rect {...p} fill={color} x={6} y={4} width={4} height={16} rx={1} />
          <Rect {...p} fill={color} x={14} y={4} width={4} height={16} rx={1} />
        </>
      );
    case 'skip':
      return <Path {...p} d="M5 5l10 7-10 7zM19 5v14" />;
    case 'stop':
      return <Rect {...p} x={5} y={5} width={14} height={14} rx={2} />;
    case 'check':
      return <Path {...p} d="M4 12.5l5 5L20 6.5" />;
    case 'close':
      return <Path {...p} d="M6 6l12 12M18 6L6 18" />;
    case 'back':
      return <Path {...p} d="M15 5l-7 7 7 7" />;
    case 'chevron':
      return <Path {...p} d="M9 5l7 7-7 7" />;
    case 'help':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={9} />
          <Path {...p} d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01" />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect {...p} x={5} y={11} width={14} height={10} rx={2} />
          <Path {...p} d="M8 11V8a4 4 0 0 1 8 0v3" />
        </>
      );
    case 'wind':
      return <Path {...p} d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7" />;
    case 'leaf':
      return <Path {...p} d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15zM5 19l7-7" />;
    case 'book':
      return <Path {...p} d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7" />;
    case 'star':
      return <Path {...p} d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />;
    case 'starFilled':
      return (
        <Path
          {...p}
          fill={color}
          d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"
        />
      );
    case 'bell':
      return <Path {...p} d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />;
    case 'gear':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={3} />
          <Path
            {...p}
            d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"
          />
        </>
      );
    case 'shield':
      return <Path {...p} d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />;
    case 'plus':
      return <Path {...p} d="M12 5v14M5 12h14" />;
    case 'trash':
      return <Path {...p} d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" />;
    case 'calendar':
      return (
        <>
          <Rect {...p} x={3} y={5} width={18} height={16} rx={2} />
          <Path {...p} d="M3 10h18M8 3v4M16 3v4" />
        </>
      );
    case 'body':
      return (
        <>
          <Circle {...p} cx={12} cy={4.5} r={2} />
          <Path {...p} d="M5 9h14M12 9v6M12 15l-4 6M12 15l4 6" />
        </>
      );
    case 'sparkle':
      return <Path {...p} d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" />;
  }
}
