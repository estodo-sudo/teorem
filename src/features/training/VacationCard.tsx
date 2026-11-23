import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Segmented } from '@/components';
import { addDays, fromDateKey, toDateKey } from '@/lib/date';
import { useTrainingStore } from '@/stores/trainingStore';

import { FREEZES_PER_MONTH, isOnVacation, validVacation, VACATION_MAX_DAYS, VACATION_MIN_DAYS } from './schedule';
import { localeOf } from '@/i18n/languages';

const LENGTHS = [3, 7, 10, 14] as const;

/**
 * Streak freezes and vacation mode (SPEC_KEGEL_V2 §6.6): 2 freezes a month cover single missed days
 * automatically; vacation (3–14 days) keeps the streak and silences reminders.
 */
export function VacationCard() {
  const { t: tr, i18n } = useTranslation();
  const training = useTrainingStore((s) => s.training);
  const today = toDateKey();
  const [startTomorrow, setStartTomorrow] = useState(false);
  const [len, setLen] = useState<(typeof LENGTHS)[number]>(7);
  const v = training.vacation;
  const active = v && v.to >= today ? v : null;
  const fmt = (d: string) => fromDateKey(d).toLocaleDateString(localeOf(i18n.language), { day: 'numeric', month: 'long' });

  const start = () => {
    const from = startTomorrow ? addDays(today, 1) : today;
    const to = addDays(from, len - 1);
    if (validVacation(from, to, today)) useTrainingStore.getState().update({ vacation: { from, to } });
  };

  return (
    <Card style={{ gap: 10 }}>
      <AppText variant="h3">{tr('kegel.vacation.title')}</AppText>
      <AppText variant="small" muted>
        {tr('kegel.vacation.freezes', { left: training.freezeTokens, total: FREEZES_PER_MONTH })}
      </AppText>
      {active ? (
        <>
          <AppText weight="700">{isOnVacation(today, active) ? tr('kegel.vacation.onNow', { to: fmt(active.to) }) : tr('kegel.vacation.planned', { from: fmt(active.from), to: fmt(active.to) })}</AppText>
          <Button label={tr('kegel.vacation.end')} variant="secondary" onPress={() => useTrainingStore.getState().update({ vacation: undefined })} />
        </>
      ) : (
        <>
          <AppText variant="small" muted>
            {tr('kegel.vacation.hint', { min: VACATION_MIN_DAYS, max: VACATION_MAX_DAYS })}
          </AppText>
          <View style={{ gap: 8 }}>
            <Segmented<number> accessibilityLabel={tr('kegel.vacation.length')} value={len} onChange={(x) => setLen(x as (typeof LENGTHS)[number])} options={LENGTHS.map((d) => ({ value: d, label: tr('kegel.vacation.days', { count: d }) }))} />
            <Segmented<number>
              accessibilityLabel={tr('kegel.vacation.startLabel')}
              value={startTomorrow ? 1 : 0}
              onChange={(x) => setStartTomorrow(x === 1)}
              options={[
                { value: 0, label: tr('kegel.vacation.today') },
                { value: 1, label: tr('kegel.vacation.tomorrow') },
              ]}
            />
          </View>
          <Button label={tr('kegel.vacation.start')} variant="secondary" icon="calendar" onPress={start} />
        </>
      )}
    </Card>
  );
}
