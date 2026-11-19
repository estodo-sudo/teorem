/**
 * Generic timed-sequence player as a finite state machine.
 *
 *   idle ──start──▶ running ──(last phase ends | finish)──▶ completed
 *                    │   ▲
 *              pause │   │ resume
 *                    ▼   │
 *                   paused
 *
 * The current phase (countdown → contract → relax → …) is derived from the
 * phase list. Timing is computed from wall-clock differences (`now` passed in
 * by the caller, normally Date.now()), so interval drift or dropped frames
 * never accumulate. All functions are pure: they return a new state plus the
 * events that happened (phase starts, whole-second ticks, completion), which
 * the UI maps to haptics / sounds / animation.
 *
 * Used by the Kegel player, the pelvic-fitness player, breathing and body scan.
 */

export interface TimedPhase {
  durationMs: number;
  /** Group index (exercise); phases of the same group are skipped together. */
  exerciseIndex: number;
}

export type PlayerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface PlayerState<P extends TimedPhase = TimedPhase> {
  status: PlayerStatus;
  phases: readonly P[];
  index: number;
  /** Elapsed ms inside the current phase at the last checkpoint. */
  phaseOffsetMs: number;
  /** Wall time of the last checkpoint (valid while running). */
  checkpointAt: number;
  /** Active (non-paused) ms accumulated up to the last checkpoint. */
  activeMs: number;
  /** Last whole second announced for the current phase. */
  lastSecond: number;
  skippedExercises: number[];
  endedEarly: boolean;
  /** Prefix sums of phase durations for O(1) progress. */
  startOffsets: readonly number[];
  totalMs: number;
}

export type PlayerEvent<P extends TimedPhase = TimedPhase> =
  { type: 'phaseStart'; index: number; phase: P; resumed?: boolean } | { type: 'second'; index: number; phase: P; second: number } | { type: 'exerciseComplete'; exerciseIndex: number } | { type: 'completed'; endedEarly: boolean };

export interface Step<P extends TimedPhase> {
  state: PlayerState<P>;
  events: PlayerEvent<P>[];
}

export function createPlayer<P extends TimedPhase>(phases: readonly P[]): PlayerState<P> {
  const startOffsets: number[] = [];
  let acc = 0;
  for (const p of phases) {
    startOffsets.push(acc);
    acc += Math.max(0, p.durationMs);
  }
  return {
    status: 'idle',
    phases,
    index: 0,
    phaseOffsetMs: 0,
    checkpointAt: 0,
    activeMs: 0,
    lastSecond: 0,
    skippedExercises: [],
    endedEarly: false,
    startOffsets,
    totalMs: acc,
  };
}

export function start<P extends TimedPhase>(s: PlayerState<P>, now: number): Step<P> {
  const fresh = createPlayer(s.phases);
  if (fresh.phases.length === 0) {
    return { state: { ...fresh, status: 'completed' }, events: [{ type: 'completed', endedEarly: false }] };
  }
  const state: PlayerState<P> = { ...fresh, status: 'running', checkpointAt: now };
  return { state, events: [{ type: 'phaseStart', index: 0, phase: fresh.phases[0] as P }] };
}

/** Elapsed ms within the current phase. */
export function phaseElapsed<P extends TimedPhase>(s: PlayerState<P>, now: number): number {
  if (s.status !== 'running') return s.phaseOffsetMs;
  return s.phaseOffsetMs + Math.max(0, now - s.checkpointAt);
}

export function activeTime<P extends TimedPhase>(s: PlayerState<P>, now: number): number {
  if (s.status !== 'running') return s.activeMs;
  return s.activeMs + Math.max(0, now - s.checkpointAt);
}

export function currentPhase<P extends TimedPhase>(s: PlayerState<P>): P | undefined {
  return s.phases[s.index];
}

export function remainingInPhase<P extends TimedPhase>(s: PlayerState<P>, now: number): number {
  const p = currentPhase(s);
  if (!p || s.status === 'completed') return 0;
  return Math.max(0, p.durationMs - phaseElapsed(s, now));
}

/** Overall progress 0..1 based on planned timeline position. */
export function progress<P extends TimedPhase>(s: PlayerState<P>, now: number): number {
  if (s.totalMs === 0) return s.status === 'completed' ? 1 : 0;
  if (s.status === 'completed' && !s.endedEarly) return 1;
  const p = currentPhase(s);
  if (!p) return 1;
  const pos = (s.startOffsets[s.index] ?? 0) + Math.min(p.durationMs, phaseElapsed(s, now));
  return Math.min(1, pos / s.totalMs);
}

/** Advances time. May cross several phases if a large gap occurred. */
export function tick<P extends TimedPhase>(s: PlayerState<P>, now: number): Step<P> {
  if (s.status !== 'running') return { state: s, events: [] };
  const events: PlayerEvent<P>[] = [];
  let index = s.index;
  let elapsed = phaseElapsed(s, now);
  let lastSecond = s.lastSecond;
  const active = activeTime(s, now);

  for (;;) {
    const phase = s.phases[index];
    if (!phase) break;
    if (elapsed < phase.durationMs) {
      const sec = Math.floor(elapsed / 1000);
      if (sec > lastSecond) {
        for (let k = lastSecond + 1; k <= sec; k++) {
          events.push({ type: 'second', index, phase, second: k });
        }
        lastSecond = sec;
      }
      break;
    }
    // Phase finished.
    elapsed -= phase.durationMs;
    const next = s.phases[index + 1];
    if (!next || next.exerciseIndex !== phase.exerciseIndex) {
      if (phase.exerciseIndex >= 0) events.push({ type: 'exerciseComplete', exerciseIndex: phase.exerciseIndex });
    }
    index += 1;
    lastSecond = 0;
    if (!next) {
      events.push({ type: 'completed', endedEarly: false });
      return {
        state: {
          ...s,
          status: 'completed',
          index: s.phases.length,
          phaseOffsetMs: 0,
          checkpointAt: now,
          activeMs: active,
          lastSecond: 0,
        },
        events,
      };
    }
    events.push({ type: 'phaseStart', index, phase: next });
  }

  return {
    state: { ...s, index, phaseOffsetMs: elapsed, checkpointAt: now, activeMs: active, lastSecond },
    events,
  };
}

