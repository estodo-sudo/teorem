import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Icon, Screen, SwitchRow, TimeStepper, useTheme } from '@/components';
import { hasNotificationPermission, requestNotificationPermission } from '@/features/reminders/permissions';
import { useSettingsStore } from '@/stores/settingsStore';

const MAX_TIMES = 3;

export default function ReminderSettings() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    void hasNotificationPermission().then(setGranted);
  }, []);

  const setTime = (i: number, v: string) => update({ reminderTimes: settings.reminderTimes.map((x, k) => (k === i ? v : x)) });

  return (
    <Screen>
      <Header title={tr('settings.reminders.title')} />
      {granted === false ? (
        <Card style={{ gap: 8, borderColor: t.colors.warning }}>
          <AppText weight="700">{tr('settings.reminders.noPermission')}</AppText>
          <Button label={tr('settings.reminders.allow')} variant="secondary" onPress={() => void requestNotificationPermission().then(setGranted)} />
        </Card>
      ) : null}
      <Card style={{ paddingVertical: 4 }}>
        <SwitchRow label={tr('settings.reminders.enabled')} value={settings.remindersEnabled} onChange={(v) => update({ remindersEnabled: v })} />
        <SwitchRow label={tr('settings.reminders.discreet')} description={tr('settings.reminders.discreetHint')} value={settings.discreetNotifications} onChange={(v) => update({ discreetNotifications: v })} />
        <SwitchRow label={tr('settings.reminders.weekly')} description={tr('settings.reminders.weeklyHint')} value={settings.weeklyTestReminder} onChange={(v) => update({ weeklyTestReminder: v })} />
      </Card>
      {settings.remindersEnabled ? (
        <>
          <AppText variant="h3">{tr('settings.reminders.times')}</AppText>
          {settings.reminderTimes.map((time, i) => (
            <Card key={i} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText weight="700">{tr('settings.reminders.timeN', { n: i + 1 })}</AppText>
                {settings.reminderTimes.length > 1 ? (
                  <Pressable
                    onPress={() => update({ reminderTimes: settings.reminderTimes.filter((_, k) => k !== i) })}
                    accessibilityRole="button"
                    accessibilityLabel={tr('settings.reminders.remove', { n: i + 1 })}
                    hitSlop={10}
                    style={{ padding: 6 }}
                  >
                    <Icon name="trash" color={t.colors.textMuted} size={20} />
                  </Pressable>
                ) : null}
              </View>
              <TimeStepper value={time} onChange={(v) => setTime(i, v)} />
            </Card>
          ))}
          {settings.reminderTimes.length < MAX_TIMES ? (
            <Button label={tr('settings.reminders.add')} variant="secondary" icon="plus" onPress={() => update({ reminderTimes: [...settings.reminderTimes, '12:00'] })} />
          ) : null}
          <AppText variant="small" muted>
            {tr('settings.reminders.hint')}
          </AppText>
        </>
      ) : null}
    </Screen>
  );
}
