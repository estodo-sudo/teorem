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

/** Calendar heat map: one hue, light→dark (sequential). */
export function HeatMap({ columns, dayLabels, legend, accessibilityLabel }: Props) {
  const t = useTheme();
  const [w, setW] = useState(0);
  const gap = 3;
  const labelW = 18;
  const size = w > 0 ? Math.min(22, (w - labelW - gap * columns.length) / columns.length) : 0;
  const fill = (i: number) => (i === 0 ? t.colors.surfaceAlt : t.colors.accent);
  const op = [1, 0.35, 0.7, 1];
  const active = columns.flat().filter((c) => c.intensity >= 2).length;

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={`${accessibilityLabel}: ${active}`}>
      <View style={{ flexDirection: 'row', gap }}>
        <View style={{ width: labelW, gap }}>
          {dayLabels.map((d, i) => (
            <View key={i} style={{ height: size, justifyContent: 'center' }}>
              {i % 2 === 0 ? (
                <AppText variant="tiny" muted style={{ fontSize: 9, lineHeight: 11 }}>
                  {d}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
        {columns.map((col, c) => (
          <View key={c} style={{ gap }}>
            {col.map((cell) => (
              <View key={cell.date} style={{ width: size, height: size, borderRadius: 4, backgroundColor: fill(cell.intensity), opacity: op[cell.intensity] }} />
            ))}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        {([0, 1, 2, 3] as const).map((i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: fill(i), opacity: op[i] }} />
            <AppText variant="tiny" muted>
              {[legend.none, legend.partial, legend.done, legend.multi][i]}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
