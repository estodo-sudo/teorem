import type { IconName } from '@/components/Icon';
import { pick } from '@/i18n/content';
import badgesJsonTr from '@/content/camps/odak/badges.tr.json';
import badgesJsonEn from '@/content/camps/odak/badges.en.json';
import boundariesJsonTr from '@/content/camps/odak/boundaries.tr.json';
import boundariesJsonEn from '@/content/camps/odak/boundaries.en.json';
import checkinJsonTr from '@/content/camps/odak/checkin.tr.json';
import checkinJsonEn from '@/content/camps/odak/checkin.en.json';
import diaryJsonTr from '@/content/camps/odak/diary.tr.json';
import diaryJsonEn from '@/content/camps/odak/diary.en.json';
import onboardingJsonTr from '@/content/camps/odak/onboarding.tr.json';
import onboardingJsonEn from '@/content/camps/odak/onboarding.en.json';
import panelJsonTr from '@/content/camps/odak/panel.tr.json';
import panelJsonEn from '@/content/camps/odak/panel.en.json';
import libraryJsonTr from '@/content/camps/odak/library.tr.json';
import libraryJsonEn from '@/content/camps/odak/library.en.json';
import methodJsonTr from '@/content/camps/odak/method.tr.json';
import methodJsonEn from '@/content/camps/odak/method.en.json';
import missionsJsonTr from '@/content/camps/odak/missions.tr.json';
import missionsJsonEn from '@/content/camps/odak/missions.en.json';
import plansJsonTr from '@/content/camps/odak/plans.tr.json';
import plansJsonEn from '@/content/camps/odak/plans.en.json';
import rebuildJsonTr from '@/content/camps/odak/rebuild.tr.json';
import rebuildJsonEn from '@/content/camps/odak/rebuild.en.json';
import referralJsonTr from '@/content/camps/odak/referral.tr.json';
import referralJsonEn from '@/content/camps/odak/referral.en.json';
import relapseJsonTr from '@/content/camps/odak/relapse.tr.json';
import relapseJsonEn from '@/content/camps/odak/relapse.en.json';
import skillsJsonTr from '@/content/camps/odak/skills.tr.json';
import skillsJsonEn from '@/content/camps/odak/skills.en.json';
import slipJsonTr from '@/content/camps/odak/slip.tr.json';
import slipJsonEn from '@/content/camps/odak/slip.en.json';
import statsJsonTr from '@/content/camps/odak/stats.tr.json';
import statsJsonEn from '@/content/camps/odak/stats.en.json';
import summaryJsonTr from '@/content/camps/odak/summary.tr.json';
import summaryJsonEn from '@/content/camps/odak/summary.en.json';
import supportJsonTr from '@/content/camps/odak/support.tr.json';
import supportJsonEn from '@/content/camps/odak/support.en.json';
import sosJsonTr from '@/content/camps/odak/sos.tr.json';
import sosJsonEn from '@/content/camps/odak/sos.en.json';
import sourcesJson from '@/content/camps/odak/sources.json';


import type { OdakLesson, OdakMission } from './engine/program';
import type { OdakTriggerId } from './types';

const badgesJson = pick({ tr: badgesJsonTr, en: badgesJsonEn });
const boundariesJson = pick({ tr: boundariesJsonTr, en: boundariesJsonEn });
const checkinJson = pick({ tr: checkinJsonTr, en: checkinJsonEn });
const diaryJson = pick({ tr: diaryJsonTr, en: diaryJsonEn });
const onboardingJson = pick({ tr: onboardingJsonTr, en: onboardingJsonEn });
const panelJson = pick({ tr: panelJsonTr, en: panelJsonEn });
const libraryJson = pick({ tr: libraryJsonTr, en: libraryJsonEn });
const methodJson = pick({ tr: methodJsonTr, en: methodJsonEn });
const missionsJson = pick({ tr: missionsJsonTr, en: missionsJsonEn });
const plansJson = pick({ tr: plansJsonTr, en: plansJsonEn });
const rebuildJson = pick({ tr: rebuildJsonTr, en: rebuildJsonEn });
const referralJson = pick({ tr: referralJsonTr, en: referralJsonEn });
const relapseJson = pick({ tr: relapseJsonTr, en: relapseJsonEn });
const skillsJson = pick({ tr: skillsJsonTr, en: skillsJsonEn });
const slipJson = pick({ tr: slipJsonTr, en: slipJsonEn });
const statsJson = pick({ tr: statsJsonTr, en: statsJsonEn });
const summaryJson = pick({ tr: summaryJsonTr, en: summaryJsonEn });
const supportJson = pick({ tr: supportJsonTr, en: supportJsonEn });
const sosJson = pick({ tr: sosJsonTr, en: sosJsonEn });

