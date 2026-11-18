import json from '@/content/masturbation.tr.json';

export interface McOption {
  id: string;
  emoji: string;
  label: string;
}

export interface McTrigger extends McOption {
  /** "If-then" coping plan shown for this trigger. */
  plan: string;
}

export interface McStep {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  sections: { title: string; text: string }[];
  actions: string[];
}

export interface McUrgeAction {
  id: string;
  emoji: string;
  title: string;
  minutes: number;
  steps: string[];
}

export interface McCheckBand {
  id: 'low' | 'some' | 'high';
  /** Highest score that falls in this band. */
  max: number;
  title: string;
  text: string;
}

export interface McContent {
  id: string;
  title: string;
  emoji: string;
  description: string;
  reviewed: boolean;
  check: {
    questions: { id: string; text: string }[];
    values: { id: string; text: string };
    bands: McCheckBand[];
    valuesNote: string;
    disclaimer: string;
  };
  reasons: McOption[];
  triggers: McTrigger[];
  env: { id: string; text: string; detail: string }[];
  paths: Record<'control' | 'quit', { emoji: string; title: string; text: string; points: string[] }>;
  /** Control path: current weekly frequency → weekly allowance. */
  baselines: { id: string; label: string; hint: string; limit: number }[];
  harms: { intro: string; items: { id: string; emoji: string; title: string; text: string }[]; note: string };
  quitGoals: number[];
  urge: { actions: McUrgeAction[]; tips: string[] };
  lapse: string[];
  facts: { id: string; myth: string; fact: string }[];
  help: { id: string; title: string; text: string; phone: string | null }[];
  steps: McStep[];
  sources: { title: string; url: string }[];
}

export const MC = json as McContent;
