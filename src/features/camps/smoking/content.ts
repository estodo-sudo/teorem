import type { IconName } from '@/components/Icon';
import { pick } from '@/i18n/content';
import checkinJsonTr from '@/content/camp/checkin.tr.json';
import checkinJsonEn from '@/content/camp/checkin.en.json';
import healthJsonTr from '@/content/camp/health-timeline.tr.json';
import healthJsonEn from '@/content/camp/health-timeline.en.json';
import libraryJsonTr from '@/content/camp/library.tr.json';
import libraryJsonEn from '@/content/camp/library.en.json';
import skillsJsonTr from '@/content/camp/skills.tr.json';
import skillsJsonEn from '@/content/camp/skills.en.json';
import skillsFemaleTr from '@/content/camp/skills.female.tr.json';
import skillsFemaleEn from '@/content/camp/skills.female.en.json';
import { bySex } from '@/i18n/sex';
import type { StorySlide } from '@/features/content/data';
import missionsJsonTr from '@/content/camp/missions.tr.json';
import missionsJsonEn from '@/content/camp/missions.en.json';
import onboardingJsonTr from '@/content/camp/onboarding.tr.json';
import onboardingJsonEn from '@/content/camp/onboarding.en.json';
import plansJsonTr from '@/content/camp/plans.tr.json';
import plansJsonEn from '@/content/camp/plans.en.json';
import rewardsJsonTr from '@/content/camp/rewards.tr.json';
import rewardsJsonEn from '@/content/camp/rewards.en.json';
import sosJsonTr from '@/content/camp/sos.tr.json';
import sosJsonEn from '@/content/camp/sos.en.json';
import supportJsonTr from '@/content/camp/support.tr.json';
import supportJsonEn from '@/content/camp/support.en.json';
import sourcesJson from '@/content/camp/sources.json';

import type { MilestoneId } from './engine/milestones';
import type { AgeRange, CampPhase, FirstCigMinutes, HsiLevel, Mission, ProductType, QuitMethod, ReasonId, RelapseCause, Score5, SymptomId, TriggerId } from './types';

const checkinJson = pick({ tr: checkinJsonTr, en: checkinJsonEn });
const healthJson = pick({ tr: healthJsonTr, en: healthJsonEn });
const libraryJson = pick({ tr: libraryJsonTr, en: libraryJsonEn });
const skillsJson = pick({ tr: skillsJsonTr, en: skillsJsonEn });
const missionsJson = pick({ tr: missionsJsonTr, en: missionsJsonEn });
const onboardingJson = pick({ tr: onboardingJsonTr, en: onboardingJsonEn });
const plansJson = pick({ tr: plansJsonTr, en: plansJsonEn });
const rewardsJson = pick({ tr: rewardsJsonTr, en: rewardsJsonEn });
const sosJson = pick({ tr: sosJsonTr, en: sosJsonEn });
const supportJson = pick({ tr: supportJsonTr, en: supportJsonEn });

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
  icon: IconName;
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
  methods: { id: QuitMethod; icon: IconName; label: string; desc: string; recommended?: boolean }[];
  ageRanges: { id: AgeRange; label: string }[];
  alo171: { title: string; text: string; save: string; lastVerified: string };
  phases: { id: CampPhase; icon: IconName; title: string; text: string }[];
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
  items: { id: MilestoneId; label: string; icon: IconName; text: string }[];
}

export interface CampSosContent {
  reviewed: boolean;
  sourceIds: string[];
  intro: string;
  intensityLabels: { low: string; high: string };
  breath: { title: string; desc: string };
  delay: { title: string; desc: string; ideas: string[]; done: string };
  reasons: { title: string; desc: string; empty: string };
  puzzle: { title: string; desc: string; srHint: string };
  alo: string;
  end: { question: string; resisted: string; hard: string; smoked: string; resistedTitle: string; resistedBody: string; hardBody: string; smokedTitle: string; smokedBody: string };
}

export interface CampCheckinContent {
  reviewed: boolean;
  sourceIds: string[];
  symptoms: { id: SymptomId; icon: IconName; label: string; tip: string; eases: string }[];
  moods: { v: Score5; icon: IconName; label: string }[];
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
  icon: IconName;
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
  icon: IconName;
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
  badges: { id: string; icon: IconName; title: string; desc: string }[];
  jar: { intro: string; examples: string[] };
  graduation: { title: string; text: string; certTitle: string; certLine: string; after: string };
}

export const CAMP_SOURCES = sourcesJson as CampSource[];
export const CAMP_REWARDS = rewardsJson as CampRewardsContent;
export const CAMP_SUPPORT = supportJson as CampSupportContent;
export const CAMP_SKILLS = bySex(skillsJson as { reviewed: boolean; sourceIds: string[]; lessons: CampLesson[] }, pick({ tr: skillsFemaleTr, en: skillsFemaleEn }));
export const CAMP_LIBRARY = libraryJson as { reviewed: boolean; sourceIds: string[]; stories: CampStory[] };
export const campSources = (ids: string[]) => CAMP_SOURCES.filter((s) => ids.includes(s.id));
export const CAMP_MISSIONS = missionsJson as CampMissionsContent;
export const CAMP_CHECKIN = checkinJson as CampCheckinContent;
export const CAMP_SOS = sosJson as CampSosContent;
export const CAMP_HEALTH = healthJson as CampHealthContent;
export const CAMP_ONBOARDING = onboardingJson as CampOnboardingContent;
export const CAMP_PLANS = plansJson as CampPlansContent;

/** Programme identity (title shown on the Keşfet card and headers comes from i18n). */
export const CAMP_ICON = 'wind';
export const CAMP_DAYS = 90;
