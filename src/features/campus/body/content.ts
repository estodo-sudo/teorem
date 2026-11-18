import feetJson from '@/content/feet.tr.json';
import neckJson from '@/content/neck.tr.json';

import type { BodyExercise, BodyId } from './logic';

export interface BodyOption {
  id: string;
  label: string;
  /** Footprint options: what the print looks like, and the share of the midfoot that touches the ground. */
  desc?: string;
  mid?: number;
}

export interface BodyStep {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  sections: { title: string; text: string }[];
  actions: string[];
}

export interface BodyContent {
  id: BodyId;
  title: string;
  emoji: string;
  description: string;
  reviewed: boolean;
  /** Programme length and sessions per week. */
  weeks: number;
  weeklyTarget: number;
  redFlags: {
    intro: string;
    questions: { id: string; text: string }[];
    title: string;
    text: string;
    ok: string;
  };
  selfTest: {
    questions: { id: string; text: string; options: BodyOption[] }[];
    /** Neck: modelled load on the neck by head angle. */
    loads?: { deg: number; kg: number; label: string }[];
    loadNote?: string;
    /** Feet: what the tiptoe test means. */
    flexible?: string;
    rigid?: string;
  };
  measure: {
    id: string;
    kind: 'stepper' | 'stopwatch';
    title: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    better: 'lower' | 'higher';
    howTo: string[];
    hint: string;
  };
  exercises: BodyExercise[];
  checklist: { id: string; text: string; detail: string }[];
  facts: { id: string; myth: string; fact: string }[];
  steps: BodyStep[];
  help: { id: string; title: string; text: string }[];
  sources: { title: string; url: string }[];
}

export const NECK = neckJson as BodyContent;
export const FEET = feetJson as BodyContent;
export const BODY: Record<BodyId, BodyContent> = { neck: NECK, feet: FEET };
