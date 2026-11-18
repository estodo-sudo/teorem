import json from '@/content/porn.tr.json';

export interface PcOption {
  id: string;
  emoji: string;
  label: string;
}

export interface PcStep {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  sections: { title: string; text: string }[];
  actions: string[];
}

export interface PcContent {
  id: string;
  title: string;
  emoji: string;
  description: string;
  reviewed: boolean;
  bps: {
    intro: string;
    questions: { id: string; text: string }[];
    options: { text: string; score: number }[];
    bands: { id: 'low' | 'possible'; max: number; title: string; text: string }[];
    values: string;
    valuesNote: string;
    info: { title: string; text: string };
  };
  goals: number[];
  activityCategories: PcOption[];
  /** Everyday activities offered at urge time; favourites are picked at enrolment. */
  activities: (PcOption & { category: string })[];
  harms: { intro: string; items: { id: string; emoji: string; title: string; text: string }[]; note: string };
  /** ACT values: what each one means, shown when choosing. */
  values: (PcOption & { text: string })[];
  analysis: {
    devices: PcOption[];
    feelings: PcOption[];
    firstSteps: PcOption[];
    /** Keyed "device:<id>", "time:<part>", "feeling:<id>", "first:<id>". */
    recommendations: Record<string, string>;
  };
  stop: { id: string; letter: string; title: string; text: string }[];
  env: { id: string; text: string; detail: string }[];
  facts: { id: string; myth: string; fact: string }[];
  lapseLines: string[];
  help: { id: string; title: string; text: string }[];
  steps: PcStep[];
  sources: { title: string; url: string }[];
}

export const PC = json as PcContent;
