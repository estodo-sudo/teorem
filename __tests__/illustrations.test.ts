import fs from 'fs';
import path from 'path';

import shapes from '@/components/illustrations/shapes.json';
import { ICON_NAMES } from '@/components/Icon';
import { ACHIEVEMENTS } from '@/features/gamification/achievements';

const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

describe('illustration placeholders (SPEC_UI_V3 §4.2)', () => {
  const names = Object.keys(shapes);
  it('every illustration has a hand-off SVG and a line in ILLUSTRATIONS.md', () => {
    const md = read('ILLUSTRATIONS.md');
    for (const n of names) {
      expect([n, fs.existsSync(path.join(root, 'assets', 'illustrations', `${n}.svg`))]).toEqual([n, true]);
      expect([n, md.includes(`\`${n}\``)]).toEqual([n, true]);
    }
  });
  it('shapes only use colour roles; the component takes colours from the theme', () => {
    for (const s of Object.values(shapes).flatMap((x) => x.shapes as { fill?: string | null; stroke?: string | null }[])) {
      for (const role of [s.fill, s.stroke]) expect([null, undefined, 'fg', 'soft', 'line']).toContain(role);
    }
    expect(/'#[0-9A-Fa-f]{3,8}'|rgba?\(/.test(read('src/components/illustrations/Illustration.tsx'))).toBe(false);
  });
});

describe('medallions (SPEC_UI_V3 §4.3)', () => {
  it('no hard-coded colours; locked medallions show a progress ring instead of a grey card', () => {
    const src = read('src/features/gamification/Medallion.tsx');
    expect(/'#[0-9A-Fa-f]{3,8}'|rgba?\(/.test(src)).toBe(false);
    expect(src).toMatch(/strokeDasharray/);
    expect(read('app/achievements.tsx')).not.toMatch(/opacity: at \? 1/);
  });
  it('every trophy has a real icon and counted trophies show their number', () => {
    for (const a of ACHIEVEMENTS) {
      expect(ICON_NAMES).toContain(a.icon);
      if (a.id.startsWith('streak_') || a.id.startsWith('workouts_') || a.id.startsWith('level_')) expect(a.target).toBe(Number(a.id.split('_')[1]));
    }
  });
});
