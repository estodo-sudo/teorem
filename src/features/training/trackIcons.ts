import type { IconName } from '@/components';
import type { TrackId } from '@/types';

/** Neutral Lucide icon per programme track (ui-v2: replaces the track emojis on screen). */
export const TRACK_ICON: Record<TrackId, IconName> = {
  general: 'leaf',
  erection: 'pulse',
  control: 'clock',
  bladder: 'droplet',
  surgery: 'shield',
  relax: 'wind',
};
