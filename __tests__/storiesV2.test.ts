import fs from 'fs';
import path from 'path';

import { ICON_NAMES } from '@/components/Icon';
import { STORIES, type Story } from '@/features/content/data';
import { isV2Story, pageDurationMs, pageWords, storyPages, waitsForReader } from '@/features/content/story/pages';

/** SPEC_V4 §B: Bilgi Hikâyeleri v2 (slide types, content rules, the icon-as-text bug). */
const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
const icons = new Set<string>(ICON_NAMES);
const v2 = STORIES.filter(isV2Story);

/** Every `icon` / `support` value in any slide of any content file that has slides. */
function slideIcons(): { file: string; icon: string }[] {
  const files = ['stories.tr.json', 'courses.tr.json', 'camp/library.tr.json', 'camp/skills.tr.json', 'camps/odak/library.tr.json', 'camps/odak/skills.tr.json'];
  const out: { file: string; icon: string }[] = [];
  const walk = (o: unknown, file: string) => {
    if (Array.isArray(o)) o.forEach((x) => walk(x, file));
    else if (o && typeof o === 'object') {
      const rec = o as Record<string, unknown>;
      if (Array.isArray(rec.slides))
        for (const s of rec.slides as Record<string, unknown>[]) {
          if (typeof s.icon === 'string') out.push({ file, icon: s.icon });
          for (const ic of (s.support as string[] | undefined) ?? []) out.push({ file, icon: ic });
        }
      Object.values(rec).forEach((x) => walk(x, file));
    }
  };
  for (const f of files) walk(JSON.parse(read(`src/content/${f}`)), f);
  return out;
}

/** Does an Expo Router file serve this path? Static segments first, then `[param]` folders/files; `(group)` folders are transparent. */
function routeExists(route: string): boolean {
  const parts = route.split('/').filter(Boolean);
  const walk = (dir: string, i: number): boolean => {
    if (!fs.existsSync(dir)) return false;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    if (i === parts.length) return entries.some((e) => e.name === 'index.tsx') || entries.some((e) => e.isDirectory() && /^\(.+\)$/.test(e.name) && walk(path.join(dir, e.name), i));
    const seg = parts[i]!;
    const last = i === parts.length - 1;
    for (const e of entries) {
      const name = e.name.replace(/\.tsx$/, '');
      const match = name === seg || /^\[[^.\]]+\]$/.test(name);
      if (e.isDirectory() && /^\(.+\)$/.test(e.name) && walk(path.join(dir, e.name), i)) return true;
      if (!match) continue;
      if (e.isDirectory() && walk(path.join(dir, e.name), i + 1)) return true;
      if (!e.isDirectory() && e.name.endsWith('.tsx') && last) return true;
    }
    return false;
  };
  return walk(path.join(root, 'app'), 0);
}

describe('slide icons are drawn as icons (SPEC_V4 §0.1)', () => {
  it('every slide icon in every content file is a registered icon', () => {
    const all = slideIcons();
    expect(all.length).toBeGreaterThan(100);
    expect(all.filter((x) => !icons.has(x.icon))).toEqual([]);
  });

  it('no player prints an icon name as text', () => {
    for (const f of ['src/features/content/storyPlayer/StoryPlayer.tsx', 'src/features/content/story/StoryViewer.tsx']) {
      expect([f, /<AppText[^>]*>\s*\{\s*(slide|page)\.icon\s*\}/.test(read(f))]).toEqual([f, false]);
    }
  });
});

