import fs from 'fs';
import path from 'path';

import { appImage, IMAGES } from '@/content/images';
import { STORIES } from '@/features/content/data';
import { storyPages } from '@/features/content/story/pages';
import { preloadIndices, slidePhoto, SCRIM_STOPS, SUMMARY_BLUR } from '@/features/content/story/slideImage';
import { darkTheme, lightTheme } from '@/config/theme';

/** SPEC_GORSELLER_V5: manifest, records, story slide photos and the viewer's photo rules. */
const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
interface Entry {
  id: string;
  source: { site: string; photoId: number; page: string; photographer: string; license: string };
  download: string;
  focus: { x: number; y: number };
  alt: string;
  status: string;
}
const manifest = JSON.parse(read('assets/images/manifest.json')) as { images: Entry[] };
const lock = JSON.parse(read('assets/images/fetch-lock.json')) as { images: Record<string, { files: Record<string, { file: string; bytes: number }>; readability: { scrim: number | null; contrast: number } | null }> };
const accepted = manifest.images.filter((e) => e.status === 'accepted');
const LIMITS: Record<string, number> = { slide: 110, card: 80, camp: 70, program: 60, glossary: 40 };

describe('image manifest and records (§1)', () => {
  it('every entry has id, source, download, focus, alt and status', () => {
    for (const e of manifest.images) {
      expect([e.id, !!e.source?.page, !!e.download, e.focus.x >= 0 && e.focus.x <= 1 && e.focus.y >= 0 && e.focus.y <= 1, e.alt.length > 5, !!e.status]).toEqual([e.id, true, true, true, true, true]);
      expect(e.download).toMatch(/^https:\/\/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg\?auto=compress&cs=tinysrgb&(w|h)=1440$/);
    }
  });

  it('every accepted photo has a CREDITS.md and a REVIEW.md row', () => {
    const credits = read('assets/images/CREDITS.md');
    const review = read('assets/images/REVIEW.md');
    for (const e of accepted) {
      expect([e.id, credits.includes(`\`${e.id}\``), review.includes(`\`${e.id}\``)]).toEqual([e.id, true, true]);
      expect(credits).toContain(e.source.page);
    }
    expect(credits).toMatch(/Pexels License/);
    expect(credits).not.toMatch(/Unsplash\+/);
  });

  it('no source photo is used twice', () => {
    const ids = accepted.map((e) => `${e.source.site}/${e.source.photoId}`);
    expect(ids.filter((x, i) => ids.indexOf(x) !== i)).toEqual([]);
  });

  it('files stay inside the §5 size limits and the total under 18 MB', () => {
    let total = 0;
    for (const [id, l] of Object.entries(lock.images))
      for (const [kind, f] of Object.entries(l.files)) {
        const size = fs.statSync(path.join(root, 'assets/images', f.file)).size;
        total += size;
        expect([id, kind, size <= LIMITS[kind]! * 1024]).toEqual([id, kind, true]);
      }
    expect(total).toBeLessThanOrEqual(18 * 1024 * 1024);
  });

  it('every slide photo passes the readability test (4.5:1 with a scrim of at most 0.88)', () => {
    for (const [id, l] of Object.entries(lock.images)) if (l.readability) expect([id, l.readability.scrim !== null && l.readability.scrim <= 0.88, l.readability.contrast >= 4.5]).toEqual([id, true, true]);
  });
});

