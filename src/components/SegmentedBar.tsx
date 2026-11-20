import { useTheme } from './useTheme';
import { StyleSheet, View } from 'react-native';

interface Props {
  count: number;
  index: number;
  /** Progress of the active segment 0..1. */
  progress: number;
  color?: string;
}

/** Story-style segmented progress (one segment per slide). */
export function SegmentedBar({ count, index, progress, color }: Props) {
  const t = useTheme();
  const fg = color ?? t.focus.text;
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: count, now: index + 1 }}>
      {Array.from({ length: count }).map((_, i) => {
        const fill = i < index ? 1 : i === index ? Math.min(1, Math.max(0, progress)) : 0;
        return (
          <View key={i} style={[styles.seg, { backgroundColor: t.veil.bold }]}>
            <View style={{ width: `${fill * 100}%`, height: '100%', backgroundColor: fg }} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
});
