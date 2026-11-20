import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Theme } from '@/config/theme';
import { formatTime, parseTime } from '@/lib/date';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { useTheme } from './useTheme';

interface Props {
  value: string; // HH:MM
  onChange: (v: string) => void;
  minuteStep?: number;
}

/** Large, accessible hour/minute picker (no native picker dependency). */
export function TimeStepper({ value, onChange, minuteStep = 15 }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { hour, minute } = parseTime(value);
  const setH = (d: number) => onChange(formatTime((hour + d + 24) % 24, minute));
  const setM = (d: number) => {
    let m = minute + d * minuteStep;
    let h = hour;
    if (m >= 60) {
      m -= 60;
      h = (h + 1) % 24;
    } else if (m < 0) {
      m += 60;
      h = (h + 23) % 24;
    }
    onChange(formatTime(h, Math.round(m / minuteStep) * minuteStep % 60));
  };
  return (
    <View style={styles.row}>
      <Col t={t} v={hour} onUp={() => setH(1)} onDown={() => setH(-1)} label={tr('time.hour')} />
      <AppText variant="display">:</AppText>
      <Col t={t} v={minute} onUp={() => setM(1)} onDown={() => setM(-1)} label={tr('time.minute')} />
    </View>
  );
}

function Col({ t, v, onUp, onDown, label }: { t: Theme; v: number; onUp: () => void; onDown: () => void; label: string }) {
  return (
    <View style={styles.col} accessible accessibilityRole="adjustable" accessibilityLabel={label}
      accessibilityValue={{ text: String(v).padStart(2, '0') }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'increment' ? onUp() : onDown())}
    >
      <Pressable onPress={onUp} style={[styles.btn, { backgroundColor: t.colors.surfaceAlt }]} accessibilityLabel={`${label} +`}>
        <Icon name="plus" color={t.colors.text} />
      </Pressable>
      <AppText variant="display" style={{ marginVertical: t.space.sm }}>
        {String(v).padStart(2, '0')}
      </AppText>
      <Pressable onPress={onDown} style={[styles.btn, { backgroundColor: t.colors.surfaceAlt }]} accessibilityLabel={`${label} −`}>
        <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 14, height: 2, backgroundColor: t.colors.text, borderRadius: 1 }} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  col: { alignItems: 'center' },
  btn: { width: 64, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
