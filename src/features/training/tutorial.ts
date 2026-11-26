import type { GeneratedSession, Phase, SessionBlock } from './types';

/** Tutorial v2 (SPEC_KEGEL_V2 §12): steps and the release practice. Pure. */

export type TutorialStep = 'what' | 'find' | 'anatomy' | 'position' | 'technique' | 'checklist' | 'trial' | 'check' | 'tips' | 'release' | 'releaseCheck' | 'releaseTips' | 'mistakes' | 'ready';

/**
 * Main path (tips steps branch off it). `anatomy` is the "Pelvik taban kasın nerede?" animation
 * (SPEC_ANIMASYON_PELVIK), right after "Kası nasıl bulursun?"; it cannot be skipped the first time.
 */
export const TUTORIAL_ORDER: TutorialStep[] = ['what', 'find', 'anatomy', 'position', 'technique', 'checklist', 'trial', 'check', 'release', 'releaseCheck', 'mistakes', 'ready'];

/** "Am I doing it right?" — every item needs a "yes" (§12.3). */
export const CHECKLIST = ['glutes', 'belly', 'breath', 'legs'] as const;
export const checklistDone = (checked: readonly string[]) => CHECKLIST.every((c) => checked.includes(c));

/** Practice set 2 (§12.5; shown as "2. deneme seti" since 2026-11-25): 2 × (squeeze 3 s → relax fully 6 s). */
export function generateReleasePractice(): GeneratedSession {
  const block: SessionBlock = { type: 'slow_hold', position: 'lying', holdSec: 3, restSec: 4, reps: 2, cueSet: ['rel_ground'], role: 'main' };
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
    round: 1,
    blocks: [block],
    exercises: [{ type: 'slow_hold', reps: 2, sets: 1, contractSec: 3, relaxSec: 6 }],
    phases,
    plannedSec: 21,
    contractions: 2,
  };
}
