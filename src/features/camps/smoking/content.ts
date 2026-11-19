import checkinJson from '@/content/camp/checkin.tr.json';
import coachJson from '@/content/camp/coach.tr.json';
import healthJson from '@/content/camp/health-timeline.tr.json';
import libraryJson from '@/content/camp/library.tr.json';
import skillsJson from '@/content/camp/skills.tr.json';
import type { StorySlide } from '@/features/content/data';
import missionsJson from '@/content/camp/missions.tr.json';
import onboardingJson from '@/content/camp/onboarding.tr.json';
import plansJson from '@/content/camp/plans.tr.json';
import rewardsJson from '@/content/camp/rewards.tr.json';
import sosJson from '@/content/camp/sos.tr.json';
import supportJson from '@/content/camp/support.tr.json';
import sourcesJson from '@/content/camp/sources.json';

import type { CoachScenario } from './engine/coach';
import type { MilestoneId } from './engine/milestones';
import type { AgeRange, CampPhase, FirstCigMinutes, HsiLevel, Mission, ProductType, QuitMethod, ReasonId, RelapseCause, Score5, SymptomId, TriggerId } from './types';

export interface CampSource {
  id: string;
  title: string;
  org: string;
  year: number;
  url: string;
  accessed: string;
}

interface Opt<T extends string> {
  id: T;
  emoji: string;
  label: string;
}

export interface CampOnboardingContent {
  reviewed: boolean;
  sourceIds: string[];
  products: Opt<ProductType>[];
  firstCig: { value: FirstCigMinutes; label: string }[];
  hsiBands: Record<HsiLevel, { title: string; text: string }>;
  hsiInfo: string;
  medication: string;
  under18: string;
  reasons: Opt<ReasonId>[];
  triggers: Opt<TriggerId>[];
  pastAttempts: { value: 0 | 1 | 3; label: string }[];
  relapseCauses: Opt<RelapseCause>[];
  relapseNote: string;
  methods: { id: QuitMethod; emoji: string; label: string; desc: string; recommended?: boolean }[];
  ageRanges: { id: AgeRange; label: string }[];
  alo171: { title: string; text: string; save: string; lastVerified: string };
  phases: { id: CampPhase; emoji: string; title: string; text: string }[];
}

export interface CampPlansContent {
  reviewed: boolean;
  sourceIds: string[];
  info: string;
  templates: Record<TriggerId, { if: string; then: string[] }>;
}

export interface CampHealthContent {
  reviewed: boolean;
  sourceIds: string[];
  intro: string;
  note: string;
  items: { id: MilestoneId; label: string; emoji: string; text: string }[];
}

export interface CampSosContent {
  reviewed: boolean;
  sourceIds: string[];
  intro: string;
  intensityLabels: { low: string; high: string };
  surf: { title: string; desc: string; prompts: string[]; done: string };
  breath: { title: string; desc: string };
  delay: { title: string; desc: string; ideas: string[]; done: string };
  fourE: { title: string; desc: string; items: { letter: string; title: string; text: string }[] };
  reasons: { title: string; desc: string; empty: string };
  game: { title: string; desc: string; seconds: number };
  alo: string;
  end: { question: string; resisted: string; hard: string; smoked: string; resistedTitle: string; resistedBody: string; hardBody: string; smokedTitle: string; smokedBody: string };
}

export interface CampCheckinContent {
  reviewed: boolean;
  sourceIds: string[];
  symptoms: { id: SymptomId; emoji: string; label: string; tip: string; eases: string }[];
  moods: { v: Score5; emoji: string; label: string }[];
  safety: { title: string; text: string };
  slip: { welcomeTitle: string; welcome: string; howMany: string; what: string; feeling: string; next: string; nextHint: string; doneTitle: string; done: string; relapseLink: string };
  relapse: { title: string; intro: string; learned: string; plan: string; planHint: string; confirm: string };
}

export interface CampMissionsContent {
  reviewed: boolean;
  sourceIds: string[];
  missions: Mission[];
  quitDay: { title: string; intro: string; rule: string; ruleText: string; checklist: { id: string; text: string }[]; after: string };
}

export interface CampLesson {
  id: string;
  order: number;
  emoji: string;
  title: string;
  summary: string;
  minutes: number;
  /** Earlier relapse causes (assessment) that bring this lesson forward. */
  relapse: RelapseCause[];
  bonus: boolean;
  sourceIds: string[];
  slides: StorySlide[];
  practice: { title: string; text: string };
  quiz: { q: string; options: string[]; answer: number; explain: string }[];
}

export interface CampStory {
  id: string;
  emoji: string;
  title: string;
  minutes: number;
  sourceIds: string[];
  slides: StorySlide[];
}

export interface CampSupportContent {
  reviewed: boolean;
  sourceIds: string[];
  lastVerified: string;
  alo171: { title: string; number: string; hours: string; cost: string; offers: string[] };
  clinics: { title: string; text: string };
  yesilay: { title: string; number: string; text: string };
  emergency: { title: string; text: string };
  supporter: { intro: string; messages: { id: string; label: string; text: string }[] };
  doctor: { intro: string; note: string };
}

export interface CampRewardsContent {
  reviewed: boolean;
  sourceIds: string[];
  badges: { id: string; emoji: string; title: string; desc: string }[];
  jar: { intro: string; examples: string[] };
  graduation: { title: string; text: string; certTitle: string; certLine: string; after: string };
}

export const CAMP_SOURCES = sourcesJson as CampSource[];
export const CAMP_REWARDS = rewardsJson as CampRewardsContent;
export const CAMP_SUPPORT = supportJson as CampSupportContent;
export const CAMP_COACH = coachJson as unknown as { reviewed: boolean; sourceIds: string[]; disclaimer: string; scenarios: CoachScenario[] };
export const CAMP_SKILLS = skillsJson as { reviewed: boolean; sourceIds: string[]; lessons: CampLesson[] };
export const CAMP_LIBRARY = libraryJson as { reviewed: boolean; sourceIds: string[]; stories: CampStory[] };
export const campSources = (ids: string[]) => CAMP_SOURCES.filter((s) => ids.includes(s.id));
export const CAMP_MISSIONS = missionsJson as CampMissionsContent;
export const CAMP_CHECKIN = checkinJson as CampCheckinContent;
export const CAMP_SOS = sosJson as CampSosContent;
export const CAMP_HEALTH = healthJson as CampHealthContent;
export const CAMP_ONBOARDING = onboardingJson as CampOnboardingContent;
export const CAMP_PLANS = plansJson as CampPlansContent;

/** Programme identity (title shown on the Keşfet card and headers comes from i18n). */
export const CAMP_EMOJI = '🫁';
export const CAMP_DAYS = 90;
