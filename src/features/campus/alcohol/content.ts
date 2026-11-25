import type { IconName } from '@/components/Icon';
import { pick } from '@/i18n/content';
import jsonTr from '@/content/alcohol.tr.json';
import jsonEn from '@/content/alcohol.en.json';
import femaleTr from '@/content/alcohol.female.tr.json';
import femaleEn from '@/content/alcohol.female.en.json';
import { bySex } from '@/i18n/sex';

const json = pick({ tr: jsonTr, en: jsonEn });

export interface AlcDrinkType {
  id: string;
  icon: IconName;
  title: string;
  detail: string;
  /** Standard drinks (10 g of pure alcohol) in one serving. */
  std: number;
}

export interface AlcStep {
  id: string;
  icon: IconName;
  title: string;
  summary: string;
  sections: { title: string; text: string }[];
  actions: string[];
}

export interface AlcContent {
  id: string;
  title: string;
  icon: IconName;
  description: string;
  reviewed: boolean;
  drinks: AlcDrinkType[];
  audit: {
    /** Each option carries its official AUDIT-C score (0–4). */
    questions: { id: string; text: string; options: { text: string; score: number }[] }[];
    standardNote: string;
    bands: { id: 'low' | 'risky' | 'high'; max: number; title: string; text: string }[];
    disclaimer: string;
  };
  withdrawal: { questions: { id: string; text: string }[]; riskTitle: string; riskText: string; okText: string; emergency: string };
  paths: Record<'cut' | 'quit', { icon: IconName; title: string; text: string; points: string[] }>;
  cutLimits: number[];
  dailyMax: number;
  freeDaysTarget: number;
  quitGoals: number[];
  reasons: { id: string; icon: IconName; label: string }[];
  triggers: { id: string; icon: IconName; label: string; plan: string }[];
  tips: { id: string; icon: IconName; title: string; text: string }[];
  /** Plain explanations shown behind 'what does this mean?' toggles. */
  info: Record<'std' | 'audit' | 'statsCut' | 'statsQuit', { title: string; text: string }>;
  sexual: { id: string; title: string; text: string }[];
  help: { id: string; title: string; text: string; phone: string | null }[];
  steps: AlcStep[];
  sources: { title: string; url: string }[];
}

/** Women: AUDIT-C cut-off 3 (men 4) and female texts on sexual health (src/i18n/sex.ts). */
export const ALC = bySex(json as AlcContent, pick({ tr: femaleTr, en: femaleEn }));