type Option = { id: string; icon: IconName; label: string };
type Scored = { value: number; label: string };

export interface OdakSource {
  id: string;
  title: string;
  org: string;
  year: number;
  url: string;
  accessed: string;
}

export interface OdakOnboardingContent {
  reviewed: boolean;
  evidenceLevel: string;
  sourceIds: string[];
  age: { title: string; hint: string; adult: string; minor: string };
  under18: { title: string; body: string[]; help: { id: string; icon: IconName; title: string; text: string; phone?: string; lastVerified?: string; needsVerification?: boolean }[]; emergency: string };
  facts: { title: string; items: { icon: IconName; text: string }[] };
  lock: { title: string; body: string };
  reasons: { title: string; hint: string; options: Option[]; otherPlaceholder: string };
  bps: { title: string; hint: string; placeholder: boolean; placeholderNote: string; items: string[]; options: Scored[]; threshold: number; resultHigh: string; resultLow: string; nonJudge: string };
  freq: { title: string; hint: string; porn: string; mast: string; unit: string };
  triggers: { title: string; hint: string; options: (Option & { id: OdakTriggerId })[] };
  emotions: { title: string; hint: string; beforeTitle: string; afterTitle: string; before: Option[]; after: Option[] };
  values: { title: string; hint: string; cards: Option[]; textPlaceholder: string };
  moral: { title: string; statement: string; scale: string[]; note: string };
  mood: { title: string; hint: string; phq: string[]; gad: string[]; options: Scored[]; threshold: number; resultHigh: string; resultLow: string };
  attempts: { title: string; hint: string; options: Option[]; note: string };
  goal: {
    title: string;
    hint: string;
    porn: { title: string; options: Option[] };
    mast: { title: string; options: Option[] };
    weeklyMax: string;
    weeklyUnit: string;
    pauseTitle: string;
    pauseUnit: string;
    note: string;
    undecidedNote: string;
  };
  risky: { title: string; hint: string; ranges: { id: string; label: string; from: string; to: string }[] };
  plans: { title: string; hint: string; if: string; then: string; empty: string };
  expert: { title: string; body: string; phone: string; phoneLabel: string; lastVerified: string; needsVerification: boolean; emergency: string };
  summary: {
    title: string;
    goalsTitle: string;
    valuesTitle: string;
    plansTitle: string;
    boundariesTitle: string;
    boundaries: string[];
    boundariesNote: string;
    programTitle: string;
    programIntro: string;
    phases: { icon: IconName; name: string; days: string; focus: string }[];
    goalLabels: { porn: Record<string, string>; mast: Record<string, string> };
    bpsAgain: string;
  };
}

export interface OdakPlansContent {
  reviewed: boolean;
  evidenceLevel: string;
  sourceIds: string[];
  templates: Record<OdakTriggerId, { if: string; then: string[] }>;
}

export interface OdakPanelContent {
  reviewed: boolean;
  evidenceLevel: string;
  sourceIds: string[];
  targets: { porn: string; mast: string };
  counter: { quit: string; zero: string; pause: string; pauseDone: string; reduce: string; reduceOver: string; detail: string };
  undecided: { title: string; body: string };
  value: { title: string; own: string };
  log: { title: string; hint: string; options: Option[]; saved: string; slipTitle: string; slipBody: string; kept: string };
  sosStub: { title: string };
}

/** Fills {name} placeholders of content strings. */
export const fill = (text: string, vars: Record<string, string | number | undefined>) => text.replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] === undefined ? m : String(vars[k])));

