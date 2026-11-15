import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createPlayer,
  finish as finishFn,
  pause as pauseFn,
  resume as resumeFn,
  skipExercise as skipFn,
  start as startFn,
  tick as tickFn,
  type PlayerEvent,
  type PlayerState,
  type Step,
  type TimedPhase,
} from './machine';

const TICK_MS = 100;

/**
 * React binding for the player state machine. Drives `tick` from a short
 * interval but all timing comes from Date.now() differences.
 */
export function usePlayer<P extends TimedPhase>(
  phases: readonly P[],
  onEvents: (events: PlayerEvent<P>[], state: PlayerState<P>) => void,
) {
  const ref = useRef<PlayerState<P>>(createPlayer(phases));
  const [state, setState] = useState(ref.current);
  const [now, setNow] = useState(() => Date.now());
  const handler = useRef(onEvents);
  handler.current = onEvents;

  const apply = useCallback((step: Step<P>) => {
    ref.current = step.state;
    setState(step.state);
    setNow(Date.now());
    if (step.events.length) handler.current(step.events, step.state);
  }, []);

  useEffect(() => {
    if (state.status !== 'running') return;
    const id = setInterval(() => apply(tickFn(ref.current, Date.now())), TICK_MS);
    return () => clearInterval(id);
  }, [state.status, apply]);

  return {
    state,
    now,
    start: useCallback(() => apply(startFn(ref.current, Date.now())), [apply]),
    pause: useCallback(() => apply(pauseFn(ref.current, Date.now())), [apply]),
    resume: useCallback(() => apply(resumeFn(ref.current, Date.now())), [apply]),
    skip: useCallback(() => apply(skipFn(ref.current, Date.now())), [apply]),
    finish: useCallback(() => apply(finishFn(ref.current, Date.now())), [apply]),
    getState: () => ref.current,
  };
}
