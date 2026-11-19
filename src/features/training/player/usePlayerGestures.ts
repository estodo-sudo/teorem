import { useEffect, useLayoutEffect, useState } from 'react';
import { PanResponder, type PanResponderInstance } from 'react-native';

import { classifyRelease, DOUBLE_TAP_MS, isDoubleTap, LONG_PRESS_MS } from './playerUi';

export interface GestureActions {
  /** Tap anywhere. */
  onTap: () => void;
  /** Double tap. */
  onDoubleTap: () => void;
  /** Held for 1 s. */
  onLongPress: () => void;
  /** Swiped left. */
  onSwipeLeft: () => void;
}

/** Gesture state kept outside React render (timers, last tap). */
interface Tracker {
  /** Latest actions (updated after every render). */
  actions: GestureActions;
  lastTap: number | null;
  grantAt: number;
  longFired: boolean;
  single: ReturnType<typeof setTimeout> | null;
  long: ReturnType<typeof setTimeout> | null;
}

function buildResponder(tr: Tracker): PanResponderInstance {
  const get = () => tr.actions;
  const clearLong = () => {
    if (tr.long) clearTimeout(tr.long);
    tr.long = null;
  };
  return PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
    onPanResponderGrant: () => {
      tr.grantAt = Date.now();
      tr.longFired = false;
      clearLong();
      tr.long = setTimeout(() => {
        tr.longFired = true;
        get().onLongPress();
      }, LONG_PRESS_MS);
    },
    onPanResponderMove: (_, g) => {
      if (Math.abs(g.dx) > 12 || Math.abs(g.dy) > 12) clearLong();
    },
    onPanResponderRelease: (_, g) => {
      clearLong();
      if (tr.longFired) return;
      const now = Date.now();
      const kind = classifyRelease({ dx: g.dx, dy: g.dy, durationMs: now - tr.grantAt });
      if (kind === 'swipeLeft') return get().onSwipeLeft();
      if (kind !== 'tap') return;
      if (isDoubleTap(tr.lastTap, now)) {
        tr.lastTap = null;
        if (tr.single) clearTimeout(tr.single);
        tr.single = null;
        return get().onDoubleTap();
      }
      tr.lastTap = now;
      // Wait briefly so a double tap does not also pause.
      tr.single = setTimeout(() => {
        tr.single = null;
        get().onTap();
      }, DOUBLE_TAP_MS);
    },
    onPanResponderTerminate: clearLong,
  });
}

/**
 * Player gestures without an extra library (SPEC_KEGEL_V2 §7.3): tap / double tap / hold 1 s /
 * swipe left, on one large target. The responder is built once; it reads the latest actions.
 */
export function usePlayerGestures(actions: GestureActions): PanResponderInstance {
  const [state] = useState(() => {
    const tracker: Tracker = { actions, lastTap: null, grantAt: 0, longFired: false, single: null, long: null };
    return { tracker, responder: buildResponder(tracker) };
  });
  useLayoutEffect(() => {
    // The tracker is a mutable box read only by gesture callbacks, never during render.
    // eslint-disable-next-line react-hooks/immutability
    state.tracker.actions = actions;
  });
  useEffect(
    () => () => {
      if (state.tracker.single) clearTimeout(state.tracker.single);
      if (state.tracker.long) clearTimeout(state.tracker.long);
    },
    [state],
  );
  return state.responder;
}
