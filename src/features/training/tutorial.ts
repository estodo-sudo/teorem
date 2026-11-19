import { createRng, shuffle } from '@/lib/random';

import type { Cue } from './hapticPatterns';
import type { GeneratedSession, Phase, SessionBlock } from './types';

/** Tutorial v2 (SPEC_KEGEL_V2 §12): steps, the vibration matching game and the release practice. Pure. */

export type TutorialStep = 'what' | 'find' | 'position' | 'technique' | 'checklist' | 'vibration' | 'trial' | 'check' | 'tips' | 'release' | 'releaseCheck' | 'releaseTips' | 'mistakes' | 'ready';

/** Main path (tips steps branch off it). */
export const TUTORIAL_ORDER: TutorialStep[] = ['what', 'find', 'position', 'technique', 'checklist', 'vibration', 'trial', 'check', 'release', 'releaseCheck', 'mistakes', 'ready'];

/** "Am I doing it right?" — every item needs a "yes" (§12.3). */
export const CHECKLIST = ['glutes', 'belly', 'breath', 'legs'] as const;
export const checklistDone = (checked: readonly string[]) => CHECKLIST.every((c) => checked.includes(c));

export type QuizAnswer = 'squeeze' | 'release';
export interface QuizItem {
  cue: Cue;
  answer: QuizAnswer;
}

/** "What does this vibration mean? SIK / BIRAK" — 4 questions, 2 of each, shuffled (§12.4). */
export function vibrationQuiz(seed: string): QuizItem[] {
  const items: QuizItem[] = [
    { cue: 'squeezeStart', answer: 'squeeze' },
    { cue: 'squeezeStart', answer: 'squeeze' },
    { cue: 'releaseStart', answer: 'release' },
    { cue: 'releaseStart', answer: 'release' },
  ];
  return shuffle(createRng(`quiz|${seed}`), items);
}

/** All correct → go on; any miss → try again. */
export const quizPassed = (quiz: QuizItem[], answers: (QuizAnswer | null)[]) => quiz.length > 0 && quiz.every((q, i) => answers[i] === q.answer);

/** Release practice (§12.5): 2 × (squeeze 3 s → release fully 6 s). */
export function generateReleasePractice(): GeneratedSession {
  const block: SessionBlock = { type: 'slow_hold', position: 'lying', holdSec: 3, restSec: 6, reps: 2, cueSet: ['rel_ground', 'rel_shoulders'], role: 'main' };
  const phases: Phase[] = [{ kind: 'countdown', durationMs: 3000, exerciseIndex: -1, rep: 0, reps: 0, set: 1, sets: 1 }];
  for (let r = 1; r <= 2; r++) {
    const base = { exerciseIndex: 0, rep: r, reps: 2, set: 1, sets: 1 };
    phases.push({ kind: 'contract', durationMs: 3000, ...base }, { kind: 'relax', durationMs: 6000, ...base });
  }
  return {
    id: 'release-practice',
    seed: 'release-practice',
    level: 1,
    dayIndex: 0,
    weekIndex: 0,
    track: 'general',
    durationPreset: 'quick',
    deload: false,
    isMicro: true,
    blocks: [block],
    exercises: [{ type: 'slow_hold', reps: 2, sets: 1, contractSec: 3, relaxSec: 6 }],
    phases,
    plannedSec: 21,
    contractions: 2,
  };
}
