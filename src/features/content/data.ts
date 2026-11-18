import challengesJson from '@/content/challenges.tr.json';
import coursesJson from '@/content/courses.tr.json';
import glossaryJson from '@/content/glossary.tr.json';
import storiesJson from '@/content/stories.tr.json';
import type { ChallengeCategory } from '@/types';

export type StoryCategory = 'menHealth' | 'relationships' | 'nutrition' | 'sleep' | 'stress' | 'exercise';

export interface StorySlide {
  title: string;
  text: string;
  emoji: string;
  didYouKnow?: string;
}

export interface Story {
  id: string;
  title: string;
  category: StoryCategory;
  emoji: string;
  minutes: number;
  slides: StorySlide[];
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
  emoji: string;
  lessons: Lesson[];
  reviewed: boolean;
}

/** "Neden, Nedir ve Ne Demek?" entry: an app concept or a sexual-health topic. */
export interface GlossaryTerm {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  sections: { title: string; text: string }[];
  reviewed: boolean;
}

export interface Challenge {
  id: string;
  category: ChallengeCategory;
  emoji: string;
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
