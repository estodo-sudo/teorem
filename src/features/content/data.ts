import challengesJson from '@/content/challenges.tr.json';
import coursesJson from '@/content/courses.tr.json';
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

export interface Challenge {
  id: string;
  category: ChallengeCategory;
  text: string;
}

export const STORIES = storiesJson as Story[];
export const COURSES = coursesJson as Course[];
export const CHALLENGES = challengesJson as Challenge[];