describe('Bilgi Hikâyeleri v2 content (SPEC_V4 §B.3)', () => {
  it('all 20 stories are in the v2 format (V4-1)', () => {
    expect(STORIES).toHaveLength(20);
    expect(STORIES.filter((s) => !isV2Story(s)).map((s) => s.id)).toEqual([]);
  });

  it.each(v2.map((s) => [s.id, s] as [string, Story]))('%s: 6–8 slides, cover first, summary last, quiz and action, ≥2 sources', (_, s) => {
    const types = s.slides.map((p) => p.type);
    expect(types.length).toBeGreaterThanOrEqual(6);
    expect(types.length).toBeLessThanOrEqual(8);
    expect(types[0]).toBe('cover');
    expect(types[types.length - 1]).toBe('summary');
    expect(types).toContain('quiz');
    expect(types).toContain('action');
    expect(types.some((x) => x === 'myth' || x === 'didYouKnow')).toBe(true);
    const infos = types.filter((x) => x === 'info').length;
    expect(infos).toBeGreaterThanOrEqual(2);
    expect(infos).toBeLessThanOrEqual(3);
    expect(s.sources.length).toBeGreaterThanOrEqual(2);
    expect(s.reviewed).toBe(false);
  });

  it.each(v2.map((s) => [s.id, s] as [string, Story]))('%s: slide fields are complete and info slides stay under 45 words', (_, s) => {
    for (const p of s.slides) {
      if (p.type === 'info') {
        expect(p.icon && p.title && p.text).toBeTruthy();
        expect(pageWords({ text: p.text })).toBeLessThanOrEqual(45);
      }
      if (p.type === 'myth') expect(p.myth && p.fact).toBeTruthy();
      if (p.type === 'quiz') {
        expect(p.quiz!.options).toHaveLength(3);
        expect(p.quiz!.correct).toBeGreaterThanOrEqual(0);
        expect(p.quiz!.correct).toBeLessThan(3);
        expect(p.quiz!.explain.length).toBeGreaterThan(0);
      }
      if (p.type === 'doctor') expect(p.items!.length).toBeGreaterThanOrEqual(2);
      if (p.type === 'doctor') expect(p.items!.length).toBeLessThanOrEqual(4);
      if (p.type === 'summary') expect(p.items).toHaveLength(3);
    }
  });

  it('every "Bugün dene" button opens a screen that exists', () => {
    for (const s of v2)
      for (const p of s.slides)
        if (p.action) expect([s.id, p.action.route, routeExists(p.action.route)]).toEqual([s.id, p.action.route, true]);
  });

  it('the route check understands groups and parameters', () => {
    expect(['/', '/fitness/beginner', '/campus/alcohol', '/mind/unload', '/camp'].every(routeExists)).toBe(true);
    expect(routeExists('/nowhere')).toBe(false);
  });

  it('stories with a required doctor slide have one (1, 3, 4, 6, 13, 19, 20)', () => {
    const required = ['pf-basics', 'erection-blood', 'bladder-control', 'performance-anxiety', 'night-bathroom', 'cycling', 'smoking'];
    for (const s of v2.filter((x) => required.includes(x.id))) expect([s.id, s.slides.some((p) => p.type === 'doctor')]).toEqual([s.id, true]);
  });

  it('no forbidden promises in any story', () => {
    const text = JSON.stringify(STORIES).toLocaleLowerCase('tr');
    for (const w of ['garanti', 'kesin çözüm', 'mucize']) expect([w, text.includes(w)]).toEqual([w, false]);
  });
});

describe('story pages (viewer logic)', () => {
  it('legacy stories get a cover, info slides and a summary', () => {
    const legacy = { ...STORIES[0]!, slides: [{ icon: 'leaf' as const, title: 'Başlık', text: 'Metin', didYouKnow: 'Not' }] };
    const pages = storyPages(legacy);
    expect(pages[0]!.type).toBe('cover');
    expect(pages[pages.length - 1]!.type).toBe('summary');
    expect(pages.slice(1, -1).every((p) => p.type === 'info' || p.type === 'didYouKnow')).toBe(true);
  });

  it('reading time is words ÷ 3.3 s, between 6 and 14 seconds', () => {
    expect(pageDurationMs({ type: 'info', text: 'kısa' })).toBe(6000);
    expect(pageDurationMs({ type: 'info', text: Array(33).fill('kelime').join(' ') })).toBe(10000);
    expect(pageDurationMs({ type: 'info', text: Array(200).fill('kelime').join(' ') })).toBe(14000);
  });

  it('myth, quiz, action and summary slides wait for the reader', () => {
    expect(['myth', 'quiz', 'action', 'summary'].every((type) => waitsForReader({ type } as never))).toBe(true);
    expect(['cover', 'info', 'didYouKnow', 'doctor'].some((type) => waitsForReader({ type } as never))).toBe(false);
  });
});

describe('Keşfet story states (SPEC_V4 §B.2)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { featuredStory, orderStories, storyProgress, storyState } = require('@/features/content/story/discover') as typeof import('@/features/content/story/discover');
  const [a, b, c, d] = STORIES as [Story, Story, Story, Story];

  it('orders half read → unread → read', () => {
    const order = orderStories([a, b, c, d], [a.id, c.id], { [d.id]: 3 }).map((s) => s.id);
    expect(order).toEqual([d.id, b.id, a.id, c.id]);
    expect(storyState(d.id, [], { [d.id]: 3 })).toBe('partial');
    expect(storyState(a.id, [a.id])).toBe('read');
  });

  it('the story of the day is the half-read one first, with "Kaldığın yerden: n/total"', () => {
    const f = featuredStory('2026-11-21', [a, b, c], [], { [b.id]: 3 })!;
    expect(f).toMatchObject({ resume: true });
    expect(f.story.id).toBe(b.id);
    expect(storyProgress(b, { [b.id]: 3 })).toMatchObject({ at: 4, slides: b.slides.length });
    expect(featuredStory('2026-11-21', [a, b, c], [a.id], {})!.resume).toBe(false);
  });

  it('cards show read, half-read and saved states', () => {
    const src = read('src/features/content/explore/ExploreCards.tsx');
    const poster = src.slice(src.indexOf('export function StoryPosterCard'), src.indexOf('// ---------------------------------------------------------------- 4.3'));
    expect(poster).toMatch(/name="check"/);
    expect(poster).toMatch(/name="bookmark"/);
    expect(poster).toMatch(/progress > 0/);
    expect(read('src/i18n/tr.json')).toMatch(/"resume": "Kaldığın yerden: \{\{n\}\}\/\{\{total\}\}"/);
  });
});
