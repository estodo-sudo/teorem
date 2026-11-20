import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, Header, Icon, Screen, useTheme } from '@/components';
import { CAMP_LIBRARY } from '@/features/camps/smoking/content';
import { isMinor, MEDICATION_STORIES, storyIsFree } from '@/features/camps/smoking/engine/premium';
import { useCampStore } from '@/stores/campStore';
import { tint } from '@/features/campus/shared/ui';
import { useAccess } from '@/features/purchases/useGate';
import { goBack } from '@/lib/nav';
import { IconTile } from '@/components/ui';

/** Knowledge library: short sourced stories on the shared story player. */
export default function CampLibrary() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const premium = useAccess()('camp');
  const minor = isMinor(useCampStore((x) => x.profile?.ageRange));
  return (
    <Screen>
      <Header title={tr('camp.library.title')} onBack={() => goBack('/camp')} />
      <AppText muted>{tr('camp.library.intro')}</AppText>
      {CAMP_LIBRARY.stories
        .filter((s) => !(minor && MEDICATION_STORIES.includes(s.id)))
        .map((s) => (
          <Pressable
            key={s.id}
            onPress={() => (premium || storyIsFree(s.id) ? router.push({ pathname: '/camp/library/[storyId]', params: { storyId: s.id } }) : router.push({ pathname: '/paywall', params: { source: 'camp' } }))}
            accessibilityRole="button"
            accessibilityLabel={s.title}
          >
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(t.colors.primary, '1F') }}>
                <IconTile icon={s.icon} tone="smokefree" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText weight="800">{s.title}</AppText>
                <AppText variant="tiny" muted>
                  {tr('camp.library.minutes', { count: s.minutes })}
                </AppText>
              </View>
              <Icon name={premium || storyIsFree(s.id) ? 'chevron' : 'lock'} color={t.colors.textMuted} size={18} />
            </Card>
          </Pressable>
        ))}
    </Screen>
  );
}
