import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, Screen, useTheme } from '@/components';
import { SHOW_COMING_SOON } from '@/config/app';
import { exploreImage } from '@/content/images';
import type { CampDefinition } from '@/features/camps/core/definition';
import { CAMPS } from '@/features/camps/registry';
import { GLOSSARY, STORIES, type GlossaryTerm, type Story } from '@/features/content/data';
import { featuredStory, orderStories, storyProgress, storyState } from '@/features/content/story/discover';
import { CampWideCard, CARD, FeaturedStoryCard, GlossaryCompactCard, ProgramCard, StoryPosterCard } from '@/features/content/explore/ExploreCards';
import { HorizontalSection } from '@/features/content/explore/HorizontalSection';
import { ALC, useAlcSummary } from '@/features/content/explore/summaries';
import { openGated, useAccess } from '@/features/purchases/useGate';
import { toDateKey } from '@/lib/date';
import { useProgressStore } from '@/stores/progressStore';

type CampItem = { kind: 'camp'; def: CampDefinition } | { kind: 'alcohol' };
const CAMP_ITEMS: CampItem[] = [...CAMPS.map((def) => ({ kind: 'camp' as const, def })), { kind: 'alcohol' }];
/**
 * Antrenmanlar strip: id = image id (programs/<id>) and title key (`<id>.title` or `programsSoon.<id>`).
 * All three are locked with a "Yakında" stamp for now (user request 2026-11-22); Aletsiz Fitness is
 * built and reachable again by removing its `soon`.
 */
const PROGRAMS = [
  { id: 'bodyweight', titleKey: 'bodyweight.title', icon: 'dumbbell' as const, route: '/bodyweight' as const, soon: true },
  { id: 'posture', titleKey: 'programsSoon.posture', icon: 'body' as const, route: undefined, soon: true },
  { id: 'mobility', titleKey: 'programsSoon.mobility', icon: 'feather' as const, route: undefined, soon: true },
];
const VISIBLE_PROGRAMS = PROGRAMS.filter((p) => SHOW_COMING_SOON || !p.soon);

/**
 * Keşfet v2 (SPEC_KESFET_V2): the story of the day, then four horizontal strips — Bilgi Hikâyeleri
 * (posters), Kamplar (incl. Alkolsüz Kamp), Antrenmanlar and "Neden, Nedir ve Ne Demek?" (two-row grid).
 * Every strip shows all of its items; no "see all". Photos are bundled, with a tone-gradient fallback.
 */
