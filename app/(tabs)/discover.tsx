import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText, Screen, useTheme } from '@/components';
import { exploreImage } from '@/content/explore/images';
import type { CampDefinition } from '@/features/camps/core/definition';
import { CAMPS } from '@/features/camps/registry';
import { CAMPUSES, type CampusEntry } from '@/features/content/cards';
import { GLOSSARY, STORIES, type Course, type GlossaryTerm, type Story } from '@/features/content/data';
import { storyOfTheDay } from '@/features/content/daily';
import { CampWideCard, CARD, FeaturedStoryCard, GlossaryCompactCard, ProgramCard, StoryPosterCard } from '@/features/content/explore/ExploreCards';
import { HorizontalSection } from '@/features/content/explore/HorizontalSection';
import { ALC, useAlcSummary, useBodySummary, useCourseSummary, type ProgramSummary } from '@/features/content/explore/summaries';
import { openGated, useAccess } from '@/features/purchases/useGate';
import { toDateKey } from '@/lib/date';
import { useProgressStore } from '@/stores/progressStore';

type CampItem = { kind: 'camp'; def: CampDefinition } | { kind: 'alcohol' };
const CAMP_ITEMS: CampItem[] = [...CAMPS.map((def) => ({ kind: 'camp' as const, def })), { kind: 'alcohol' }];
const PROGRAMS = CAMPUSES.filter((c): c is Exclude<CampusEntry, { kind: 'alcohol' }> => c.kind !== 'alcohol');

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
  const daily = storyOfTheDay(toDateKey(), STORIES, read);
  const openStory = (id: string) => openGated('stories', { pathname: '/story/[storyId]', params: { storyId: id } });
  const readCount = read.filter((id) => STORIES.some((s) => s.id === id)).length;
  // Unread stories first, read ones at the end (§4.2).
  const stories = [...STORIES.filter((s) => !read.includes(s.id)), ...STORIES.filter((s) => read.includes(s.id))];
  const a11y = (title: string, count: number) => tr('discover.listA11y', { title, count });

  return (
    <Screen contentStyle={{ gap: t.space.xxl }}>
      <AppText variant="title1" accessibilityRole="header">
        {tr('discover.title')}
      </AppText>

      {daily ? (
        <FeaturedStoryCard
          title={daily.title}
          kicker={tr('stories.ofTheDay')}
          meta={tr('stories.minutes', { count: daily.minutes })}
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
        render={(s) => <StoryPosterCard title={s.title} read={read.includes(s.id)} readLabel={tr('discover.read')} image={exploreImage('stories', s.id)} icon={s.icon} tone={s.tone ?? 'knowledge'} onPress={() => openStory(s.id)} />}
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

      <HorizontalSection<(typeof PROGRAMS)[number]>
        id="programs"
        title={tr('courses.title')}
        hint={tr('courses.subtitle')}
        right={tr('discover.programCount', { count: PROGRAMS.length })}
        items={PROGRAMS}
        itemWidth={CARD.program.w}
        listLabel={a11y(tr('courses.title'), PROGRAMS.length)}
        keyOf={(p) => p.id}
        render={(p) => (p.kind === 'body' ? <BodyProgram id={p.id} /> : <CourseProgram course={p.course} />)}
      />

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

function ProgramTile({ p }: { p: ProgramSummary }) {
  const onPress = () =>
    p.route.kind === 'body' ? openGated('courses', `/campus/${p.route.id}`) : openGated('courses', { pathname: '/course/[courseId]', params: { courseId: p.route.id } });
  return <ProgramCard title={p.title} lengthLabel={p.length} progressLabel={p.progressLabel} progress={p.progress} image={exploreImage('programs', p.key)} icon={p.icon} tone={p.tone} locked={p.locked} onPress={onPress} />;
}

const BodyProgram = ({ id }: { id: 'neck' | 'feet' }) => <ProgramTile p={useBodySummary(id)} />;
const CourseProgram = ({ course }: { course: Course }) => <ProgramTile p={useCourseSummary(course)} />;
