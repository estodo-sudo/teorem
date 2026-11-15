import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, useTheme } from '@/components';
import { PLAN_LENGTH_DAYS } from '@/config/app';

interface Props {
  /** Number of finished days in the current plan. */
  completedDays: number;
  /** 0-based index of today's day. */
  todayIndex: number;
}

/** 30-day plan grid; finished days are checked, today is highlighted. */
export function PlanGrid({ completedDays, todayIndex }: Props) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [w, setW] = useState(0);
  const size = w > 0 ? Math.min(52, Math.floor((w - GAP * (COLS - 1)) / COLS)) : 0;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={styles.grid} accessibilityLabel={tr('training.planA11y', { done: completedDays, total: PLAN_LENGTH_DAYS })}>
      {Array.from({ length: PLAN_LENGTH_DAYS }).map((_, i) => {
        const done = i < completedDays;
        const today = i === todayIndex && !done;
        return (
          <View
            key={i}
            accessible
            accessibilityLabel={tr(done ? 'training.dayDone' : today ? 'training.dayToday' : 'training.dayTodo', { day: i + 1 })}
            style={[
              styles.cell,
              {
                width: size,
                height: size,
                backgroundColor: done ? t.colors.accent : t.colors.surfaceAlt,
                borderColor: today ? t.colors.accent : 'transparent',
                borderRadius: t.radius.sm,
              },
            ]}
          >
            {done ? (
              <Icon name="check" color={t.colors.accentText} size={16} strokeWidth={3} />
            ) : (
              <AppText variant="tiny" weight={today ? '800' : '500'} muted={!today}>
                {i + 1}
              </AppText>
            )}
          </View>
        );
      })}
    </View>
  );
}

const COLS = 7;
const GAP = 6;

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
