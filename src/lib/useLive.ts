import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Battery (round 8, 2026-11-25): decorative loops and display clocks run only while someone can see
 * them. Nothing here limits what the app does — timers that matter (players, reminders, counters) keep
 * their own time from `Date.now()` and simply catch up when the screen is seen again.
 */

/** True while the app is in the foreground. */
export function useAppActive(): boolean {
  // Only "background" / "inactive" count as away: at start-up the state can be "unknown" (iOS) or
  // missing, and treating that as away froze clocks such as the rest countdown (bug 2026-11-25).
  const away = (s: string | null | undefined) => s === 'background' || s === 'inactive';
  const [active, setActive] = useState(() => !away(AppState.currentState));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(!away(s)));
    return () => sub.remove();
  }, []);
  return active;
}

/** True while the screen this component is on is focused (a screen left behind in the stack is not). */
export function useScreenFocused(): boolean {
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}

/** True while the app is in the foreground and this screen is focused: when to run decorative motion. */
export function useLive(): boolean {
  const active = useAppActive();
  const focused = useScreenFocused();
  return active && focused;
}
