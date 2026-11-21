import type { ModuleTone } from '@/config/theme';
import type { IconName } from '@/components/Icon';
import challengesJson from '@/content/challenges.tr.json';
import coursesJson from '@/content/courses.tr.json';
import glossaryJson from '@/content/glossary.tr.json';
import storiesJson from '@/content/stories.tr.json';
import type { ChallengeCategory } from '@/types';

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

export const STORIES = storiesJson as Story[];
export const COURSES = coursesJson as Course[];
export const CHALLENGES = challengesJson.items as Challenge[];
/** Nutrition plan: for each day of the cycle, the ids of its 3 tasks. */
export const NUTRITION_PLAN = challengesJson.plan as string[][];
export const NUTRITION_DAYS = challengesJson.days;
export const GLOSSARY = glossaryJson as GlossaryTerm[];
