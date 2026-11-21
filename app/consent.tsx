import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, Screen, useTheme } from '@/components';
import { Button, IconTile, OptionCard, ScalePressable } from '@/components/ui';
import { APP_NAME, MIN_AGE } from '@/config/app';
import { useProfileStore } from '@/stores/profileStore';

/** Consent — ui-v3 (SPEC_UI_V3 §7.9): calm header, the medical note on a soft warning panel and the two confirmations as selection cards. Logic unchanged. */
export default function Consent() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const update = useProfileStore((s) => s.update);
  const [age, setAge] = useState(false);
  const [medical, setMedical] = useState(false);

  const accept = () => {
    update({ disclaimerAcceptedAt: new Date().toISOString() });
    router.replace('/intro/anatomy');
  };

  return (
    <Screen footer={<Button label={tr('consent.accept')} size="lg" fullWidth disabled={!age || !medical} onPress={accept} accessibilityHint={tr('consent.acceptHint')} />}>
      <View style={{ alignItems: 'center', marginTop: t.space.lg, gap: t.space.md }}>
        <IconTile icon="shieldCheck" size={t.tile.lg + t.space.xl} round />
        <AppText variant="title1" center accessibilityRole="header">
          {tr('consent.title', { app: APP_NAME })}
        </AppText>
        <AppText variant="body" muted center>
          {tr('consent.subtitle')}
        </AppText>
      </View>
      <View style={{ padding: t.space.gutter, gap: t.space.sm, borderRadius: t.radius.lg, backgroundColor: t.tokens.warningSoft }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm }}>
          <Icon name="warning" size="md" color={t.tokens.warning} />
          <AppText variant="title3" style={{ flex: 1 }}>
            {tr('consent.medicalTitle')}
          </AppText>
        </View>
        <AppText variant="callout">{tr('consent.medicalBody')}</AppText>
        <ScalePressable onPress={() => router.push('/legal/disclaimer')} accessibilityRole="link" style={{ minHeight: t.touch, justifyContent: 'center', alignSelf: 'flex-start' }}>
          <AppText variant="callout" style={{ fontWeight: '600', color: t.tokens.primary, textDecorationLine: 'underline' }}>
            {tr('consent.readMore')}
          </AppText>
        </ScalePressable>
      </View>
      <View style={{ gap: t.space.sm }}>
        <OptionCard multi icon="user" label={tr('consent.age', { age: MIN_AGE })} selected={age} onPress={() => setAge(!age)} />
        <OptionCard multi icon="book" label={tr('consent.medicalCheck')} selected={medical} onPress={() => setMedical(!medical)} />
      </View>
    </Screen>
  );
}
