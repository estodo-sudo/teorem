import { appImage, type AppImage } from '@/content/images';

import { storyCoverId, type Story } from '../data';
import type { ShownPage } from './pages';

/** Bottom scrim (SPEC_GORSELLER_V5 §4): black, from 0 at 40 % height to `max` at the bottom, eased. */
export const SCRIM_BASE = 0.78;
/** Same stops as scripts/images/fetch.mjs measures readability with: [height 0–1, share of max]. */
export const SCRIM_STOPS: readonly (readonly [number, number])[] = [
  [0.4, 0],
  [0.5, 0.55],
  [0.6, 0.85],
  [0.75, 0.97],
  [1, 1],
];
export const TOP_SCRIM = 0.35;
/** Summary slide: the cover, blurred 24 px and 20 % darker (§5). */
export const SUMMARY_BLUR = 24;
export const SUMMARY_DIM = 0.2;
/** Slow zoom over the slide (§4), off with "reduce motion". */
export const ZOOM_TO = 1.06;
/** Slides whose text sits on the dark frosted card (`veil.card`). */
export const CARD_SLIDES: readonly ShownPage['type'][] = ['myth', 'quiz', 'didYouKnow', 'doctor'];

export interface SlidePhoto {
  image: AppImage;
  /** The bundled file to show: the 9:16 slide crop when there is one. */
  source: number;
  alt: string;
  scrim: number;
  /** Summary: blurred, darkened cover. */
  blurred: boolean;
}

/**
 * The photo behind a slide: the cover's 9:16 crop on the cover, the cover again (blurred) on the summary,
 * and the slide's own `image` elsewhere. Undefined → the viewer draws the tone gradient with an icon.
 */
export function slidePhoto(story: Story, page: ShownPage): SlidePhoto | undefined {
  const cover = appImage(storyCoverId(story));
  const own = page.type === 'cover' || page.type === 'summary' ? cover : appImage(page.image);
  if (!own) return undefined;
  return {
    image: own,
    source: own.slide ?? own.image,
    alt: page.type === 'cover' || page.type === 'summary' ? own.alt : (page.imageAlt ?? own.alt),
    scrim: own.scrim ?? SCRIM_BASE,
    blurred: page.type === 'summary',
  };
}

/**
 * Slides to have loaded (§5): the first three when the story opens, then the next two as the reader
 * moves on.
 */
export function preloadIndices(index: number, count: number): number[] {
  const want = new Set<number>([0, 1, 2, index + 1, index + 2]);
  return [...want].filter((i) => i >= 0 && i < count && i !== index).sort((a, b) => a - b);
}
