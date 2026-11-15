import { createRng, shuffle } from '@/lib/random';

import { ENDURANCE_FROM_LEVEL, clampLevel, getLevel } from './levels';
import type { GeneratedSession, Phase, SessionExercise } from './types';

export const COUNTDOWN_SEC = 3;
export const TRANSITION_SEC = 5;
export const SET_REST_SEC = 10;
export const ELEVATOR_STAGE_SEC = 2;
export const ELEVATOR_RELEASE_STAGE_SEC = 1;
export const PULSE_HALF_SEC = 0.5;
export const COOLDOWN_BREATHS = 4;
export const INHALE_SEC = 4;
export const EXHALE_SEC = 6;

const ms = (s: number) => Math.round(s * 1000);

/**
 * Builds the daily Kegel session. Pure & deterministic: the same
 * (level, dayIndex, seed) always yields the same session.
 *
 * Structure: warm-up (light quick) → hold sets → elevator | pulse (alternating
 * by dayIndex) → endurance (level ≥ 5) → relax cool-down.
 */
export function generateSession(level: number, dayIndex: number, seed: string): GeneratedSession {
  const lvl = clampLevel(level);
  const p = getLevel(lvl);
  const rng = createRng(`${seed}|${lvl}|${dayIndex}`);
  const variant: GeneratedSession['variant'] = dayIndex % 2 === 0 ? 'elevator' : 'pulse';

  const exercises: SessionExercise[] = [];
  const phases: Phase[] = [];

  const push = (ph: Omit<Phase, 'set' | 'sets'> & Partial<Pick<Phase, 'set' | 'sets'>>) =>
    phases.push({ set: 1, sets: 1, ...ph });

  push({ kind: 'countdown', durationMs: ms(COUNTDOWN_SEC), exerciseIndex: -1, rep: 0, reps: 0 });

  const addExercise = (ex: SessionExercise, build: (i: number) => void) => {
    const i = exercises.length;
    if (i > 0) {
      push({
        kind: 'transition',
        durationMs: ms(TRANSITION_SEC),
        exerciseIndex: i,
        rep: 0,
        reps: ex.reps,
        nextType: ex.type,
      });
    }
    exercises.push(ex);
    build(i);
  };

  // 1) Warm-up: gentle quick flicks.
  const warmReps = Math.max(5, Math.round(p.quickReps / 2));
  addExercise({ type: 'quick', reps: warmReps, sets: 1, contractSec: 1, relaxSec: 1 }, (i) => {
    for (let r = 1; r <= warmReps; r++) {
      push({ kind: 'contract', durationMs: ms(1), exerciseIndex: i, rep: r, reps: warmReps });
      push({ kind: 'relax', durationMs: ms(1), exerciseIndex: i, rep: r, reps: warmReps });
    }
  });

  // 2) Main block A: hold sets.
  addExercise(
    { type: 'hold', reps: p.reps, sets: p.setCount, contractSec: p.holdSec, relaxSec: p.relaxSec },
    (i) => {
      for (let s = 1; s <= p.setCount; s++) {
        if (s > 1) {
          push({
            kind: 'rest',
            durationMs: ms(SET_REST_SEC),
            exerciseIndex: i,
            rep: 0,
            reps: p.reps,
            set: s,
            sets: p.setCount,
          });
        }
        for (let r = 1; r <= p.reps; r++) {
          const base = { exerciseIndex: i, rep: r, reps: p.reps, set: s, sets: p.setCount };
          push({ kind: 'contract', durationMs: ms(p.holdSec), ...base });
          push({ kind: 'relax', durationMs: ms(p.relaxSec), ...base });
        }
      }
    },
  );

  // 3) Main block B: elevator or pulse (alternating by day).
  if (variant === 'elevator') {
    const top = Math.min(5, Math.max(2, Math.round(p.holdSec / 2)));
    addExercise(
      {
        type: 'elevator',
        reps: p.elevatorReps,
        sets: 1,
        contractSec: ELEVATOR_STAGE_SEC * 3 + top,
        relaxSec: p.relaxSec,
      },
      (i) => {
        for (let r = 1; r <= p.elevatorReps; r++) {
          const base = { exerciseIndex: i, rep: r, reps: p.elevatorReps };
          push({ kind: 'contract', durationMs: ms(ELEVATOR_STAGE_SEC), stage: 1, ...base });
          push({ kind: 'contract', durationMs: ms(ELEVATOR_STAGE_SEC), stage: 2, ...base });
          // Stage 3 + hold at the top.
          push({ kind: 'contract', durationMs: ms(ELEVATOR_STAGE_SEC + top), stage: 3, ...base });
          push({ kind: 'release', durationMs: ms(ELEVATOR_RELEASE_STAGE_SEC), stage: 2, ...base });
          push({ kind: 'release', durationMs: ms(ELEVATOR_RELEASE_STAGE_SEC), stage: 1, ...base });
          push({ kind: 'relax', durationMs: ms(p.relaxSec), ...base });
        }
      },
    );
  } else {
    // Seeded variation: the same total pulses split differently across blocks.
    const offsets = shuffle(rng, blockOffsets(p.pulseBlocks));
    const sizes = offsets.map((o) => Math.max(4, p.pulseCount + o));
    addExercise(
      {
        type: 'pulse',
        reps: p.pulseBlocks,
        sets: 1,
        contractSec: PULSE_HALF_SEC,
        relaxSec: PULSE_HALF_SEC,
      },
      (i) => {
        sizes.forEach((size, b) => {
          const base = { exerciseIndex: i, rep: b + 1, reps: p.pulseBlocks };
          if (b > 0) push({ kind: 'relax', durationMs: ms(p.relaxSec), ...base });
          for (let k = 0; k < size; k++) {
            push({ kind: 'contract', durationMs: ms(PULSE_HALF_SEC), ...base });
            push({ kind: 'relax', durationMs: ms(PULSE_HALF_SEC), ...base });
          }
        });
      },
    );
  }

  // 4) Endurance (from level 5).
  if (lvl >= ENDURANCE_FROM_LEVEL && p.enduranceSec > 0) {
    addExercise(
      { type: 'endurance', reps: 1, sets: 1, contractSec: p.enduranceSec, relaxSec: p.enduranceSec },
      (i) => {
        const base = { exerciseIndex: i, rep: 1, reps: 1 };
        push({ kind: 'contract', durationMs: ms(p.enduranceSec), ...base });
        push({ kind: 'relax', durationMs: ms(p.enduranceSec), ...base });
      },
    );
  }

  // 5) Cool-down: breathing + conscious relaxation.
  addExercise(
    { type: 'relax', reps: COOLDOWN_BREATHS, sets: 1, contractSec: 0, relaxSec: INHALE_SEC + EXHALE_SEC },
    (i) => {
      for (let r = 1; r <= COOLDOWN_BREATHS; r++) {
        const base = { exerciseIndex: i, rep: r, reps: COOLDOWN_BREATHS };
        push({ kind: 'inhale', durationMs: ms(INHALE_SEC), ...base });
        push({ kind: 'exhale', durationMs: ms(EXHALE_SEC), ...base });
      }
    },
  );

  const plannedSec = Math.round(phases.reduce((a, ph) => a + ph.durationMs, 0) / 1000);
  return {
    id: `${seed}-L${lvl}-D${dayIndex}`,
    seed,
    level: lvl,
    dayIndex,
    variant,
    exercises,
    phases,
    plannedSec,
  };
}

/** Zero-sum offsets, e.g. 3 blocks → [-2, 0, 2]. */
function blockOffsets(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push((i - (n - 1) / 2) * 2);
  return out.map((x) => Math.round(x));
}

/** Short trial set used by the tutorial: 3 × (3 s squeeze / 3 s relax). */
export function generateTrialSession(): GeneratedSession {
  const phases: Phase[] = [
    { kind: 'countdown', durationMs: ms(COUNTDOWN_SEC), exerciseIndex: -1, rep: 0, reps: 0, set: 1, sets: 1 },
  ];
  for (let r = 1; r <= 3; r++) {
    const base = { exerciseIndex: 0, rep: r, reps: 3, set: 1, sets: 1 };
    phases.push({ kind: 'contract', durationMs: ms(3), ...base });
    phases.push({ kind: 'relax', durationMs: ms(3), ...base });
  }
  return {
    id: 'trial',
    seed: 'trial',
    level: 1,
    dayIndex: 0,
    variant: 'elevator',
    exercises: [{ type: 'hold', reps: 3, sets: 1, contractSec: 3, relaxSec: 3 }],
    phases,
    plannedSec: Math.round(phases.reduce((a, ph) => a + ph.durationMs, 0) / 1000),
  };
}
