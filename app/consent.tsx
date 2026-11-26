import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Branded, Screen, useTheme } from '@/components';
import { AnimatedArt } from '@/components/AnimatedArt';
import { AccordionCard, Button, OptionCard, ScalePressable } from '@/components/ui';
import { APP_NAME, MIN_AGE } from '@/config/app';
import { useProfileStore } from '@/stores/profileStore';

/** Consent — ui-v3 (SPEC_UI_V3 §7.9): calm header, the medical note in a closed drawer (2026-11-23) and the two confirmations as selection cards. */
export default function Consent() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const update = useProfileStore((s) => s.update);
  const [age, setAge] = useState(false);
  const [medical, setMedical] = useState(false);

  const accept = () => {
    update({ disclaimerAcceptedAt: new Date().toISOString() });
    router.replace('/onboarding');
  };

  return (
    <Screen footer={<Button label={tr('consent.accept')} size="lg" fullWidth disabled={!age || !medical} onPress={accept} accessibilityHint={tr('consent.acceptHint')} />}>
      <View style={{ alignItems: 'center', marginTop: t.space.lg, gap: t.space.md }}>
        <AnimatedArt name="consent" size={150} />
        <AppText variant="title1" center accessibilityRole="header">
          <Branded>{tr('consent.title', { app: APP_NAME })}</Branded>
        </AppText>
        <AppText variant="body" muted center>
          {tr('consent.subtitle')}
        </AppText>
      </View>
      {/* The medical notice sits in a closed drawer (user request 2026-11-23); tap the title to read it. */}
      <AccordionCard title={tr('consent.medicalTitle')} subtitle={tr('consent.medicalTap')} icon="warning" iconColor={t.tokens.warning}>
        <AppText variant="callout">{tr('consent.medicalBody')}</AppText>
        <ScalePressable onPress={() => router.push('/legal/disclaimer')} accessibilityRole="link" style={{ minHeight: t.touch, justifyContent: 'center', alignSelf: 'flex-start' }}>
          <AppText variant="callout" style={{ fontWeight: '600', color: t.tokens.primary, textDecorationLine: 'underline' }}>
            {tr('consent.readMore')}
          </AppText>
        </ScalePressable>
      </AccordionCard>
      <View style={{ gap: t.space.sm }}>
        <OptionCard multi icon="user" label={tr('consent.age', { age: MIN_AGE })} selected={age} onPress={() => setAge(!age)} />
        <OptionCard multi icon="book" label={tr('consent.medicalCheck')} selected={medical} onPress={() => setMedical(!medical)} />
      </View>
      {/* KVKK m.10: the disclosure is offered before first use; the data stays on the phone. */}
      <View style={{ gap: t.space.xs }}>
        <AppText variant="footnote" muted>
          {tr('consent.legalNote')}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: t.space.md }}>
          {(['kvkk', 'privacy', 'terms'] as const).map((d) => (
            <ScalePressable key={d} onPress={() => router.push(`/legal/${d}`)} accessibilityRole="link" style={{ minHeight: t.touch, justifyContent: 'center' }}>
              <AppText variant="footnote" style={{ fontWeight: '600', color: t.tokens.primary, textDecorationLine: 'underline' }}>
                {tr(`legal.${d}.title`)}
              </AppText>
            </ScalePressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
