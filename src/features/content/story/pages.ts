import type { Story, StoryPage, StoryPageType } from '../data';

/** A slide ready to show: legacy slides are mapped onto the v2 types. */
export interface ShownPage extends StoryPage {
  type: StoryPageType;
}

/** True once a story has been rewritten in the v2 slide format (its slides carry a `type`). */
export const isV2Story = (s: Story): boolean => s.slides.some((p) => p.type);

/**
 * The slides of a story as the viewer shows them (SPEC_V4 §B.1). v2 stories are returned as written.
 * Legacy stories get a photo cover in front, each slide becomes `info` (its "did you know" note a
 * `didYouKnow` slide of its own), and a `summary` at the end carries the next story and the sources.
 */
export function storyPages(s: Story): ShownPage[] {
  if (isV2Story(s)) return s.slides.map((p) => ({ ...p, type: p.type ?? 'info' }));
  const out: ShownPage[] = [{ type: 'cover' }];
  for (const p of s.slides) {
    out.push({ type: 'info', icon: p.icon, title: p.title, text: p.text });
    if (p.didYouKnow) out.push({ type: 'didYouKnow', text: p.didYouKnow });
  }
  out.push({ type: 'summary', items: [] });
  return out;
}

const words = (...parts: (string | undefined)[]) =>
  parts
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

/** All the words a slide shows (for reading time and the content rules). */
export function pageWords(p: StoryPage): number {
  return words(p.title, p.text, p.myth, p.fact, p.quiz?.question, ...(p.quiz?.options ?? []), p.quiz?.explain, p.action?.label, ...(p.items ?? []));
}

/** Auto-advance time: words ÷ 3.3 words a second, at least 6 s and at most 14 s (§B.1). */
export function pageDurationMs(p: StoryPage): number {
  return Math.round(Math.min(14, Math.max(6, pageWords(p) / 3.3)) * 1000);
}

/**
 * Slides that wait for the reader: the myth card must be turned and the quiz answered before the
 * story moves on by itself, and the action and summary slides are read at the reader's own pace.
 */
export const waitsForReader = (p: ShownPage): boolean => p.type === 'myth' || p.type === 'quiz' || p.type === 'action' || p.type === 'summary';
