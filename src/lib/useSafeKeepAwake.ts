import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useId } from 'react';

/** Keeps the screen on while mounted; failures (unsupported device) are ignored. */
export function useSafeKeepAwake() {
  const tag = `ka-${useId()}`;
  useEffect(() => {
    let active = false;
    activateKeepAwakeAsync(tag)
      .then(() => {
        active = true;
      })
      .catch(() => {});
    return () => {
      if (!active) return;
      Promise.resolve()
        .then(() => deactivateKeepAwake(tag))
        .catch(() => {});
    };
  }, [tag]);
}