export interface OdakSosContent {
  reviewed: boolean;
  evidenceLevel: string;
  sourceIds: string[];
  check: { title: string; hint: string; items: { id: 'tired' | 'hungry' | 'lonely' | 'loaded'; letter: string; icon: IconName; label: string; tip: string }[]; intensity: string; intensityLabels: { low: string; high: string } };
  relocate: { title: string; lead: string; seconds: number; steps: string[]; start: string; done: string };
  tools: { title: string; hint: string; other: string; items: { id: string; icon: IconName; title: string; desc: string }[] };
  /** "Yapabileceklerin" (2026-11-23): simple steps anyone can take, ticked as done. */
  actions: { title: string; lead: string; note: string; doneCount: string; items: { id: string; icon: IconName; title: string; text: string }[] };
  breath: { desc: string };
  puzzle: { desc: string; srHint: string };
  move: { desc: string; seconds: number; steps: string[]; start: string; done: string };
  values: { desc: string; empty: string };
  futureSelf: { desc: string; placeholder: string; save: string; edit: string; saved: string };
  supporter: { desc: string; message: string; share: string };
  end: { question: string; managed: string; hard: string; slipped: string; managedTitle: string; managedBody: string; hardBody: string; slippedTitle: string; slippedBody: string; count: string; logSlip: string; back: string };
  emergency: string;
}

export interface OdakDiaryContent {
  reviewed: boolean;
  evidenceLevel: string;
  sourceIds: string[];
  title: string;
  intro: string;
  urge: { title: string; hint: string; intensity: string; trigger: string; dayy: string; outcome: string; managed: string; slipped: string; pick: string; saved: string };
  behavior: { title: string; hint: string; kind: string; trigger: string; before: string; after: string; satisfaction: string; satisfactionScale: string[]; save: string };
  week: { title: string; empty: string; counts: string; riskyHour: string; riskyDay: string; topTrigger: string; bestTool: string; emotions: string; satisfaction: string; note: string };
  days: string[];
  list: { title: string; empty: string; urge: string; managed: string; still_hard: string; slipped: string };
}

/** Check-in, slip, relapse and referral texts (shapes inferred from the generated JSON). */
export const ODAK_CHECKIN = checkinJson;
export const ODAK_SLIP = slipJson;
export const ODAK_RELAPSE = relapseJson;
export const ODAK_REFERRAL = referralJson;
export const ODAK_BOUNDARIES = boundariesJson;
export const ODAK_MISSIONS = missionsJson.missions as OdakMission[];
export const ODAK_SKILLS = skillsJson.lessons as OdakLesson[];
export interface OdakStory {
  id: string;
  icon: IconName;
  title: string;
  summary: string;
  slides: { icon: IconName; title: string; text: string }[];
  sourceIds: string[];
  evidenceLevel: string;
  minutes: number;
}
export const ODAK_LIBRARY = libraryJson.stories as OdakStory[];
export const ODAK_REBUILD = rebuildJson;
export const ODAK_SUPPORT = supportJson;
export const ODAK_SUMMARY = summaryJson;
export const ODAK_STATS = statsJson;
export const ODAK_BADGES = badgesJson;
export const ODAK_METHOD = methodJson;

export const ODAK_DIARY = diaryJson as unknown as OdakDiaryContent;
export const ODAK_SOS = sosJson as unknown as OdakSosContent;
export const ODAK_PANEL = panelJson as unknown as OdakPanelContent;
export const ODAK_ONBOARDING = onboardingJson as unknown as OdakOnboardingContent;
export const ODAK_PLANS = plansJson as unknown as OdakPlansContent;
export const ODAK_SOURCES = sourcesJson as OdakSource[];
export const ODAK_ICON = 'target';
export const ODAK_DAYS = 90;

/** Name of an SOS tool for lists and statistics; removed tools show as "Diğer araçlar". */
export const odakToolLabel = (id?: string | null) => (id === 'other' ? ODAK_SOS.tools.other : (ODAK_SOS.tools.items.find((o) => o.id === id)?.title ?? ''));
