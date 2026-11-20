import fs from 'fs';
import path from 'path';

import { ICON_NAMES } from '@/components/Icon';
import { lightTheme } from '@/config/theme';

/**
 * SPEC_UI_V3 §6: no emoji anywhere in the interface — screen code, UI strings and content files.
 * Content items carry `icon` (an app icon name, Lucide) and `tone` (module tone) instead.
 * Text the user types at runtime is not in these files, so it is naturally exempt.
 */
const root = path.join(__dirname, '..');
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.(tsx?|json)$/.test(e.name) ? [path.join(dir, e.name)] : []));

// Pictographic emoji, dingbats, the emoji variation selector. Plain typographic marks (→ ✓ ✗ ·) stay allowed.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{2712}\u{2714}-\u{2716}\u{2718}-\u{27BF}\u{2B05}-\u{2B55}\u{231A}\u{231B}\u{23E9}-\u{23FA}\u{2139}\u{FE0F}]/u;

const files = [...walk(path.join(root, 'app')), ...walk(path.join(root, 'src'))];

describe('no emoji (SPEC_UI_V3 §6)', () => {
  it('screen code, strings and content contain no emoji', () => {
    const hits: string[] = [];
    for (const f of files) {
      fs.readFileSync(f, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (EMOJI.test(line)) hits.push(`${path.relative(root, f)}:${i + 1}`);
        });
    }
    expect(hits).toEqual([]);
  });

  it('content icons are real app icons and tones are real module tones', () => {
    const icons = new Set<string>(ICON_NAMES);
    const tones = new Set(Object.keys(lightTheme.tone));
    const bad: string[] = [];
    const visit = (v: unknown, where: string) => {
      if (Array.isArray(v)) v.forEach((x, i) => visit(x, `${where}[${i}]`));
      else if (v && typeof v === 'object') {
        for (const [k, x] of Object.entries(v)) {
          if (k === 'icon' && typeof x === 'string' && !icons.has(x)) bad.push(`${where}.icon=${x}`);
          if (k === 'tone' && typeof x === 'string' && !tones.has(x)) bad.push(`${where}.tone=${x}`);
          if (k === 'emoji') bad.push(`${where}.emoji`);
          visit(x, `${where}.${k}`);
        }
      }
    };
    for (const f of files.filter((x) => x.endsWith('.json'))) visit(JSON.parse(fs.readFileSync(f, 'utf8')), path.relative(root, f));
    expect(bad).toEqual([]);
  });
});
