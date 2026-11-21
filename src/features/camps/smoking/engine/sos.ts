import type { CravingEvent, IfThenPlan, TriggerId } from '../types';

export const DELAY_MINUTES = 10;

/** Cravings ridden out without smoking ("Bu güne kadar N krizi atlattın"). */
export const resistedCount = (cravings: CravingEvent[]) => cravings.filter((c) => c.outcome === 'resisted').length;

/** If–then plans for a trigger (shown when that trigger is chosen in SOS). */
export const plansForTrigger = (plans: IfThenPlan[], trigger: TriggerId | null) => (trigger ? plans.filter((p) => p.trigger === trigger) : []);
