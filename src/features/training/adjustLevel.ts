import type { Feedback } from '@/types';

import { MAX_LEVEL, MIN_LEVEL } from './levels';

export const OK_STREAK_FOR_LEVEL_UP = 3;

export interface LevelState {
  level: number;
  consecutiveOk: number;
}

export interface LevelAdjustment extends LevelState {
  /** True when tomorrow should repeat the same plan day. */
  repeatDay: boolean;
  delta: -1 | 0 | 1;
}

/**
 * Adaptive difficulty rule:
 *  - easy   → +1 level
 *  - ok     → +1 after 3 consecutive "ok"s
 *  - hard   → −1 (min 1)
 *  - failed → −1 (min 1) and repeat the same day tomorrow
 */
export function adjustLevel(state: LevelState, feedback: Feedback): LevelAdjustment {
  const clamp = (l: number) => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, l));
  switch (feedback) {
    case 'easy': {
      const level = clamp(state.level + 1);
      return { level, consecutiveOk: 0, repeatDay: false, delta: level > state.level ? 1 : 0 };
    }
    case 'ok': {
      const streak = state.consecutiveOk + 1;
      if (streak >= OK_STREAK_FOR_LEVEL_UP) {
        const level = clamp(state.level + 1);
        return { level, consecutiveOk: 0, repeatDay: false, delta: level > state.level ? 1 : 0 };
      }
      return { level: state.level, consecutiveOk: streak, repeatDay: false, delta: 0 };
    }
    case 'hard': {
      const level = clamp(state.level - 1);
      return { level, consecutiveOk: 0, repeatDay: false, delta: level < state.level ? -1 : 0 };
    }
    case 'failed': {
      const level = clamp(state.level - 1);
      return { level, consecutiveOk: 0, repeatDay: true, delta: level < state.level ? -1 : 0 };
    }
  }
}
