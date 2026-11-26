import type { ModuleTone } from '@/config/theme';
import type { IconName } from '@/components/Icon';
import { pick } from '@/i18n/content';
import challengesJsonTr from '@/content/challenges.tr.json';
import challengesJsonEn from '@/content/challenges.en.json';
import challengesFemaleTr from '@/content/challenges.female.tr.json';
import challengesFemaleEn from '@/content/challenges.female.en.json';
import { appImage } from '@/content/images';
import { bySex, femaleList, sexVariants } from '@/i18n/sex';
import storiesFemaleTr from '@/content/stories.female.tr.json';
import storiesFemaleEn from '@/content/stories.female.en.json';
import glossaryFemaleTr from '@/content/glossary.female.tr.json';
import glossaryFemaleEn from '@/content/glossary.female.en.json';
import glossaryJsonTr from '@/content/glossary.tr.json';
import glossaryJsonEn from '@/content/glossary.en.json';
import storiesJsonTr from '@/content/stories.tr.json';
import storiesJsonEn from '@/content/stories.en.json';
import type { ChallengeCategory } from '@/types';

const challengesJson = pick({ tr: challengesJsonTr, en: challengesJsonEn });
const glossaryJson = pick({ tr: glossaryJsonTr, en: glossaryJsonEn });
const storiesJson = pick({ tr: storiesJsonTr, en: storiesJsonEn });

export type StoryCategory = 'menHealth' | 'relationships' | 'nutrition' | 'sleep' | 'stress' | 'exercise';

export interface StorySlide {
  title: string;
  text: string;
  icon: IconName;
  didYouKnow?: string;
}

/** Slide types of Bilgi Hikâyeleri v2 (SPEC_V4 §B.1). A slide without `type` is a legacy one, shown as `info`. */
export type StoryPageType = 'cover' | 'info' | 'myth' | 'didYouKnow' | 'quiz' | 'action' | 'doctor' | 'summary';

export interface StoryPage {
  type?: StoryPageType;
  icon?: IconName;
  /** `info`: up to two small supporting icons next to the big one. */
  support?: IconName[];
  title?: string;
  text?: string;
  /** `myth`: the common belief and the fact on the back of the card. */
  myth?: string;
  fact?: string;
  quiz?: { question: string; options: string[]; correct: number; explain: string };
  /** `action`: an in-app screen the button opens. Without it the slide is text only. */
  action?: { route: string; label: string };
  /** `doctor` and `summary`: the bullet points. */
  items?: string[];
  /** Legacy slides only. */
  didYouKnow?: string;
  tone?: ModuleTone;
  /** Background photo id in `src/content/images.ts` (SPEC_GORSELLER_V5 §6), e.g. "story/pf-basics/2". */
  image?: string;
  /** Turkish description of that photo for screen readers. */
  imageAlt?: string;
}

export interface Story {
  id: string;
  title: string;
  category: StoryCategory;
  icon: IconName;
  tone?: ModuleTone;
  minutes: number;
  slides: StoryPage[];
  sources: { title: string; url: string }[];
  reviewed: boolean;
  /** Cover photo id when it isn't `story/<id>` (women-only stories, covers that show a man for women). */
  cover?: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain?: string;
}

export interface Lesson {
  id: string;
  title: string;
  slides: StorySlide[];
  quiz: QuizQuestion[];
  sources: { title: string; url: string }[];
  reviewed: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  lessons: Lesson[];
  reviewed: boolean;
}

/** "Neden, Nedir ve Ne Demek?" entry: an app concept or a sexual-health topic. */
export interface GlossaryTerm {
  id: string;
  icon: IconName;
  title: string;
  summary: string;
  /** Keşfet compact card (SPEC_KESFET_V2 §4.5), at most 60 characters. */
  shortSummary?: string;
  sections: { title: string; text: string }[];
  reviewed: boolean;
  /** Photo id when it isn't `glossary/<id>` (women-only terms, photos that show a man for women). */
  image?: string;
}

export interface Challenge {
  id: string;
  category: ChallengeCategory;
  icon: IconName;
  text: string;
  /** Short, honest explanation of the evidence behind the task. */
  why: string;
  source: { title: string; url: string };
}

/**
 * Women's profile (2026-11-25): photos of a man are swapped for a neutral one (first from the same
 * story, otherwise from a fixed pool), so a woman doesn't see male figures in her stories.
 */
const MAN = /\badam\b/i;
const showsMan = (id: string | undefined) => !!id && MAN.test(appImage(id)?.alt ?? '');
const NEUTRAL_POOL = ['story/pf-basics/2', 'story/mindfulness/2', 'story/water/3', 'story/sleep-routine/6', 'story/intimacy-beyond/3', 'story/smoking/6', 'story/sleep-hormones/5', 'story/plate/2'];
function womenPhotos(stories: Story[]): Story[] {
  // The language's own description of each photo, from wherever a slide uses it.
  const altOf = new Map<string, string>();
  for (const st of stories) for (const pg of st.slides) if (pg.image && pg.imageAlt) altOf.set(pg.image, pg.imageAlt);
  return stories.map((st, n) => {
    const own = st.slides.map((pg) => pg.image).filter((id): id is string => !!id && !showsMan(id));
    let k = n;
    const pickNeutral = () => own[k++ % Math.max(1, own.length)] ?? NEUTRAL_POOL[k++ % NEUTRAL_POOL.length]!;
    const slides = st.slides.map((pg) => {
      if (!showsMan(pg.image)) return pg;
      const image = pickNeutral();
      return { ...pg, image, imageAlt: altOf.get(image) ?? pg.imageAlt };
    });
    const coverId = st.cover ?? `story/${st.id}`;
    const cover = showsMan(coverId) || !appImage(coverId) ? (own[0] ?? NEUTRAL_POOL[n % NEUTRAL_POOL.length]) : st.cover;
    return { ...st, slides, ...(cover ? { cover } : {}) };
  });
}

const STORIES_FEMALE = womenPhotos(femaleList(storiesJson as Story[], pick({ tr: storiesFemaleTr, en: storiesFemaleEn }) as never));
export const STORIES = sexVariants(storiesJson as Story[], STORIES_FEMALE);
/** The story's cover photo id. */
export const storyCoverId = (s: Story) => s.cover ?? `story/${s.id}`;
export const CHALLENGES = bySex(challengesJson.items as Challenge[], pick({ tr: challengesFemaleTr, en: challengesFemaleEn }).items);
/** Nutrition plan: for each day of the cycle, the ids of its 3 tasks. */
export const NUTRITION_PLAN = challengesJson.plan as string[][];
export const NUTRITION_DAYS = challengesJson.days;
const GLOSSARY_FEMALE = femaleList(glossaryJson as GlossaryTerm[], pick({ tr: glossaryFemaleTr, en: glossaryFemaleEn }) as never).map((g, n) =>
  showsMan(g.image ?? `glossary/${g.id}`) ? { ...g, image: NEUTRAL_POOL[n % NEUTRAL_POOL.length] } : g,
);
export const GLOSSARY = sexVariants(glossaryJson as GlossaryTerm[], GLOSSARY_FEMALE);
/** The glossary term's photo id. */
export const glossaryImageId = (g: Pick<GlossaryTerm, 'id' | 'image'>) => g.image ?? `glossary/${g.id}`;
