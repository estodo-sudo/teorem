import { useState } from 'react';
import { View } from 'react-native';

import { AppText, useTheme } from '@/components';

import type { HeatCell } from '../stats';

interface Props {
  columns: HeatCell[][];
  dayLabels: string[];
  legend: { none: string; partial: string; done: string; multi: string };
  accessibilityLabel: string;
}

/** Calendar heat map: one hue, light→dark (sequential primary scale: muted · soft · 55 % · full). */
export function HeatMap({ columns, dayLabels, legend, accessibilityLabel }: Props) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const gap = 3;
  const labelW = 18;
  const size = w > 0 ? Math.min(22, (w - labelW - gap * columns.length) / columns.length) : 0;
  const fill = (i: number) => (i === 0 ? t.tokens.muted : i === 1 ? t.tokens.primarySoft : t.tokens.primary);
  const op = [1, 1, 0.55, 1];
  const active = columns.flat().filter((c) => c.intensity >= 2).length;

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={`${accessibilityLabel}: ${active}`}>
      <View style={{ flexDirection: 'row', gap }}>
        <View style={{ width: labelW, gap }}>
          {dayLabels.map((d, i) => (
            <View key={i} style={{ height: size, justifyContent: 'center' }}>
              {i % 2 === 0 ? (
                <AppText variant="caption" muted style={{ fontSize: t.type.caption.fontSize - 3, lineHeight: t.type.caption.lineHeight - 4, fontWeight: '400' }}>
                  {d}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
        {columns.map((col, c) => (
          <View key={c} style={{ gap }}>
            {col.map((cell) => (
              <View key={cell.date} style={{ width: size, height: size, borderRadius: t.radius.sm / 2, backgroundColor: fill(cell.intensity), opacity: op[cell.intensity] }} />
            ))}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: t.space.md, marginTop: t.space.md, flexWrap: 'wrap' }}>
        {([0, 1, 2, 3] as const).map((i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs }}>
            <View style={{ width: 12, height: 12, borderRadius: t.radius.sm / 2, backgroundColor: fill(i), opacity: op[i] }} />
            <AppText variant="caption" muted style={{ fontWeight: '400' }}>
              {[legend.none, legend.partial, legend.done, legend.multi][i]}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
