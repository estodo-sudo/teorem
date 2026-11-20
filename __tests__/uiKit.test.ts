import fs from 'fs';
import path from 'path';

import { ICON_NAMES } from '@/components/Icon';
import { shouldCloseSheet } from '@/components/ui/sheetRules';
import { darkTheme, lightTheme, space, type Theme } from '@/config/theme';

const root = path.join(__dirname, '..');
const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.tsx') || e.name.endsWith('.ts') ? [path.join(dir, e.name)] : []));

/** WCAG relative luminance contrast of two #RRGGBB colours. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x! + 0.05) / (y! + 0.05);
}

describe('ui-v3 contrast (SPEC_UI_V3 §8)', () => {
  const themes: [string, Theme][] = [
    ['light', lightTheme],
    ['dark', darkTheme],
  ];
  it.each(themes)('%s: body and muted text ≥ 4.5:1 on background and cards; button text ≥ 4.5:1', (_n, th) => {
    const k = th.tokens;
    for (const bg of [k.background, k.card]) {
      expect(contrast(k.foreground, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(k.mutedForeground, bg)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(k.primaryForeground, k.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(k.primary, k.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(k.primary, k.primarySoft)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(k.destructive, k.card)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(themes)('%s: helper labels and UI parts ≥ 3:1', (_n, th) => {
    const k = th.tokens;
    expect(contrast(k.subtle, k.card)).toBeGreaterThanOrEqual(3);
    expect(contrast(k.highlight, k.card)).toBeGreaterThanOrEqual(2);
  });
  it('module tones read on their soft backgrounds (≥ 3:1)', () => {
    for (const th of [lightTheme, darkTheme]) for (const tone of Object.values(th.tone)) expect(contrast(tone.fg, tone.soft)).toBeGreaterThanOrEqual(3);
  });
  it('no pure black backgrounds in dark; focus screens are dark in both themes', () => {
    expect(darkTheme.tokens.background).not.toBe('#000000');
    expect(lightTheme.focus.bg).toBe(darkTheme.focus.bg);
    expect(contrast(lightTheme.focus.text, lightTheme.focus.bg)).toBeGreaterThanOrEqual(7);
  });
});

describe('ui-v2 tokens', () => {
  it('shadcn colour roles exist in light and dark, and differ between them', () => {
    const roles = [
      'background',
      'foreground',
      'card',
      'cardForeground',
      'muted',
      'mutedForeground',
      'primary',
      'primaryForeground',
      'secondary',
      'secondaryForeground',
      'accent',
      'accentForeground',
      'destructive',
      'destructiveForeground',
      'border',
      'input',
      'ring',
    ] as const;
    for (const r of roles) {
      expect(lightTheme.tokens[r]).toBeTruthy();
    }
  });

  it('8 pt spacing, radii, type, shadows, borders and a 48 px touch target', () => {
    expect(Object.values(space)).toEqual([4, 8, 12, 16, 20, 24, 32, 40, 48]);
    for (const th of [lightTheme, darkTheme]) {
      expect(Object.keys(th.radius)).toEqual(expect.arrayContaining(['sm', 'md', 'lg', 'xl']));
      expect(Object.keys(th.shadow)).toEqual(['none', 'sm', 'md', 'lg']);
      expect(th.type.body.fontSize).toBe(16);
      expect(th.touch).toBe(48);
    }
  });

  it('legacy colour names are aliases of the tokens (screens keep working while they move over)', () => {
    for (const th of [lightTheme]) {
      expect(th.colors.surface).toBe(th.tokens.card);
      expect(th.colors.text).toBe(th.tokens.foreground);
      expect(th.colors.textMuted).toBe(th.tokens.mutedForeground);
      expect(th.colors.danger).toBe(th.tokens.destructive);
    }
  });
});

describe('ui-v2 components', () => {
  const ui = walk(path.join(root, 'src', 'components', 'ui'));

  it('the kit has every component the spec lists', () => {
    const index = fs.readFileSync(path.join(root, 'src', 'components', 'ui', 'index.ts'), 'utf8');
    for (const c of ['Button', 'Card', 'CardHeader', 'CardContent', 'CardFooter', 'Input', 'Textarea', 'Switch', 'Checkbox', 'RadioGroup', 'Sheet', 'Dialog', 'Tabs', 'Progress', 'Badge', 'Separator', 'Skeleton', 'ToastProvider'])
      expect([c, new RegExp(String.raw`\b${c}\b`).test(index)]).toEqual([c, true]);
  });

  it('no hard-coded colours in the kit; touchables have roles and honour reduced motion', () => {
    for (const f of ui) {
      const src = fs.readFileSync(f, 'utf8');
      expect([path.basename(f), /'#[0-9A-Fa-f]{3,8}'|rgba?\(/.test(src)]).toEqual([path.basename(f), false]);
      for (const m of src.matchAll(/<ScalePressable\b([\s\S]*?)(?<!=)>/g)) expect([path.basename(f), /accessibilityRole/.test(m[1]!)]).toEqual([path.basename(f), true]);
    }
    expect(fs.readFileSync(path.join(root, 'src', 'components', 'ui', 'pressable.tsx'), 'utf8')).toMatch(/useReducedMotion/);
  });

  it('sheet closes on a long drag or a flick', () => {
    expect(shouldCloseSheet(120, 0)).toBe(true);
    expect(shouldCloseSheet(30, 1.2)).toBe(true);
    expect(shouldCloseSheet(30, 0.2)).toBe(false);
  });

  it('icons: one Lucide wrapper, bundled (no network), no smoking or sexual icons, the gallery is dev-only', () => {
    expect(ICON_NAMES.length).toBeGreaterThan(40);
    const icon = fs.readFileSync(path.join(root, 'src', 'components', 'Icon.tsx'), 'utf8');
    expect(icon).toMatch(/from 'lucide-react-native'/);
    expect(icon).not.toMatch(/Cigarette|Heart(?:Handshake)|Bed\b|Banana|Eggplant|Cherry/);
    expect(icon).not.toMatch(/https?:\/\//);
    expect(fs.readFileSync(path.join(root, 'app', 'dev', 'gallery.tsx'), 'utf8')).toMatch(/if \(!__DEV__\)/);
    // The smoking camp uses a neutral icon for "I slipped".
    expect(fs.readFileSync(path.join(root, 'app', 'camp', 'index.tsx'), 'utf8')).not.toMatch(/icon="flame"/);
  });
});
