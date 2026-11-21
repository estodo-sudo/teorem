import fs from 'fs';
import path from 'path';

import { exploreImage, IMAGES } from '@/content/images';
import { CAMPS } from '@/features/camps/registry';
import { CAMPUSES } from '@/features/content/cards';
import { GLOSSARY, STORIES } from '@/features/content/data';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('expo-notifications', () => ({ setNotificationCategoryAsync: jest.fn(), scheduleNotificationAsync: jest.fn(), SchedulableTriggerInputTypes: { DATE: 'date' } }));

/** SPEC_KESFET_V2 §8, §10: images, credits, rename and the strip layout. */
const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
const registry = read('src/content/images.ts');
const files = [...registry.matchAll(/require\('\.\.\/\.\.\/([^']+)'\)/g)].map((m) => m[1]!);

const items: ['stories' | 'camps' | 'programs' | 'glossary', string][] = [
  ...STORIES.map((s) => ['stories', s.id] as ['stories', string]),
  ...CAMPS.map((c) => ['camps', c.id] as ['camps', string]),
  ['camps', 'alcohol'],
  ...CAMPUSES.filter((c) => c.kind !== 'alcohol').map((c) => ['programs', c.id] as ['programs', string]),
  ...GLOSSARY.map((g) => ['glossary', g.id] as ['glossary', string]),
];

describe('Keşfet images (SPEC_KESFET_V2 §5, §8; SPEC_GORSELLER_V5 §6)', () => {
  it('every Keşfet item has a bundled image (the tone gradient stays as the fallback in code)', () => {
    expect(items.filter(([sec, id]) => !exploreImage(sec, id)).map((x) => x.join('/'))).toEqual([]);
    expect(read('src/features/content/explore/ExploreCards.tsx')).toMatch(/fallback/);
  });

  it('every image has a Turkish alt text and a blurhash and a CREDITS.md row', () => {
    const credits = read('assets/images/CREDITS.md');
    for (const [k, v] of Object.entries(IMAGES)) {
      expect([k, credits.includes(`\`${k}\``)]).toEqual([k, true]);
      expect([k, v.alt.trim().length > 0]).toEqual([k, true]);
      expect([k, v.blurhash.length >= 6]).toEqual([k, true]);
    }
  });

  it('files are bundled WebP; the total stays under 18 MB', () => {
    expect(registry).not.toMatch(/https?:\/\//);
    let total = 0;
    for (const f of files) {
      const size = fs.statSync(path.join(root, f)).size;
      total += size;
      expect([f, f.endsWith('.webp'), size <= 110 * 1024]).toEqual([f, true, true]);
    }
    console.log(`Images: ${files.length} files, ${(total / 1024).toFixed(0)} KB`);
    expect(total).toBeLessThanOrEqual(18 * 1024 * 1024);
  });

  it('no image file is used twice', () => {
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
