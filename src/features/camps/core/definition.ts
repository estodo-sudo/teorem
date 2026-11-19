import type { Href } from 'expo-router';
import type { ComponentType } from 'react';

import type { CampNotifier } from './campNotifications';
import type { CheckinCadence } from './checkinEngine';
import type { PhaseModel } from './phaseEngine';

/**
 * A camp = definition + content + its own screens; the engines in this folder do the rest.
 * The "Kamplar" list shows every registered camp; a user can be in several at once.
 */
export interface CampDefinition<P extends string = string> {
  id: string;
  /** i18n key of the camp name (privacy-sensitive camps use a neutral name). */
  titleKey: string;
  emoji: string;
  /** Programme length in days. */
  days: number;
  /** The camp's panel. */
  route: Href;
  phases: PhaseModel<P>;
  /** Check-ins expected in each phase. */
  checkinCadence: (phase: P) => CheckinCadence;
  /** Ids of the SOS tools the camp offers, in order. */
  sosTools: readonly string[];
  /** Badge ids, in display order. */
  badges: readonly string[];
  /** Content files (under src/content) the camp reads. */
  contentFiles: readonly string[];
  /** Theme colour token used for the camp's accents. */
  color: 'primary' | 'accent' | 'success';
  /** 'all': open to everyone (under-18 rules inside); 'adults': 18+ only. */
  ageRule: 'all' | 'adults';
  /** 'high': app lock, neutral names everywhere, export excluded by default. */
  privacy: 'standard' | 'high';
  /** Row in the "Kamplar" list. */
  Card: ComponentType;
  /** Local notifications of the camp. */
  notifier?: CampNotifier;
}
