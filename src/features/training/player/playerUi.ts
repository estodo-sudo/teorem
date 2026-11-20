import type { IconName } from '@/components/Icon';
import positionsJson from '@/content/kegel/positions.tr.json';
import type { Position } from '@/types';

import { KEGEL_CUES } from '../tracks';
import type { GeneratedSession, Phase, SessionBlock } from '../types';

/** Pure helpers for the Kegel player screen v2 (SPEC_KEGEL_V2 §7.1, §7.3). */

export interface PositionCard {
  id: Position;
  icon: IconName;
  title: string;
  text: string;
}
export const POSITION_CARDS = positionsJson.positions as PositionCard[];
export const positionCard = (p: Position) => POSITION_CARDS.find((c) => c.id === p) ?? POSITION_CARDS[0]!;

// ---------------------------------------------------------------- segmented progress bar

export interface Segment {
  exerciseIndex: number;
  startMs: number;
  durationMs: number;
}

/** One segment per block (its transition belongs to it); the countdown is left out. */
export function blockSegments(phases: readonly Phase[]): Segment[] {
  const segs: Segment[] = [];
  let at = 0;
  for (const p of phases) {
    if (p.exerciseIndex >= 0) {
      const last = segs[segs.length - 1];
      if (last && last.exerciseIndex === p.exerciseIndex) last.durationMs += p.durationMs;
      else segs.push({ exerciseIndex: p.exerciseIndex, startMs: at, durationMs: p.durationMs });
    }
    at += p.durationMs;
  }
  return segs;
}

/** Fill 0..1 of each segment for a timeline position (ms since the start). */
export const segmentFill = (segs: Segment[], posMs: number) => segs.map((s) => (s.durationMs <= 0 ? 1 : Math.min(1, Math.max(0, (posMs - s.startMs) / s.durationMs))));

// ---------------------------------------------------------------- rotating technique cue

export const CUE_ROTATE_MS = 8000;

/** The technique cue to show: one that fits the phase, changing every 8 s. */
export function cueText(block: SessionBlock | undefined, phaseKind: string, sessionMs: number): string | null {
  if (!block || !block.cueSet.length) return null;
  const want = phaseKind === 'contract' || phaseKind === 'cough' ? 'squeeze' : phaseKind === 'inhale' || phaseKind === 'exhale' ? (block.type === 'release' ? 'release' : 'breath') : 'release';
  const cues = block.cueSet.map((id) => KEGEL_CUES.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const fit = cues.filter((c) => c.phase === want);
  const list = fit.length ? fit : cues;
  if (!list.length) return null;
  return list[Math.floor(Math.max(0, sessionMs) / CUE_ROTATE_MS) % list.length]!.text;
}

// ---------------------------------------------------------------- gestures (§7.3)

export const DOUBLE_TAP_MS = 300;
export const LONG_PRESS_MS = 1000;
export const SWIPE_PX = 60;

/** What a released touch was. A long press is fired by its own timer while still holding. */
export function classifyRelease(g: { dx: number; dy: number; durationMs: number }): 'swipeLeft' | 'tap' | 'none' {
  if (g.dx <= -SWIPE_PX && Math.abs(g.dy) < Math.abs(g.dx) * 0.7) return 'swipeLeft';
  if (Math.abs(g.dx) < 12 && Math.abs(g.dy) < 12 && g.durationMs < LONG_PRESS_MS) return 'tap';
  return 'none';
}

export const isDoubleTap = (prevTapAt: number | null, now: number) => prevTapAt !== null && now - prevTapAt <= DOUBLE_TAP_MS;

// ---------------------------------------------------------------- block preview ("Sıradaki")

export interface NextPreview {
  block: SessionBlock;
  positionChanged: boolean;
}

/** During a transition: the block that comes next and whether the position changes. */
export function nextPreview(session: GeneratedSession, phase: Phase): NextPreview | null {
  if (phase.kind !== 'transition') return null;
  const block = session.blocks[phase.exerciseIndex];
  if (!block) return null;
  const prev = session.blocks[phase.exerciseIndex - 1];
  return { block, positionChanged: Boolean(prev && prev.position !== block.position) };
}

/** Blocks / positions used in a session (start card). */
export const firstPosition = (session: GeneratedSession): Position => session.blocks[0]?.position ?? 'lying';
