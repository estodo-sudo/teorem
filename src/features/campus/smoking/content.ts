import smokingJson from '@/content/smoking.tr.json';

import type { Milestone } from './logic';

export interface SmokingOption {
  id: string;
  emoji: string;
  label: string;
}

export interface SmokingTrigger extends SmokingOption {
  /** "If-then" coping plan shown for this trigger. */
  plan: string;
}

export interface SmokingMilestone extends Milestone {
  label: string;
  text: string;
}

export interface SmokingStep {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  sections: { title: string; text: string }[];
  actions: string[];
}

export interface WithdrawalSymptom {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  duration: string;
  text: string;
  tips: string[];
  /** When to get medical help, if relevant. */
  warning: string | null;
}

export interface SmokingHelp {
  id: string;
  title: string;
  text: string;
  phone: string | null;
}

export interface SmokingCampusContent {
  id: string;
  title: string;
  emoji: string;
  description: string;
  reviewed: boolean;
  reasons: SmokingOption[];
  triggers: SmokingTrigger[];
  prep: { id: string; text: string; detail: string }[];
  milestones: SmokingMilestone[];
  craving: { steps: { id: string; emoji: string; title: string; text: string }[] };
  withdrawal: {
    intro: string;
    /** level: relative intensity 1–3 for the small timeline graphic. */
    timeline: { id: string; label: string; text: string; level: number }[];
    note: string;
    symptoms: WithdrawalSymptom[];
  };
  slip: string[];
  help: SmokingHelp[];
  steps: SmokingStep[];
  sources: { title: string; url: string }[];
}

export const SMOKING = smokingJson as SmokingCampusContent;
