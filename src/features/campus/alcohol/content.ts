import json from '@/content/alcohol.tr.json';

export interface AlcDrinkType {
  id: string;
  emoji: string;
  title: string;
  detail: string;
  /** Standard drinks (10 g of pure alcohol) in one serving. */
  std: number;
}

export interface AlcStep {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  sections: { title: string; text: string }[];
  actions: string[];
}

export interface AlcContent {
  id: string;
  title: string;
  emoji: string;
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
  paths: Record<'cut' | 'quit', { emoji: string; title: string; text: string; points: string[] }>;
  cutLimits: number[];
  dailyMax: number;
  freeDaysTarget: number;
  quitGoals: number[];
  reasons: { id: string; emoji: string; label: string }[];
  triggers: { id: string; emoji: string; label: string; plan: string }[];
  tips: { id: string; emoji: string; title: string; text: string }[];
  /** Plain explanations shown behind 'what does this mean?' toggles. */
  info: Record<'std' | 'audit' | 'statsCut' | 'statsQuit', { title: string; text: string }>;
  sexual: { id: string; title: string; text: string }[];
  help: { id: string; title: string; text: string; phone: string | null }[];
  steps: AlcStep[];
  sources: { title: string; url: string }[];
}

export const ALC = json as AlcContent;