export function pause<P extends TimedPhase>(s: PlayerState<P>, now: number): Step<P> {
  if (s.status !== 'running') return { state: s, events: [] };
  // Settle any finished phases first so the pause point is exact.
  const settled = tick(s, now);
  if (settled.state.status !== 'running') return settled;
  return {
    state: { ...settled.state, status: 'paused', checkpointAt: now },
    events: settled.events,
  };
}

export function resume<P extends TimedPhase>(s: PlayerState<P>, now: number): Step<P> {
  if (s.status !== 'paused') return { state: s, events: [] };
  const phase = currentPhase(s);
  const state: PlayerState<P> = { ...s, status: 'running', checkpointAt: now };
  return {
    state,
    events: phase ? [{ type: 'phaseStart', index: s.index, phase, resumed: true }] : [],
  };
}

/** Skips the rest of the current exercise (group). */
export function skipExercise<P extends TimedPhase>(s: PlayerState<P>, now: number): Step<P> {
  if (s.status !== 'running' && s.status !== 'paused') return { state: s, events: [] };
  const settled = s.status === 'running' ? tick(s, now) : { state: s, events: [] as PlayerEvent<P>[] };
  const st = settled.state;
  if (st.status === 'completed') return settled;
  const cur = currentPhase(st);
  if (!cur) return settled;
  const group = cur.exerciseIndex;
  let next = st.index + 1;
  while (next < st.phases.length && (st.phases[next] as P).exerciseIndex === group) next++;
  // Skip a following transition into the next group too? No — transitions
  // belong to the next exercise (same exerciseIndex), so landing there is right.
  const skipped = group >= 0 ? [...st.skippedExercises, group] : st.skippedExercises;
  const active = activeTime(st, now);
  if (next >= st.phases.length) {
    return {
      state: {
        ...st,
        status: 'completed',
        index: st.phases.length,
        phaseOffsetMs: 0,
        checkpointAt: now,
        activeMs: active,
        skippedExercises: skipped,
      },
      events: [...settled.events, { type: 'completed', endedEarly: false }],
    };
  }
  const phase = st.phases[next] as P;
  return {
    state: {
      ...st,
      index: next,
      phaseOffsetMs: 0,
      checkpointAt: now,
      activeMs: active,
      lastSecond: 0,
      skippedExercises: skipped,
    },
    events: [...settled.events, { type: 'phaseStart', index: next, phase }],
  };
}

/** Restarts the current exercise (group) from its first non-transition phase, paused or running. */
export function restartExercise<P extends TimedPhase & { kind?: string }>(s: PlayerState<P>, now: number): Step<P> {
  if (s.status !== 'running' && s.status !== 'paused') return { state: s, events: [] };
  const cur = currentPhase(s);
  if (!cur) return { state: s, events: [] };
  let first = s.index;
  while (first > 0 && (s.phases[first - 1] as P).exerciseIndex === cur.exerciseIndex) first--;
  while (first < s.index && (s.phases[first] as P).kind === 'transition') first++;
  const phase = s.phases[first] as P;
  return {
    state: { ...s, status: 'running', index: first, phaseOffsetMs: 0, checkpointAt: now, activeMs: activeTime(s, now), lastSecond: 0 },
    events: [{ type: 'phaseStart', index: first, phase }],
  };
}

/** Ends the session immediately (user pressed "Finish"). */
export function finish<P extends TimedPhase>(s: PlayerState<P>, now: number): Step<P> {
  if (s.status === 'completed' || s.status === 'idle') {
    return { state: { ...s, status: 'completed', endedEarly: s.status === 'idle' }, events: [] };
  }
  const settled = tick(s, now);
  if (settled.state.status === 'completed') return settled;
  const st = settled.state;
  return {
    state: {
      ...st,
      status: 'completed',
      endedEarly: true,
      activeMs: activeTime(st, now),
      checkpointAt: now,
    },
    events: [...settled.events, { type: 'completed', endedEarly: true }],
  };
}

/** Per-exercise outcome once the player is completed (or ended early). */
export function exerciseOutcomes<P extends TimedPhase>(s: PlayerState<P>, exerciseCount: number): { completed: boolean; skipped: boolean }[] {
  const out: { completed: boolean; skipped: boolean }[] = [];
  for (let i = 0; i < exerciseCount; i++) {
    const skipped = s.skippedExercises.includes(i);
    let lastIdx = -1;
    s.phases.forEach((p, k) => {
      if (p.exerciseIndex === i) lastIdx = k;
    });
    const reachedEnd = lastIdx >= 0 && (s.index > lastIdx || (s.status === 'completed' && !s.endedEarly));
    out.push({ completed: reachedEnd && !skipped, skipped });
  }
  return out;
}
