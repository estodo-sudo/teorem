import type { IconName } from '@/components/Icon';
import { router, type Href } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, Screen, useTheme } from '@/components';
import { ODAK_ONBOARDING as ONB, ODAK_REBUILD as R } from '@/features/camps/odak/content';
import { toggleItem } from '@/features/camps/odak/engine/boundaries';
import { connectionDone, connectionTask, rangeKey, toggleActivity, weekKeyOf } from '@/features/camps/odak/engine/rebuild';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { PillGroup } from '@/features/camps/odak/ui';
import { goBack } from '@/lib/nav';

/** Yeniden İnşa (SPEC_ODAK_KAMPI 5.8): alternatives for risky hours, sleep hygiene, weekly connection, app tools. */
export default function OdakRebuild() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { rebuild: r, profile } = useOdakStore();
  const now = new Date();
  const save = (patch: Partial<typeof r>) => void useOdakStore.getState().saveRebuild({ ...r, ...patch });
  const ranges = profile?.riskyHours ?? [];
  const label = (from: string, to: string) => ONB.risky.ranges.find((x) => x.from === from && x.to === to)?.label ?? `${from}–${to}`;
  const done = connectionDone(r, now);

  return (
    <Screen>
      <Header title={R.title} onBack={() => goBack('/odak')} right={<QuickExitButton />} />
      <AppText muted>{R.intro}</AppText>

      <AppText variant="h3">{R.planner.title}</AppText>
      {ranges.length ? (
        <>
          <AppText variant="small" muted>
            {R.planner.hint}
          </AppText>
          {ranges.map((range) => {
            const k = rangeKey(range);
            return (
              <Card key={k} style={{ gap: t.space.sm }}>
                <AppText weight="800">{label(range.from, range.to)}</AppText>
                <PillGroup items={R.planner.options as { id: string; icon?: IconName; label: string }[]} selected={r.activities[k] ?? []} onToggle={(id) => save({ activities: toggleActivity(r.activities, k, id, R.planner.max) })} />
              </Card>
            );
          })}
        </>
      ) : (
        <Card style={{ gap: t.space.sm }}>
          <AppText variant="small">{R.planner.empty}</AppText>
          <Button label={tr('odak.panel.boundaries')} variant="secondary" onPress={() => router.push('/odak/boundaries')} />
        </Card>
      )}

      <AppText variant="h3" style={{ marginTop: 6 }}>
        {R.sleep.title}
      </AppText>
      <View style={{ gap: t.space.sm }}>
        {R.sleep.items.map((it) => (
          <ChoiceCard key={it.id} multi label={it.label} selected={r.sleep.includes(it.id)} onPress={() => save({ sleep: toggleItem(r.sleep, it.id) })} />
        ))}
      </View>
      <AppText variant="tiny" muted>
        {R.sleep.note}
      </AppText>

      <Card style={{ gap: t.space.sm, backgroundColor: t.tokens.muted, borderColor: t.tokens.muted, marginTop: 6 }}>
        <AppText variant="h3">{R.connection.title}</AppText>
        <AppText>{connectionTask(R.connection.tasks, now)}</AppText>
        <ChoiceCard multi label={R.connection.done} selected={done} onPress={() => save({ connectionWeeks: toggleItem(r.connectionWeeks, weekKeyOf(now)) })} />
        {done ? (
          <AppText variant="small" weight="700" color={t.colors.success}>
            {R.connection.doneNote}
          </AppText>
        ) : null}
      </Card>

      <AppText variant="h3" style={{ marginTop: 6 }}>
        {R.bridge.title}
      </AppText>
      <AppText variant="small" muted>
        {R.bridge.hint}
      </AppText>
      <View style={{ gap: t.space.sm }}>
        {R.bridge.items.map((it) => (
          <Button key={it.id} label={`${it.label}`} variant="secondary" onPress={() => router.push(it.route as Href)} />
        ))}
      </View>
    </Screen>
  );
}
