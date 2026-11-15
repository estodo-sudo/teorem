import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { AppText, useTheme } from '@/components';

interface Point {
  label: string;
  value: number;
}

interface Props {
  data: Point[];
  height?: number;
  unit?: string;
  accessibilityLabel: string;
  emptyText: string;
}

/** Single-series line chart: 2px line, 8px markers, recessive grid, tap-to-inspect. */
export function LineChart({ data, height = 160, unit = '', accessibilityLabel, emptyText }: Props) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const padL = 32;
  const padR = 12;
  const padT = 20;
  const padB = 22;
  if (data.length === 0) {
    return (
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <AppText muted center>
          {emptyText}
        </AppText>
      </View>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const yMax = niceMax(max);
  const plotW = Math.max(1, w - padL - padR);
  const plotH = height - padT - padB;
  const x = (i: number) => padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => padT + plotH - (v / yMax) * plotH;
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.value)}`).join(' ');
  const shown = sel ?? data.length - 1;
  const summary = `${accessibilityLabel}: ${data.map((d) => `${d.label} ${d.value}${unit}`).join(', ')}`;

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={summary}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          {[0, 0.5, 1].map((f) => (
            <Line key={f} x1={padL} x2={w - padR} y1={y(yMax * f)} y2={y(yMax * f)} stroke={t.colors.border} strokeWidth={1} />
          ))}
          {[0, yMax / 2, yMax].map((v) => (
            <SvgText key={v} x={padL - 6} y={y(v) + 4} fontSize={10} fill={t.colors.textMuted} textAnchor="end">
              {fmt(v)}
            </SvgText>
          ))}
          <Path d={path} stroke={t.colors.accent} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) => (
            <Circle key={i} cx={x(i)} cy={y(d.value)} r={i === shown ? 6 : 4} fill={t.colors.accent} stroke={t.colors.surface} strokeWidth={2} />
          ))}
          <SvgText x={x(0)} y={height - 6} fontSize={10} fill={t.colors.textMuted} textAnchor="start">
            {data[0]!.label}
          </SvgText>
          {data.length > 1 ? (
            <SvgText x={x(data.length - 1)} y={height - 6} fontSize={10} fill={t.colors.textMuted} textAnchor="end">
              {data[data.length - 1]!.label}
            </SvgText>
          ) : null}
          <SvgText
            x={Math.min(Math.max(x(shown), padL + 24), w - padR - 24)}
            y={Math.max(12, y(data[shown]!.value) - 12)}
            fontSize={12}
            fontWeight="700"
            fill={t.colors.text}
            textAnchor="middle"
          >
            {`${fmt(data[shown]!.value)}${unit}`}
          </SvgText>
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      {/* Hit targets wider than the marks */}
      <View style={{ position: 'absolute', left: padL, right: padR, top: 0, bottom: 0, flexDirection: 'row' }}>
        {data.map((d, i) => (
          <Pressable key={i} style={{ flex: 1 }} onPress={() => setSel(i)} accessibilityLabel={`${d.label}: ${d.value}${unit}`} />
        ))}
      </View>
    </View>
  );
}

export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * mag;
}

function fmt(v: number) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
