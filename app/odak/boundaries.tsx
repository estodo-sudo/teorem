import type { IconName } from '@/components/Icon';
import { useEffect, useState } from 'react';
import { AppState, Linking, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, Screen, SwitchRow, useTheme } from '@/components';
import { syncReminderTask } from '@/features/camps/odak/boundaries/reminderTask';
import { ODAK_BOUNDARIES as B, ODAK_ONBOARDING as ONB } from '@/features/camps/odak/content';
import { toggleItem } from '@/features/camps/odak/engine/boundaries';
import { toggleRange } from '@/features/camps/odak/onboarding';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { OdakLock, PillGroup } from '@/features/camps/odak/ui';
import { useAccess } from '@/features/purchases/useGate';
import { goBack } from '@/lib/nav';

import { hasUsageAccess, launchableApps, openDigitalWellbeing, openUsageAccessSettings, usageAvailable } from '../../modules/odak-usage';

/**
 * Ortam ve dijital sınırlar (SPEC_ODAK_KAMPI 5.3): physical checklist, the phone's own filter
 * (iOS Screen Time / Android Digital Wellbeing guide) and, on Android, the risky-hour reminder.
 */
export default function OdakBoundaries() {
  const { t: tr } = useTranslation();
  const premium = useAccess()('odak');
  const t = useTheme();
  const { boundaries: b, profile } = useOdakStore();
  const save = (patch: Partial<typeof b>) => void useOdakStore.getState().saveBoundaries({ ...b, ...patch });
  const [access, setAccess] = useState(hasUsageAccess);
  const [apps, setApps] = useState<{ packageName: string; label: string }[]>([]);
  const ranges = profile?.riskyHours ?? [];

  // Coming back from the settings page: re-check the permission.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setAccess(hasUsageAccess()));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (b.reminder.enabled && access) void launchableApps().then(setApps);
  }, [b.reminder.enabled, access]);

  const setReminder = (enabled: boolean) => {
    save({ reminder: { ...b.reminder, enabled } });
    void syncReminderTask(enabled);
  };

  return (
    <Screen>
      <Header title={B.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <AppText muted>{B.intro}</AppText>
      <Card style={{ backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
        <AppText variant="small" weight="700">
          {B.honesty}
        </AppText>
      </Card>

      <AppText variant="h3">{B.checklistTitle}</AppText>
      <View style={{ gap: t.space.sm }}>
        {B.checklist.map((c) => (
          <ChoiceCard key={c.id} multi icon={c.icon as IconName} label={c.label} selected={b.checklist.includes(c.id)} onPress={() => save({ checklist: toggleItem(b.checklist, c.id) })} />
        ))}
      </View>
      <AppText variant="tiny" muted>
        {B.grayscaleHint}
      </AppText>

      {Platform.OS === 'ios' ? (
        <Card style={{ gap: t.space.sm }}>
          <AppText variant="h3">{B.ios.title}</AppText>
          {B.ios.steps.map((s, i) => (
            <AppText key={s} variant="small">
              {i + 1}. {s}
            </AppText>
          ))}
          <AppText variant="tiny" muted>
            {B.ios.note}
          </AppText>
          <ChoiceCard multi label={B.ios.done} selected={b.iosWebFilter} onPress={() => save({ iosWebFilter: !b.iosWebFilter })} />
        </Card>
      ) : (
        <Card style={{ gap: t.space.sm }}>
          <AppText variant="h3">{B.android.title}</AppText>
          {B.android.steps.map((s, i) => (
            <AppText key={s} variant="small">
              {i + 1}. {s}
            </AppText>
          ))}
          <Button
            label={B.android.open}
            icon="gear"
            variant="secondary"
            onPress={() => {
              if (usageAvailable) openDigitalWellbeing();
              else void Linking.sendIntent('android.settings.SETTINGS').catch(() => undefined);
            }}
          />
          <AppText variant="tiny" muted>
            {B.android.note}
          </AppText>
          <ChoiceCard multi label={B.android.done} selected={b.androidWellbeing} onPress={() => save({ androidWellbeing: !b.androidWellbeing })} />
        </Card>
      )}

      {Platform.OS === 'android' ? (
        <Card style={{ gap: 10 }}>
          <AppText variant="h3">{B.reminder.title}</AppText>
          <AppText variant="small">{B.reminder.body}</AppText>
          {!premium ? (
            <OdakLock title={tr('odak.premium.reminder')} />
          ) : !usageAvailable ? (
            <AppText variant="small" muted>
              {B.reminder.unavailable}
            </AppText>
          ) : (
            <>
              <View style={{ backgroundColor: t.tokens.muted, borderRadius: t.radius.md, padding: t.space.md }}>
                <AppText variant="small">{B.reminder.disclosure}</AppText>
              </View>
              <SwitchRow label={B.reminder.enable} value={b.reminder.enabled} onChange={setReminder} />
              {b.reminder.enabled ? (
                <>
                  {!access ? (
                    <>
                      <Button label={B.reminder.grant} onPress={openUsageAccessSettings} />
                      <AppText variant="tiny" muted>
                        {B.reminder.grantHint}
                      </AppText>
                    </>
                  ) : (
                    <>
                      <AppText weight="800">{B.reminder.appsTitle}</AppText>
                      <AppText variant="small" muted>
                        {B.reminder.appsHint}
                      </AppText>
                      <PillGroup items={apps.map((a) => ({ id: a.packageName, label: a.label }))} selected={b.reminder.packages} onToggle={(id) => save({ reminder: { ...b.reminder, packages: toggleItem(b.reminder.packages, id) } })} />
                    </>
                  )}
                  <AppText weight="800">{B.reminder.hoursTitle}</AppText>
                  <PillGroup
                    items={ONB.risky.ranges}
                    selected={ONB.risky.ranges.filter((r) => ranges.some((x) => x.from === r.from && x.to === r.to)).map((r) => r.id)}
                    onToggle={(id) => {
                      const r = ONB.risky.ranges.find((x) => x.id === id)!;
                      void useOdakStore.getState().updateProfile({ riskyHours: toggleRange(ranges, { from: r.from, to: r.to }) });
                    }}
                  />
                  {!ranges.length ? (
                    <AppText variant="small" color={t.colors.danger}>
                      {B.reminder.noHours}
                    </AppText>
                  ) : null}
                  <AppText variant="tiny" muted>
                    {B.reminder.delay}
                  </AppText>
                </>
              ) : null}
            </>
          )}
        </Card>
      ) : null}
    </Screen>
  );
}