export default function Discover() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const content = useProgressStore((s) => s.content);
  const access = useAccess();
  const read = content.readStoryIds;
  const positions = content.storyPositions ?? {};
  const saved = content.favoriteStoryIds;
  const featured = featuredStory(toDateKey(), STORIES, read, positions);
  const daily = featured?.story;
  const openStory = (id: string) => openGated('stories', { pathname: '/story/[storyId]', params: { storyId: id } });
  const readCount = read.filter((id) => STORIES.some((s) => s.id === id)).length;
  // SPEC_V4 §B.2: half read first, then unread, read ones at the end.
  const stories = orderStories(STORIES, read, positions);
  const stateLabel = (id: string) => {
    const st = storyState(id, read, positions);
    return [st === 'partial' ? tr('stories.state.partial') : st === 'read' ? tr('discover.read') : null, saved.includes(id) ? tr('stories.state.saved') : null].filter(Boolean).join(', ');
  };
  const a11y = (title: string, count: number) => tr('discover.listA11y', { title, count });

  return (
    <Screen contentStyle={{ gap: t.space.xxl }}>
      {/* Title, and beside it a quiet note that this page keeps growing. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
        <AppText variant="title1" accessibilityRole="header">
          {tr('discover.title')}
        </AppText>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: t.space.xs }}>
          <Icon name="sparkle" size="sm" color={t.tokens.primary} />
          <AppText variant="footnote" muted style={{ flexShrink: 1, textAlign: 'right' }}>
            {tr('discover.growing')}
          </AppText>
        </View>
      </View>

      {daily ? (
        <FeaturedStoryCard
          title={daily.title}
          kicker={tr('stories.ofTheDay')}
          meta={tr('stories.meta', { min: daily.minutes, count: storyProgress(daily, positions).slides })}
          resume={featured?.resume ? tr('stories.resume', { n: storyProgress(daily, positions).at, total: storyProgress(daily, positions).slides }) : undefined}
          image={exploreImage('stories', daily.id)}
          icon={daily.icon}
          tone={daily.tone ?? 'knowledge'}
          locked={!access('stories')}
          onPress={() => openStory(daily.id)}
        />
      ) : null}

      <HorizontalSection<Story>
        id="stories"
        title={tr('stories.title')}
        right={tr('stories.readCount', { read: readCount, total: STORIES.length })}
        items={stories}
        itemWidth={CARD.poster.w}
        listLabel={a11y(tr('stories.title'), STORIES.length)}
        keyOf={(s) => s.id}
        render={(s) => <StoryPosterCard title={s.title} read={read.includes(s.id)} progress={storyProgress(s, positions).share} saved={saved.includes(s.id)} stateLabel={stateLabel(s.id)} image={exploreImage('stories', s.id)} icon={s.icon} tone={s.tone ?? 'knowledge'} onPress={() => openStory(s.id)} />}
      />

      <HorizontalSection<CampItem>
        id="camps"
        title={tr('camps.title')}
        right={tr('discover.campCount', { count: CAMP_ITEMS.length })}
        items={CAMP_ITEMS}
        itemWidth={CARD.camp.w}
        listLabel={a11y(tr('camps.title'), CAMP_ITEMS.length)}
        keyOf={(c) => (c.kind === 'camp' ? c.def.id : 'alcohol')}
        render={(c) => (c.kind === 'camp' ? <CampItemCard def={c.def} /> : <AlcoholCampCard />)}
      />

      {/* Antrenmanlar: the new programmes, one by one (Aletsiz Fitness first, user request 2026-11-22).
          "Yakında" ones are hidden (SHOW_COMING_SOON); with none left the whole strip is hidden. */}
      {VISIBLE_PROGRAMS.length > 0 ? (
        <HorizontalSection<(typeof PROGRAMS)[number]>
          id="programs"
          title={tr('courses.title')}
          items={VISIBLE_PROGRAMS}
          itemWidth={CARD.program.w}
          listLabel={a11y(tr('courses.title'), VISIBLE_PROGRAMS.length)}
          keyOf={(p) => p.id}
          render={(p) => (
            <ProgramCard
              title={tr(p.titleKey)}
              lengthLabel={tr('bodyweight.chip')}
              soon={p.soon ? tr('bodyweight.soon') : undefined}
              progress={0}
              image={exploreImage('programs', p.id)}
              icon={p.icon}
              tone="campus"
              locked={!access('courses')}
              onPress={() => p.route && openGated('courses', p.route)}
            />
          )}
        />
      ) : null}

      <HorizontalSection<GlossaryTerm>
        id="glossary"
        title={tr('glossary.title')}
        hint={tr('glossary.subtitle')}
        right={tr('discover.termCount', { count: GLOSSARY.length })}
        items={GLOSSARY}
        rows={2}
        itemWidth={CARD.glossary.w}
        listLabel={a11y(tr('glossary.title'), GLOSSARY.length)}
        keyOf={(g) => g.id}
        render={(g) => (
          <GlossaryCompactCard
            title={g.title}
            summary={g.shortSummary ?? g.summary}
            image={exploreImage('glossary', g.id)}
            icon={g.icon}
            tone="knowledge"
            onPress={() => router.push({ pathname: '/glossary/[termId]', params: { termId: g.id } })}
          />
        )}
      />
    </Screen>
  );
}

function CampItemCard({ def }: { def: CampDefinition }) {
  const { t: tr } = useTranslation();
  const s = def.useSummary();
  const tone = def.id === 'odak' ? 'focus' : 'smokefree';
  return (
    <CampWideCard
      title={tr(def.titleKey)}
      description={tr(`discover.campDesc.${def.id}`)}
      lengthLabel={tr('camps.length', { count: def.days })}
      image={exploreImage('camps', def.id)}
      icon={def.icon}
      tone={tone}
      joined={s.joined}
      day={s.day}
      total={s.total}
      progress={s.progress}
      status={s.status}
      locked={s.locked}
      startLabel={tr('discover.start')}
      continueLabel={tr('discover.continue')}
      dayLabel={s.day ? tr('discover.dayOf', { day: s.day, total: s.total }) : undefined}
      onPress={() => router.push(def.route)}
    />
  );
}

/** Alkolsüz Kamp: the alcohol programme, shown among the camps (route and data stay /campus/alcohol). */
function AlcoholCampCard() {
  const { t: tr } = useTranslation();
  const s = useAlcSummary();
  return (
    <CampWideCard
      title={ALC.title}
      description={tr('discover.campDesc.alcohol')}
      lengthLabel={tr('camps.length', { count: s.total })}
      image={exploreImage('camps', 'alcohol')}
      icon={ALC.icon}
      tone="campus"
      joined={s.joined}
      day={s.day}
      total={s.total}
      progress={s.progress}
      status={s.status}
      startLabel={tr('discover.start')}
      continueLabel={tr('discover.continue')}
      dayLabel={s.day ? tr('discover.dayOf', { day: s.day, total: s.total }) : undefined}
      onPress={() => openGated('courses', '/campus/alcohol')}
    />
  );
}