describe('clean-up and completeness (§8 G3)', () => {
  const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

  it('the old trial photos and their registry are gone', () => {
    expect(fs.existsSync(path.join(root, 'assets/images/explore'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'src/content/explore/images.ts'))).toBe(false);
    expect(read('src/content/images.ts')).not.toMatch(/legacy|explore\//);
  });

  it('every bundled WebP belongs to an accepted manifest entry, and every entry has its files', () => {
    const fromLock = new Set(Object.values(lock.images).flatMap((l) => Object.values(l.files).map((f) => f.file)));
    const onDisk = walk(path.join(root, 'assets/images')).filter((f) => f.endsWith('.webp')).map((f) => path.relative(path.join(root, 'assets/images'), f).split(path.sep).join('/'));
    expect(onDisk.filter((f) => !fromLock.has(f))).toEqual([]);
    expect([...fromLock].filter((f) => !onDisk.includes(f))).toEqual([]);
    expect(accepted.map((e) => e.id).filter((id) => !lock.images[id])).toEqual([]);
  });

  it('every slide of every story except the summary has a photo id', () => {
    for (const s of STORIES)
      s.slides.forEach((p, i) => {
        if (i === 0 || p.type === 'summary') return;
        expect([s.id, i + 1, p.image]).toEqual([s.id, i + 1, `story/${s.id}/${i + 1}`]);
      });
  });

  it('no Keşfet card falls back to the gradient any more', () => {
    for (const id of Object.keys(IMAGES)) expect([id, IMAGES[id]!.bytes > 0]).toEqual([id, true]);
    expect(Object.keys(IMAGES).filter((k) => k.split('/').length === 2)).toHaveLength(45);
  });

  it('REVIEW.md has a decision for every photo and no slide left to pick by hand', () => {
    const review = read('assets/images/REVIEW.md');
    expect((review.match(/^\| `[^`]+` \| kabul \|/gm) ?? []).length).toBe(accepted.length);
    expect(review.split('## Elle seçilecek')[1]!.trim()).toBe('Yok.');
  });
});

describe('story slide photos (§4, §6)', () => {
  it('every slide `image` points at a registered photo and has a Turkish alt text', () => {
    for (const s of STORIES)
      for (const p of s.slides)
        if (p.image) {
          expect([s.id, p.image, !!IMAGES[p.image]]).toEqual([s.id, p.image, true]);
          expect([p.image, (p.imageAlt ?? '').length > 5]).toEqual([p.image, true]);
        }
  });

  it.each(STORIES.map((x) => x.id))('%s: every slide has its own photo; the summary reuses the cover', (id) => {
    const s = STORIES.find((x) => x.id === id)!;
    const pages = storyPages(s);
    const shown = pages.map((p) => slidePhoto(s, p));
    expect(shown.every(Boolean)).toBe(true);
    const sources = shown.slice(0, -1).map((p) => p!.source);
    expect(new Set(sources).size).toBe(sources.length);
    expect(shown.at(-1)).toMatchObject({ blurred: true, source: shown[0]!.source });
    expect(shown[0]!.source).toBe(appImage(`story/${id}`)!.slide);
  });

  it('a slide without a photo falls back (the viewer draws the tone gradient)', () => {
    const s = STORIES.find((x) => x.id === 'pf-basics')!;
    expect(slidePhoto(s, { type: 'info', title: 'x' })).toBeUndefined();
    expect(read('src/features/content/story/StoryViewer.tsx')).toMatch(/slideFallback/);
  });

  it('preloads the first three slides, then the next two', () => {
    expect(preloadIndices(0, 8)).toEqual([1, 2]);
    expect(preloadIndices(4, 8)).toEqual([0, 1, 2, 5, 6]);
    expect(preloadIndices(7, 8)).toEqual([0, 1, 2]);
  });
});

describe('viewer look (§4)', () => {
  it('veil.card is the same dark card in both themes', () => {
    expect(lightTheme.veil.card).toBe('rgba(15,18,20,0.72)');
    expect(darkTheme.veil.card).toBe('rgba(15,18,20,0.72)');
  });

  it('scrim runs from 0 at 40 % to the full value at the bottom, and matches the pipeline', () => {
    expect(SCRIM_STOPS[0]).toEqual([0.4, 0]);
    expect(SCRIM_STOPS.at(-1)).toEqual([1, 1]);
    const pipeline = read('scripts/images/fetch.mjs');
    for (const [a, b] of SCRIM_STOPS) expect(pipeline).toContain(`[${a}, ${b}]`);
    expect(SUMMARY_BLUR).toBe(24);
  });

  it('the viewer zooms slowly unless reduce motion is on, and uses the frosted card', () => {
    const src = read('src/features/content/story/StoryViewer.tsx');
    expect(src).toMatch(/zoomMs=\{reduce \? 0/);
    expect(src).toMatch(/BlurView intensity=\{20\}/);
    expect(src).toMatch(/t\.veil\.card/);
  });
});
