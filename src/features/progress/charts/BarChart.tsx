import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/components';

import { niceMax } from './LineChart';

interface Props {
  data: { label: string; value: number }[];
  height?: number;
  unit?: string;
  accessibilityLabel: string;
}

/** Single-series bars: 4px rounded data-end, square baseline, 2px gaps, tap-to-inspect. */
export function BarChart({ data, height = 160, unit = '', accessibilityLabel }: Props) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const padL = 32;
  const padT = 20;
  const padB = 22;
  const max = Math.max(...data.map((d) => d.value), 1);
  const yMax = niceMax(max);
  const plotW = Math.max(1, w - padL);
  const plotH = height - padT - padB;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.max(6, Math.min(28, slot * 0.6));
  const y = (v: number) => padT + plotH - (v / yMax) * plotH;
  const shown = sel ?? data.length - 1;
  const summary = `${accessibilityLabel}: ${data.map((d) => `${d.label} ${d.value}${unit}`).join(', ')}`;

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={summary}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          {[0, 0.5, 1].map((f) => (
            <Line key={f} x1={padL} x2={w} y1={y(yMax * f)} y2={y(yMax * f)} stroke={t.colors.border} strokeWidth={1} />
          ))}
          {[0, yMax / 2, yMax].map((v) => (
            <SvgText key={v} x={padL - 6} y={y(v) + 4} fontSize={10} fill={t.colors.textMuted} textAnchor="end">
              {Number.isInteger(v) ? v : v.toFixed(1)}
            </SvgText>
          ))}
          {data.map((d, i) => {
            const cx = padL + slot * i + slot / 2;
            const top = y(d.value);
            const h = Math.max(0, padT + plotH - top);
            const r = Math.min(4, h, barW / 2);
            const x0 = cx - barW / 2;
            const x1 = cx + barW / 2;
            const base = padT + plotH;
            const path = h > 0 ? `M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x1 - r} Q${x1},${top} ${x1},${top + r} V${base} Z` : '';
            return path ? <Path key={i} d={path} fill={t.colors.accent} opacity={i === shown ? 1 : 0.55} /> : null;
          })}
          {data.map((d, i) =>
            i === 0 || i === data.length - 1 ? (
              <SvgText key={`l${i}`} x={padL + slot * i + slot / 2} y={height - 6} fontSize={10} fill={t.colors.textMuted} textAnchor="middle">
                {d.label}
              </SvgText>
            ) : null,
          )}
          {data[shown] ? (
            <SvgText
              x={Math.min(Math.max(padL + slot * shown + slot / 2, padL + 20), w - 20)}
              y={Math.max(12, y(data[shown]!.value) - 6)}
              fontSize={12}
              fontWeight="700"
              fill={t.colors.text}
              textAnchor="middle"
            >
              {`${data[shown]!.value}${unit}`}
            </SvgText>
          ) : null}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      <View style={{ position: 'absolute', left: padL, right: 0, top: 0, bottom: 0, flexDirection: 'row' }}>
        {data.map((d, i) => (
          <Pressable key={i} style={{ flex: 1 }} onPress={() => setSel(i)} accessibilityLabel={`${d.label}: ${d.value}${unit}`} />
        ))}
      </View>
    </View>
  );
}
