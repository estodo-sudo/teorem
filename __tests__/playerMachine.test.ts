import {
  activeTime,
  createPlayer,
  currentPhase,
  exerciseOutcomes,
  finish,
  pause,
  progress,
  remainingInPhase,
  resume,
  skipExercise,
  start,
  tick,
  type PlayerEvent,
  type TimedPhase,
} from '@/features/training/player/machine';

interface P extends TimedPhase {
  kind: string;
}

const phases: P[] = [
  { kind: 'countdown', durationMs: 3000, exerciseIndex: -1 },
  { kind: 'contract', durationMs: 3000, exerciseIndex: 0 },
  { kind: 'relax', durationMs: 3000, exerciseIndex: 0 },
  { kind: 'transition', durationMs: 2000, exerciseIndex: 1 },
  { kind: 'contract', durationMs: 5000, exerciseIndex: 1 },
  { kind: 'relax', durationMs: 5000, exerciseIndex: 1 },
];

const types = (ev: PlayerEvent<P>[]) =>
  ev.map((e) => (e.type === 'phaseStart' ? `start:${e.phase.kind}` : e.type === 'second' ? `s${e.second}` : e.type));

describe('player state machine', () => {
  it('starts idle and moves to running on start', () => {
    const p = createPlayer(phases);
    expect(p.status).toBe('idle');
    expect(p.totalMs).toBe(21000);
    const { state, events } = start(p, 1000);
    expect(state.status).toBe('running');
    expect(types(events)).toEqual(['start:countdown']);
  });

  it('advances phases using wall-clock time, emitting second ticks', () => {
    let { state } = start(createPlayer(phases), 0);
    let step = tick(state, 1500);
    expect(types(step.events)).toEqual(['s1']);
    step = tick(step.state, 3200);
    // Stale second ticks of an already-finished phase are not replayed.
    expect(types(step.events)).toEqual(['start:contract']);
    expect(currentPhase(step.state)!.kind).toBe('contract');
    expect(remainingInPhase(step.state, 3200)).toBe(2800);
    state = step.state;
    expect(progress(state, 3200)).toBeCloseTo(3200 / 21000);
  });

  it('is robust to irregular / dropped ticks (no drift)', () => {
    const a = start(createPlayer(phases), 0).state;
    // One big jump vs many small ones → same position.
    const big = tick(a, 10_500).state;
    let small = a;
    for (let t = 16; t <= 10_500; t += 16 + (t % 7)) small = tick(small, t).state;
    small = tick(small, 10_500).state;
    expect(big.index).toBe(small.index);
    expect(remainingInPhase(big, 10_500)).toBe(remainingInPhase(small, 10_500));
  });

  it('crosses multiple phases in a single tick and reports exercise completion', () => {
    const a = start(createPlayer(phases), 0).state;
    const step = tick(a, 9500);
    expect(types(step.events)).toContain('exerciseComplete');
    expect(currentPhase(step.state)!.kind).toBe('transition');
  });

  it('pause freezes time; resume continues from the same point', () => {
    let s = start(createPlayer(phases), 0).state;
    s = tick(s, 4000).state;
    s = pause(s, 4000).state;
    expect(s.status).toBe('paused');
    // A long pause does not advance anything.
    expect(tick(s, 60_000).state).toBe(s);
    expect(remainingInPhase(s, 60_000)).toBe(2000);
    const r = resume(s, 60_000);
    expect(types(r.events)).toEqual(['start:contract']);
    expect((r.events[0] as { resumed?: boolean }).resumed).toBe(true);
    s = tick(r.state, 61_000).state;
    expect(remainingInPhase(s, 61_000)).toBe(1000);
    expect(activeTime(s, 61_000)).toBe(5000);
  });

  it('completes at the end of the last phase', () => {
    let s = start(createPlayer(phases), 0).state;
    const step = tick(s, 21_000);
    s = step.state;
    expect(s.status).toBe('completed');
    expect(step.events[step.events.length - 1]).toEqual({ type: 'completed', endedEarly: false });
    expect(progress(s, 21_000)).toBe(1);
    expect(exerciseOutcomes(s, 2)).toEqual([
      { completed: true, skipped: false },
      { completed: true, skipped: false },
    ]);
  });

  it('skipExercise jumps to the next exercise group', () => {
    let s = start(createPlayer(phases), 0).state;
    s = tick(s, 3500).state; // in exercise 0 contract
    const step = skipExercise(s, 3500);
    expect(currentPhase(step.state)!.kind).toBe('transition');
    expect(step.state.skippedExercises).toEqual([0]);
    s = tick(step.state, 3500 + 12_000).state;
    expect(s.status).toBe('completed');
    expect(exerciseOutcomes(s, 2)).toEqual([
      { completed: false, skipped: true },
      { completed: true, skipped: false },
    ]);
  });

  it('skipping the last exercise completes the session', () => {
    let s = start(createPlayer(phases), 0).state;
    s = tick(s, 12_000).state; // exercise 1
    const step = skipExercise(s, 12_000);
    expect(step.state.status).toBe('completed');
  });

  it('finish ends early and records partial outcomes', () => {
    let s = start(createPlayer(phases), 0).state;
    s = tick(s, 10_000).state;
    const step = finish(s, 10_000);
    expect(step.state.status).toBe('completed');
    expect(step.state.endedEarly).toBe(true);
    expect(types(step.events)).toContain('completed');
    expect(exerciseOutcomes(step.state, 2)).toEqual([
      { completed: true, skipped: false },
      { completed: false, skipped: false },
    ]);
    expect(progress(step.state, 10_000)).toBeLessThan(1);
  });

  it('start() restarts from scratch', () => {
    let s = start(createPlayer(phases), 0).state;
    s = tick(s, 15_000).state;
    const r = start(s, 20_000).state;
    expect(r.index).toBe(0);
    expect(activeTime(r, 20_000)).toBe(0);
  });

  it('handles an empty phase list', () => {
    const r = start(createPlayer<P>([]), 0);
    expect(r.state.status).toBe('completed');
  });
});
