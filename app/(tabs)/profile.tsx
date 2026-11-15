import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, ListRow, Screen, useTheme } from '@/components';
import { APP_NAME } from '@/config/app';
import { ACHIEVEMENTS } from '@/features/gamification/achievements';
import { useStreak } from '@/features/gamification/service';
import { isEntitlementValid } from '@/features/purchases/entitlement';
import { openManageSubscriptions, restorePurchases } from '@/features/purchases/iap';
import { useEntitlementStore } from '@/stores/entitlementStore';
import { useProgressStore } from '@/stores/progressStore';
import { useTrainingStore } from '@/stores/trainingStore';

export default function Profile() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const level = useTrainingStore((s) => s.training.level);
  const unlocked = useProgressStore((s) => Object.keys(s.achievements).length);
  const ent = useEntitlementStore((s) => s.entitlement);
  const streak = useStreak();
  const premium = isEntitlementValid(ent, new Date());
  const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';

  return (
    <Screen>
      <AppText variant="h1" accessibilityRole="header">
        {tr('profile.title')}
      </AppText>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Mini value={String(level)} label={tr('profile.level')} />
        <Mini value={String(streak.current)} label={tr('profile.streak')} />
        <Mini value={`${unlocked}/${ACHIEVEMENTS.length}`} label={tr('profile.trophies')} onPress={() => router.push('/achievements')} />
      </View>

      <Card style={{ gap: 4, borderColor: premium ? t.colors.success : t.colors.accent }}>
        <AppText variant="h3">{premium ? tr('profile.sub.active') : tr('profile.sub.free')}</AppText>
        {premium && ent.expiresAt ? (
          <AppText variant="small" muted>
            {tr('profile.sub.renews', { date: new Date(ent.expiresAt).toLocaleDateString(locale) })}
          </AppText>
        ) : null}
        {!premium ? <ListRow label={tr('profile.sub.upgrade')} icon="star" onPress={() => router.push({ pathname: '/paywall', params: { source: 'profile' } })} /> : null}
        <ListRow label={tr('profile.sub.manage')} icon="gear" onPress={() => void openManageSubscriptions()} />
        <ListRow label={tr('paywall.restore')} icon="check" onPress={() => void restorePurchases()} />
      </Card>

      <Section title={tr('profile.settings')}>
        <ListRow label={tr('settings.training.title')} icon="pulse" onPress={() => router.push('/settings/training')} />
        <ListRow label={tr('settings.reminders.title')} icon="bell" onPress={() => router.push('/settings/reminders')} />
        <ListRow label={tr('settings.appearance.title')} icon="sparkle" onPress={() => router.push('/settings/appearance')} />
        <ListRow label={tr('settings.data.title')} icon="shield" onPress={() => router.push('/settings/data')} />
        <ListRow label={tr('profile.replayTutorial')} icon="play" onPress={() => router.push({ pathname: '/tutorial', params: { replay: '1' } })} />
      </Section>

      <Section title={tr('profile.legal')}>
        <ListRow label={tr('legal.disclaimer.title')} icon="help" onPress={() => router.push('/legal/disclaimer')} />
        <ListRow label={tr('legal.privacy.title')} icon="lock" onPress={() => router.push('/legal/privacy')} />
        <ListRow label={tr('legal.terms.title')} icon="book" onPress={() => router.push('/legal/terms')} />
        <ListRow label={tr('settings.about.title', { app: APP_NAME })} icon="user" onPress={() => router.push('/settings/about')} />
      </Section>
    </Screen>
  );
}

function Mini({ value, label, onPress }: { value: string; label: string; onPress?: () => void }) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${label}: ${value}`} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <AppText variant="h2">{value}</AppText>
      <AppText variant="tiny" muted>
        {label}
      </AppText>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card style={{ paddingVertical: 4 }}>
      <AppText variant="small" weight="700" muted style={{ marginTop: 10 }}>
        {title.toLocaleUpperCase('tr-TR')}
      </AppText>
      {children}
    </Card>
  );
}
