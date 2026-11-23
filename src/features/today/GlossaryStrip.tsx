import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { exploreImage } from '@/content/images';
import { GLOSSARY, type GlossaryTerm } from '@/features/content/data';
import { CARD, StoryPosterCard } from '@/features/content/explore/ExploreCards';
import { HorizontalSection } from '@/features/content/explore/HorizontalSection';

/** App concepts ("Seviye ne demek?" …): Keşfet only. Günüm shows the sexual-health terms. */
export const APP_TERMS = new Set(['level', 'plan', 'exercises', 'vibration', 'streak', 'strength-test', 'discreet', 'privacy']);
const HEALTH_TERMS = GLOSSARY.filter((g) => !APP_TERMS.has(g.id));

/**
 * "Neden, Nedir ve Ne Demek?" on Günüm (user request 2026-11-22): the same terms and pages as in
 * Keşfet, shown as photo posters like the Bilgi Hikâyeleri strip — only the sexual-health ones (user
 * request); Keşfet keeps every term in its own compact grid.
 */
export function GlossaryStrip() {
  const { t: tr } = useTranslation();
  return (
    <HorizontalSection<GlossaryTerm>
      id="home-glossary"
      title={tr('glossary.title')}
      hint={tr('glossary.homeSubtitle')}
      right={tr('discover.termCount', { count: HEALTH_TERMS.length })}
      items={HEALTH_TERMS}
      itemWidth={CARD.poster.w}
      listLabel={tr('discover.listA11y', { title: tr('glossary.title'), count: HEALTH_TERMS.length })}
      keyOf={(g) => g.id}
      render={(g) => (
        <StoryPosterCard
          plain
          read={false}
          title={g.title}
          image={exploreImage('glossary', g.id)}
          icon={g.icon}
          tone="knowledge"
          onPress={() => router.push({ pathname: '/glossary/[termId]', params: { termId: g.id } })}
        />
      )}
    />
  );
}
