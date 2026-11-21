import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, ListRow, RowGroup, Screen, useTheme } from '@/components';
import { Card, IconTile, ScalePressable } from '@/components/ui';
import { APP_NAME } from '@/config/app';
import { ACHIEVEMENTS } from '@/features/gamification/achievements';
import { useStreak } from '@/features/gamification/service';
import { isEntitlementValid } from '@/features/purchases/entitlement';
import { ActiveTrackCard, ExerciseGuide, MuscleStructureCard } from '@/features/training/ProfileTraining';
import { openManageSubscriptions, restorePurchases } from '@/features/purchases/iap';
import { useEntitlementStore } from '@/stores/entitlementStore';
import { useProgressStore } from '@/stores/progressStore';
import { useTrainingStore } from '@/stores/trainingStore';

/**
 * Profil — ui-v3 (SPEC_UI_V3 §7.8): avatar (User icon) with the level / streak / trophies summary,
 * the subscription card ("Premium aktif" with a BadgeCheck and the renewal date) and the settings as
 * grouped list rows (Antrenman, Bildirimler, Görünüm, Veri ve gizlilik, Yasal, Geliştirici).
 */
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
    <Screen contentStyle={{ gap: t.space.xl }}>
      <AppText variant="title1" accessibilityRole="header">
        {tr('profile.title')}
      </AppText>

      <Card style={{ padding: t.space.lg, gap: t.space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
          <IconTile icon="user" size="lg" round />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="title3">{APP_NAME}</AppText>
            <AppText variant="footnote" muted>
              {premium ? tr('profile.sub.active') : tr('profile.sub.free')}
            </AppText>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Summary value={String(level)} label={tr('profile.level')} />
          <Summary value={String(streak.current)} label={tr('profile.streak')} divider />
          <Summary value={`${unlocked}/${ACHIEVEMENTS.length}`} label={tr('profile.trophies')} divider onPress={() => router.push('/achievements')} />
        </View>
      </Card>

      <RowGroup title={tr('profile.subscription')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 64, paddingVertical: t.space.sm, borderBottomWidth: t.border.hairline, borderBottomColor: t.tokens.border }}>
          <IconTile icon={premium ? 'badgeCheck' : 'sparkle'} background={premium ? t.tokens.successSoft : undefined} color={premium ? t.tokens.success : undefined} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="bodyStrong">{premium ? tr('profile.sub.active') : tr('profile.sub.free')}</AppText>
            {premium && ent.expiresAt ? (
              <AppText variant="footnote" muted>
                {tr('profile.sub.renews', { date: new Date(ent.expiresAt).toLocaleDateString(locale) })}
              </AppText>
            ) : null}
          </View>
        </View>
        {!premium ? <ListRow label={tr('profile.sub.upgrade')} icon="star" onPress={() => router.push({ pathname: '/paywall', params: { source: 'profile' } })} /> : null}
        <ListRow label={tr('profile.sub.manage')} icon="card" onPress={() => void openManageSubscriptions()} />
        <ListRow label={tr('paywall.restore')} icon="rotate" onPress={() => void restorePurchases()} />
      </RowGroup>

      {/* Antrenman (SPEC_V4 §A.3): active track, the muscle questions, the exercise guide, then the rows. */}
      <View style={{ gap: t.space.md }}>
        <AppText variant="title3" accessibilityRole="header">
          {tr('profile.groups.training')}
        </AppText>
        <ActiveTrackCard />
        <MuscleStructureCard />
        <AppText variant="footnote" weight="600" muted>
          {tr('profile.training.guide')}
        </AppText>
        <ExerciseGuide />
      </View>
      <RowGroup>
        <ListRow label={tr('profile.replayTutorial')} icon="play" onPress={() => router.push({ pathname: '/tutorial', params: { replay: '1' } })} />
        <ListRow label={tr('profile.training.trophies')} icon="trophy" onPress={() => router.push('/achievements')} />
        <ListRow label={tr('settings.training.title')} icon="pulse" onPress={() => router.push('/settings/training')} />
      </RowGroup>

      <RowGroup title={tr('profile.groups.notifications')}>
        <ListRow label={tr('settings.reminders.title')} icon="bell" onPress={() => router.push('/settings/reminders')} />
      </RowGroup>

      <RowGroup title={tr('profile.groups.appearance')}>
        <ListRow label={tr('settings.appearance.title')} icon="sun" onPress={() => router.push('/settings/appearance')} />
      </RowGroup>

      <RowGroup title={tr('profile.groups.data')}>
        <ListRow label={tr('settings.data.title')} icon="shield" onPress={() => router.push('/settings/data')} />
      </RowGroup>

      <RowGroup title={tr('profile.groups.legal')}>
        <ListRow label={tr('legal.disclaimer.title')} icon="stethoscope" tone="knowledge" onPress={() => router.push('/legal/disclaimer')} />
        <ListRow label={tr('legal.privacy.title')} icon="lock" tone="knowledge" onPress={() => router.push('/legal/privacy')} />
        <ListRow label={tr('legal.terms.title')} icon="file" tone="knowledge" onPress={() => router.push('/legal/terms')} />
        <ListRow label={tr('settings.about.title', { app: APP_NAME })} icon="info" tone="knowledge" onPress={() => router.push('/settings/about')} />
      </RowGroup>

      {__DEV__ ? (
        <RowGroup title={tr('profile.groups.developer')}>
          <ListRow label={tr('profile.devGallery')} icon="layers" onPress={() => router.push('/dev/gallery')} />
        </RowGroup>
      ) : null}
    </Screen>
  );
}

function Summary({ value, label, divider, onPress }: { value: string; label: string; divider?: boolean; onPress?: () => void }) {
  const t = useTheme();
  const body = (
    <View style={{ gap: 2, paddingHorizontal: t.space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs }}>
        <AppText variant="title2" tabular>
          {value}
        </AppText>
        {onPress ? <Icon name="chevron" size="sm" color={t.tokens.subtle} /> : null}
      </View>
      <AppText variant="footnote" muted>
        {label}
      </AppText>
    </View>
  );
  const style = { flex: 1, borderLeftWidth: divider ? t.border.thin : 0, borderLeftColor: t.tokens.border };
  if (!onPress)
    return (
      <View style={style} accessible accessibilityLabel={`${label}: ${value}`}>
        {body}
      </View>
    );
  return (
    <ScalePressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} style={[style, { minHeight: t.touch, justifyContent: 'center' }]}>
      {body}
    </ScalePressable>
  );
}
