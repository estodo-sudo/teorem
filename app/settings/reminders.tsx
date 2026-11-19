import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Icon, Screen, SwitchRow, TimeStepper, useTheme } from '@/components';
import { hasNotificationPermission, requestNotificationPermission } from '@/features/reminders/permissions';
import { MAX_REMINDER_TIMES, REMINDER_PRESETS } from '@/features/reminders/plan';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Reminders v2 (SPEC_KEGEL_V2 §13): 1–4 times in any order (sorted automatically — never an error),
 * habit-anchor presets, neutral texts. Reminders go quiet once today's target is reached and during
 * vacation mode.
 */
export default function ReminderSettings() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    void hasNotificationPermission().then(setGranted);
  }, []);

  const times = settings.reminderTimes;
  const save = (next: string[]) => update({ reminderTimes: Array.from(new Set(next)).sort() });
  // Editing a time keeps the card in place; the order is fixed when times are added or removed (and always when scheduling).
  const setTime = (i: number, v: string) => update({ reminderTimes: times.map((x, k) => (k === i ? v : x)) });
  const togglePreset = (time: string) => (times.includes(time) ? (times.length > 1 ? save(times.filter((x) => x !== time)) : undefined) : times.length < MAX_REMINDER_TIMES ? save([...times, time]) : undefined);

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
          <AppText variant="h3">{tr('settings.reminders.presetsTitle')}</AppText>
          <AppText variant="small" muted>
            {tr('settings.reminders.presetsHint')}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {REMINDER_PRESETS.map((p) => {
              const on = times.includes(p.time);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => togglePreset(p.time)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${tr(`settings.reminders.preset.${p.id}`)} ${p.time}`}
                  style={({ pressed }) => ({
                    minHeight: 48,
                    paddingHorizontal: 14,
                    justifyContent: 'center',
                    borderRadius: 24,
                    borderWidth: 2,
                    borderColor: on ? t.colors.accent : t.colors.border,
                    backgroundColor: on ? t.colors.surfaceAlt : t.colors.surface,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <AppText weight="700">
                    {tr(`settings.reminders.preset.${p.id}`)} · {p.time}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <AppText variant="h3">{tr('settings.reminders.times')}</AppText>
          {times.map((time, i) => (
            <Card key={i} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText weight="700">{tr('settings.reminders.timeN', { n: i + 1 })}</AppText>
                {times.length > 1 ? (
                  <Pressable
                    onPress={() => save(times.filter((_, k) => k !== i))}
                    accessibilityRole="button"
                    accessibilityLabel={tr('settings.reminders.remove', { n: i + 1 })}
                    hitSlop={10}
                    style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name="trash" color={t.colors.textMuted} size={20} />
                  </Pressable>
                ) : null}
              </View>
              <TimeStepper value={time} onChange={(v) => setTime(i, v)} />
            </Card>
          ))}
          {times.length < MAX_REMINDER_TIMES ? <Button label={tr('settings.reminders.add')} variant="secondary" icon="plus" onPress={() => save([...times, ['12:00', '15:00', '18:00', '21:00'].find((x) => !times.includes(x)) ?? '12:30'])} /> : null}
          <AppText variant="small" muted>
            {tr('settings.reminders.hint')}
          </AppText>
        </>
      ) : null}
    </Screen>
  );
}
