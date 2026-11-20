import { View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';

import { AppText, Icon, useTheme, type IconName } from '@/components';
import type { ModuleTone } from '@/config/theme';

/** Points of a pointy-top hexagon centred in a `size` box. */
function hexPoints(size: number, inset: number): string {
  const c = size / 2;
  const r = c - inset;
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

/**
 * Medallion (SPEC_UI_V3 §4.3) — replaces emoji trophies. A hexagon frame with a Lucide icon and a
 * ribbon with the number (7, 30, 100…).
 *  - Earned: module-tone fill and a thin amber ring.
 *  - Locked: an empty frame with a progress ring, so it never looks dead or grey.
 */
export function Medallion({ icon, earned, progress, ribbon, tone = 'kegel', size = 88 }: { icon: IconName; earned: boolean; progress: number; ribbon?: string; tone?: ModuleTone; size?: number }) {
  const t = useTheme();
  const k = t.tokens;
  const c = t.tone[tone];
  const stroke = 3;
  const ringR = size / 2 - stroke / 2;
  const circ = 2 * Math.PI * ringR;
  const p = Math.min(1, Math.max(0, progress));
  const ribbonH = 20;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size + ribbonH / 2, alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
          {earned ? (
            <Circle cx={size / 2} cy={size / 2} r={ringR} stroke={k.highlight} strokeWidth={t.border.thick} fill="none" />
          ) : (
            <>
              <Circle cx={size / 2} cy={size / 2} r={ringR} stroke={k.muted} strokeWidth={stroke} fill="none" />
              {p > 0 ? (
                <Circle cx={size / 2} cy={size / 2} r={ringR} stroke={c.fg} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ * p} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
              ) : null}
            </>
          )}
          <Polygon points={hexPoints(size, t.space.md)} fill={earned ? c.fg : k.card} stroke={earned ? c.fg : k.border} strokeWidth={t.border.thick} strokeLinejoin="round" />
        </Svg>
        {/* Absolutely positioned so it paints above the SVG frame on every platform. */}
        <View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={Math.round(size * 0.3)} color={earned ? k.primaryForeground : c.fg} />
        </View>
      </View>
      {ribbon ? (
        <View style={{ position: 'absolute', bottom: 0, minWidth: 32, height: ribbonH, paddingHorizontal: t.space.sm, borderRadius: t.radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: earned ? k.highlightSoft : k.muted, borderWidth: t.border.thin, borderColor: earned ? k.highlight : k.border }}>
          <AppText variant="caption" tabular style={{ fontWeight: '600' }}>
            {ribbon}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
