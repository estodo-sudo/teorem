import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Icon, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { exploreImage } from '@/content/images';
import { CATEGORIES, getProgram, type Category } from '@/features/bodyweight/catalog';
import { currentDay } from '@/features/bodyweight/program';
import { ExplorePhoto } from '@/features/content/explore/ExploreCards';
import { toDateKey } from '@/lib/date';
import { useBodyweightStore } from '@/stores/bodyweightStore';

/**
 * Aletsiz Fitness (user request 2026-11-22): the cover, what it is, and the 11 categories. A ready
 * category opens its programmes (Toparla 30 / Geliştir 60 / Güçlendir 90 days); the others say
 * "Yakında" until their programmes are added.
 */
export default function BodyweightHome() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Screen>
      <Header title={tr('bodyweight.title')} />
      <View style={{ borderRadius: t.radius.lg, overflow: 'hidden' }}>
        <ExplorePhoto image={exploreImage('programs', 'bodyweight')} icon="dumbbell" tone="campus" style={{ width: '100%', aspectRatio: 660 / 390 }} />
      </View>
      <AppText muted>{tr('bodyweight.intro')}</AppText>
      <AppText variant="title2" accessibilityRole="header">
        {tr('bodyweight.categoriesTitle')}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
        {CATEGORIES.map((c) => (
          <CategoryTile key={c.id} c={c} />
        ))}
      </View>
    </Screen>
  );
}

function CategoryTile({ c }: { c: Category }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const progress = useBodyweightStore((s) => s.active[c.id]);
  const program = progress ? getProgram(c, progress.programId) : undefined;
  const now = program && progress ? currentDay(program, progress, toDateKey()) : undefined;
  const title = tr(`bodyweight.categories.${c.id}`);
  const meta = !c.ready ? tr('bodyweight.soon') : program && now ? tr('bodyweight.activeMeta', { program: tr(`bodyweight.programs.${program.id}.title`), day: now.day, days: program.days }) : c.id === 'isinma' ? tr('bodyweight.warmupMeta') : tr('bodyweight.programsMeta');
  return (
    <Pressable
      onPress={c.ready ? () => router.push({ pathname: '/bodyweight/[category]', params: { category: c.id } }) : undefined}
      disabled={!c.ready}
      accessibilityRole="button"
      accessibilityState={{ disabled: !c.ready }}
      accessibilityLabel={`${title}. ${meta}`}
      style={({ pressed }) => ({
        flexBasis: '47%',
        flexGrow: 1,
        minHeight: 96,
        padding: t.space.md,
        gap: t.space.sm,
        borderRadius: t.radius.lg,
        borderWidth: program ? t.border.medium : t.border.thin,
        borderColor: program ? t.tokens.primary : t.tokens.border,
        backgroundColor: pressed ? t.tokens.muted : t.tokens.card,
        opacity: c.ready ? 1 : 0.55,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconTile icon={c.icon} tone="campus" />
        {c.ready ? <Icon name="chevron" size="sm" color={t.tokens.mutedForeground} /> : <Icon name="lock" size="sm" color={t.tokens.mutedForeground} />}
      </View>
      <AppText variant="bodyStrong">{title}</AppText>
      <AppText variant="footnote" muted numberOfLines={2}>
        {meta}
      </AppText>
    </Pressable>
  );
}
