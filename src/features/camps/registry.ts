import type { CampNotifier } from './core/campNotifications';
import type { CampDefinition } from './core/definition';
import { ODAK_CAMP } from './odak/definition';
import { SMOKING_CAMP } from './smoking/definition';

/** Every camp, in "Kamplar" list order. A user can be in several camps at once. */
export const CAMPS: CampDefinition[] = [SMOKING_CAMP as unknown as CampDefinition, ODAK_CAMP as unknown as CampDefinition];

/** Notification plumbing of every camp that has notifications. */
export const campNotifiers = (): CampNotifier[] => CAMPS.flatMap((c) => (c.notifier ? [c.notifier] : []));
