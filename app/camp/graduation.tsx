import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { CAMP_REWARDS } from '@/features/camps/smoking/content';
import { cigarettesNotSmoked, totalSmokeFreeDays } from '@/features/camps/smoking/engine/counters';
import { daysSinceQuit, quitStart } from '@/features/camps/smoking/engine/phase';
import { moneySaved } from '@/features/camps/smoking/engine/savings';
import { canGraduate, GRADUATION_DAY } from '@/features/camps/smoking/engine/stats';
import { campAttempt } from '@/features/camps/smoking/state';
import { fmtTL, useCampDate } from '@/features/camps/smoking/ui';
import { tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

const G = CAMP_REWARDS.graduation;

/** Day-90 graduation: a certificate made on the device (shareable as an image) and the graduate step. */
export default function CampGraduation() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const fmtDate = useCampDate();
  const camp = useCampStore();
  const cigs = useCampEventsStore((s) => s.cigarettes);
  const [now] = useState(() => new Date());
  const [shareFailed, setShareFailed] = useState(false);
  const cert = useRef<ComponentRef<typeof View>>(null);
  const attempt = campAttempt(camp);
  const graduated = attempt?.status === 'graduated';
  const eligible = canGraduate(attempt, now);

  if (!attempt || !camp.profile || (!graduated && !eligible)) {
    const left = attempt ? Math.max(0, GRADUATION_DAY - daysSinceQuit(attempt, now)) : GRADUATION_DAY;
    return (
      <Screen>
        <Header title={tr('camp.graduation.title')} onBack={() => goBack('/camp')} />
        <View style={{ alignItems: 'center', gap: t.space.sm, marginTop: 30 }}>
          <IconTile icon="graduation" tone="smokefree" size="lg" round />
          <AppText variant="h2" center>
            {tr('camp.graduation.notYet', { count: left })}
          </AppText>
        </View>
      </Screen>
    );
  }

  const share = async () => {
    try {
      const uri = await captureRef(cert, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: G.certTitle });
      setShareFailed(false);
    } catch {
      setShareFailed(true);
    }
  };

  const stat = (value: string, label: string) => (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <AppText variant="h3" weight="800" color={t.colors.accent} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="tiny" muted center>
        {label}
      </AppText>
    </View>
  );

  return (
    <Screen
      footer={
        graduated ? (
          Platform.OS !== 'web' ? (
            <Button label={tr('camp.graduation.share')} icon="sparkle" size="lg" variant="accent" onPress={() => void share()} />
          ) : null
        ) : (
          <Button label={tr('camp.graduation.celebrate')} icon="trophy" size="lg" variant="accent" onPress={() => useCampStore.getState().graduate()} />
        )
      }
    >
      <Header title={tr('camp.graduation.title')} onBack={() => (graduated ? router.replace('/camp') : goBack('/camp'))} />
      <AppText variant="h2" center accessibilityRole="header">
        {G.title}
      </AppText>
      <AppText center muted>
        {G.text}
      </AppText>

      <View ref={cert} collapsable={false} style={{ padding: 22, gap: 14, borderRadius: t.radius.xl, borderWidth: 3, borderColor: t.colors.border, backgroundColor: t.colors.surface }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <IconTile icon="graduation" tone="smokefree" size="lg" round />
          <AppText variant="h3" center color={t.colors.accent}>
            {G.certTitle}
          </AppText>
          <AppText center>{G.certLine}</AppText>
        </View>
        <View style={{ height: 1, backgroundColor: tint(t.colors.accent, '55') }} />
        <View style={{ flexDirection: 'row', gap: t.space.sm }}>
          {stat(tr('camp.panel.days', { count: totalSmokeFreeDays(attempt, cigs, now) }), tr('camp.graduation.smokeFree'))}
          {stat(String(cigarettesNotSmoked(camp.profile.perDay, attempt, cigs, now)), tr('camp.panel.notSmoked'))}
          {stat(tr('camp.plan.tl', { amount: fmtTL(moneySaved(camp.prices, camp.profile.perDay, attempt, cigs, now)) }), tr('camp.panel.saved'))}
        </View>
        <AppText variant="small" muted center>
          {tr('camp.graduation.dates', { from: fmtDate(quitStart(attempt)), to: fmtDate(attempt.endedAt ?? now.toISOString()) })}
        </AppText>
      </View>
      {shareFailed ? (
        <AppText variant="small" color={t.colors.danger}>
          {tr('camp.graduation.shareFailed')}
        </AppText>
      ) : null}
      <Card style={{ backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
        <AppText variant="small">{G.after}</AppText>
      </Card>
    </Screen>
  );
}
