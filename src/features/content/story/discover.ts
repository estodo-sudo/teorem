import type { Story } from '../data';
import { storyOfTheDay } from '../daily';
import { storyPages } from './pages';

/** Where a reader stands with a story on Keşfet (SPEC_V4 §B.2). */
export type StoryState = 'partial' | 'unread' | 'read';

/** Half read (a slide position is remembered) wins over read, so a re-read in progress shows its line. */
export function storyState(id: string, read: readonly string[], positions: Readonly<Record<string, number>> = {}): StoryState {
  if ((positions[id] ?? 0) > 0) return 'partial';
  return read.includes(id) ? 'read' : 'unread';
}

/** Story strip order: half read → unread → read (catalogue order within each group). */
export function orderStories(stories: readonly Story[], read: readonly string[], positions: Readonly<Record<string, number>> = {}): Story[] {
  const rank: Record<StoryState, number> = { partial: 0, unread: 1, read: 2 };
  return stories
    .map((s, i) => ({ s, i, r: rank[storyState(s.id, read, positions)] }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.s);
}

/** Slides a story shows, and how far a half-read one got (1-based slide, 0..1 share). */
export function storyProgress(s: Story, positions: Readonly<Record<string, number>> = {}): { slides: number; at: number; share: number } {
  const slides = storyPages(s).length;
  const pos = Math.min(positions[s.id] ?? 0, slides - 1);
  return { slides, at: pos + 1, share: pos > 0 ? (pos + 1) / slides : 0 };
}

/**
 * "Günün hikâyesi": a half-read story first (the one furthest along), else an unread one for the day
 * (all read → the cycle starts over).
 */
export function featuredStory(date: string, stories: readonly Story[], read: readonly string[], positions: Readonly<Record<string, number>> = {}): { story: Story; resume: boolean } | undefined {
  const partial = stories.filter((s) => storyState(s.id, read, positions) === 'partial').sort((a, b) => storyProgress(b, positions).share - storyProgress(a, positions).share);
  if (partial[0]) return { story: partial[0], resume: true };
  const s = storyOfTheDay(date, stories, read);
  return s ? { story: s, resume: false } : undefined;
}
