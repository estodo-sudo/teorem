import fs from 'fs';
import path from 'path';

import { EXPLORE_IMAGES } from '@/content/explore/images';
import { CAMPS } from '@/features/camps/registry';
import { CAMPUSES } from '@/features/content/cards';
import { GLOSSARY, STORIES } from '@/features/content/data';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('expo-notifications', () => ({ setNotificationCategoryAsync: jest.fn(), scheduleNotificationAsync: jest.fn(), SchedulableTriggerInputTypes: { DATE: 'date' } }));

/** SPEC_KESFET_V2 §8, §10: images, credits, rename and the strip layout. */
const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
const registry = read('src/content/explore/images.ts');
const files = [...registry.matchAll(/require\('\.\.\/\.\.\/\.\.\/([^']+)'\)/g)].map((m) => m[1]!);

const keys = [
  ...STORIES.map((s) => `stories/${s.id}`),
  ...CAMPS.map((c) => `camps/${c.id}`),
  'camps/alcohol',
  ...CAMPUSES.filter((c) => c.kind !== 'alcohol').map((c) => `programs/${c.id}`),
  ...GLOSSARY.map((g) => `glossary/${g.id}`),
];

describe('Keşfet images (SPEC_KESFET_V2 §5, §8)', () => {
  it('every Keşfet item has a bundled image (the tone gradient stays as the fallback in code)', () => {
    expect(keys.filter((k) => !EXPLORE_IMAGES[k])).toEqual([]);
    expect(read('src/features/content/explore/ExploreCards.tsx')).toMatch(/fallback/);
  });

  it('every image has a CREDITS.md record and a Turkish alt text', () => {
    const credits = read('assets/images/explore/CREDITS.md');
    for (const [k, v] of Object.entries(EXPLORE_IMAGES)) {
      expect([k, credits.includes(`\`${k}\``)]).toEqual([k, true]);
      expect([k, v.alt.trim().length > 0]).toEqual([k, true]);
      expect([k, v.blurhash.length >= 6]).toEqual([k, true]);
    }
    expect(credits).toMatch(/CC0|Public Domain/);
  });

  it('files are bundled WebP, at most 100 KB each; the total is reported (target ≤ 5 MB)', () => {
    expect(registry).not.toMatch(/https?:\/\//);
    expect(files.length).toBe(Object.keys(EXPLORE_IMAGES).length);
    let total = 0;
    for (const f of files) {
      const size = fs.statSync(path.join(root, f)).size;
      total += size;
      expect([f, f.endsWith('.webp'), size <= 100 * 1024]).toEqual([f, true, true]);
    }
    // eslint-disable-next-line no-console
    console.log(`Keşfet images: ${files.length} files, ${(total / 1024).toFixed(0)} KB`);
    expect(total).toBeLessThanOrEqual(5 * 1024 * 1024);
  });

  it('no image is used twice', () => {
    expect(new Set(files).size).toBe(files.length);
  });
});

describe('Keşfet layout and the rename (SPEC_KESFET_V2 §3, §7)', () => {
  it('no visible "Kampüs" is left in strings or content', () => {
    const json = ['src/i18n/tr.json', ...fs.readdirSync(path.join(root, 'src/content')).filter((f) => f.endsWith('.json')).map((f) => `src/content/${f}`)];
    for (const f of json) expect([f, /[Kk]ampüs/.test(read(f))]).toEqual([f, false]);
  });

  it('every strip shows all items: no "see all", the alcohol camp sits among the camps', () => {
    const src = read('app/(tabs)/discover.tsx');
    expect(src).not.toMatch(/SeeAllCard|seeAll|moreCount|PREVIEW_ROWS|\.slice\(0,/);
    expect(src).toMatch(/AlcoholCampCard/);
    expect((src.match(/<HorizontalSection/g) ?? []).length).toBe(4);
    expect(fs.existsSync(path.join(root, 'app/course/index.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'app/glossary/index.tsx'))).toBe(false);
  });

  it('glossary cards have a short summary that fits (≤ 60 characters)', () => {
    for (const g of GLOSSARY) expect([g.id, (g.shortSummary ?? '').length > 0 && (g.shortSummary ?? '').length <= 60]).toEqual([g.id, true]);
  });
});
