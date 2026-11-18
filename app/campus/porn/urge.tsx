import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Header, Screen, useTheme } from '@/components';
import { PC } from '@/features/campus/porn/content';
import { ActivityTile, LapseAnalysisDialog } from '@/features/campus/porn/ui';
import { SectionTitle, tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampusStore } from '@/stores/campusStore';

/**
 * "Farklı şeylerle uğraş": at an urge, a list of everyday things to do instead.
 * Favourites (picked at enrolment) come first as large tiles; the rest follow by category.
 * The tiles are suggestions only; "Dürtü geçti" records the urge as ridden out.
 */
export default function PcUrgeScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const favIds = useCampusStore((s) => s.porn.activityIds);
  const [done, setDone] = useState(false);
  const [lapseOpen, setLapseOpen] = useState(false);
  const favorites = PC.activities.filter((a) => favIds.includes(a.id));
  const others = PC.activities.filter((a) => !favIds.includes(a.id));
  const back = () => goBack('/campus/porn');

  if (done) {
    return (
      <Screen footer={<Button label={tr('pcampus.urge.back')} size="lg" variant="primary" onPress={back} />}>
        <Header title={tr('pcampus.urge.title')} close onBack={back} />
        <View style={{ alignItems: 'center', gap: 10, marginTop: 40 }}>
          <AppText variant="display">🎉</AppText>
          <AppText variant="h1" center accessibilityRole="header">
            {tr('pcampus.urge.doneTitle')}
          </AppText>
          <AppText muted center>
            {tr('pcampus.urge.doneBody')}
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          label={tr('pcampus.urge.done')}
          icon="check"
          variant="accent"
          size="lg"
          onPress={() => {
            useCampusStore.getState().logPcUrge(null);
            setDone(true);
          }}
        />
      }
    >
      <Header title={tr('pcampus.urge.title')} close onBack={back} />

      <View style={{ padding: 16, borderRadius: t.radius.xl, backgroundColor: tint(t.colors.primary, '1A') }}>
        <AppText>{tr('pcampus.urge.intro')}</AppText>
      </View>

      <SectionTitle emoji="⭐" title={tr('pcampus.urge.favorites')} hint={tr('pcampus.urge.favoritesHint')} />
      {favorites.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {favorites.map((a) => (
            <ActivityTile key={a.id} large emoji={a.emoji} label={a.label} />
          ))}
        </View>
      ) : (
        <AppText variant="small" muted>
          {tr('pcampus.urge.favoritesEmpty')}
        </AppText>
      )}

      <SectionTitle emoji="💡" title={tr('pcampus.urge.others')} />
      {PC.activityCategories.map((c) => {
        const items = others.filter((a) => a.category === c.id);
        if (!items.length) return null;
        return (
          <View key={c.id} style={{ gap: 8 }}>
            <AppText variant="small" weight="800" muted>
              {c.emoji} {c.label}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {items.map((a) => (
                <ActivityTile key={a.id} emoji={a.emoji} label={a.label} />
              ))}
            </View>
          </View>
        );
      })}

      <Button label={tr('pcampus.urge.lapsed')} variant="ghost" onPress={() => setLapseOpen(true)} />
      <LapseAnalysisDialog visible={lapseOpen} onClose={() => setLapseOpen(false)} onSaved={back} />
    </Screen>
  );
}
