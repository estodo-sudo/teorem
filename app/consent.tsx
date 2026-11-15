import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Icon, Screen, useTheme } from '@/components';
import { APP_NAME, MIN_AGE } from '@/config/app';
import { useProfileStore } from '@/stores/profileStore';

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
    <Screen
      footer={
        <Button
          label={tr('consent.accept')}
          size="lg"
          variant="accent"
          disabled={!age || !medical}
          onPress={accept}
          accessibilityHint={tr('consent.acceptHint')}
        />
      }
    >
      <View style={{ alignItems: 'center', marginTop: 24, gap: 8 }}>
        <View style={[styles.badge, { backgroundColor: t.colors.primary }]}>
          <Icon name="shield" color={t.colors.primaryText} size={40} />
        </View>
        <AppText variant="h1" center>
          {tr('consent.title', { app: APP_NAME })}
        </AppText>
        <AppText muted center>
          {tr('consent.subtitle')}
        </AppText>
      </View>
      <Card style={{ gap: 8 }}>
        <AppText variant="h3">{tr('consent.medicalTitle')}</AppText>
        <AppText>{tr('consent.medicalBody')}</AppText>
        <Pressable onPress={() => router.push('/legal/disclaimer')} accessibilityRole="link">
          <AppText weight="700" color={t.colors.accent}>
            {tr('consent.readMore')}
          </AppText>
        </Pressable>
      </Card>
      <Check checked={age} onPress={() => setAge(!age)} label={tr('consent.age', { age: MIN_AGE })} />
      <Check checked={medical} onPress={() => setMedical(!medical)} label={tr('consent.medicalCheck')} />
    </Screen>
  );
}

function Check({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={[styles.check, { minHeight: t.touch }]}
    >
      <View
        style={[
          styles.box,
          { borderColor: checked ? t.colors.accent : t.colors.border, backgroundColor: checked ? t.colors.accent : 'transparent' },
        ]}
      >
        {checked ? <Icon name="check" color={t.colors.accentText} size={18} strokeWidth={3} /> : null}
      </View>
      <AppText style={{ flex: 1 }}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
