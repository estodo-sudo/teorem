import { useEffect } from 'react';

import { Celebration } from '@/features/gamification/Celebration';
import { checkAchievements } from '@/features/gamification/service';

import { registerHooks } from './registerHooks';

registerHooks();

/** Global side effects mounted once at the root. */
export function AppEffects() {
  useEffect(() => {
    // Catch up on anything earned while the app was closed (e.g. after import).
    checkAchievements();
  }, []);
  return <Celebration />;
}
