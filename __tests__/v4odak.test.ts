import fs from 'fs';
import path from 'path';

import sosJson from '@/content/camps/odak/sos.tr.json';
import sourcesJson from '@/content/camps/odak/sources.json';
import { ODAK_ONBOARDING as ONB, ODAK_SOS, odakToolLabel } from '@/features/camps/odak/content';
import { odakToolGroup, odakTriggerOrder, SOS_TOOLS } from '@/features/camps/odak/engine/sos';
import tr from '@/i18n/tr.json';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('expo-notifications', () => ({ setNotificationCategoryAsync: jest.fn(), scheduleNotificationAsync: jest.fn(), SchedulableTriggerInputTypes: { DATE: 'date' } }));

const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
const walk = (dir: string): string[] =>
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : []));

describe('removed SOS tools are gone everywhere (SPEC_V4 §9)', () => {
  it('no screen offers urge surfing, the matching game, 4E or a coach', () => {
    const offenders = walk('app').filter((f) => /UrgeSurf|MatchGameView|FourECard|\/odak\/coach|\/camp\/coach|['"](surf|four_e|game|coach)['"]/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('removed ids only live on as legacy values for old records', () => {
    const offenders = walk('src').filter((f) => /['"](surf|four_e|game)['"]/.test(read(f)) && !/types\.ts$/.test(f));
    expect(offenders).toEqual([]);
    for (const f of ['app/odak/coach.tsx', 'src/content/camps/odak/coach.tr.json', 'src/features/camps/core/coachEngine.ts', 'src/features/mind/breathing.ts']) expect([f, fs.existsSync(path.join(root, f))]).toEqual([f, false]);
  });

  it('old Odak records with urge surfing show as "Diğer araçlar"', () => {
    expect(odakToolGroup('surf')).toBe('other');
    expect(odakToolLabel('other')).toBe('Diğer araçlar');
    expect(odakToolLabel('breath')).toBe('Nefes');
  });
});

describe('Odak Dürtü anı (SPEC_V4 §D.2)', () => {
  const sos = read('app/odak/sos.tsx');

  it('tools: breath (default), block puzzle, movement, values, future self, write to someone', () => {
    expect(SOS_TOOLS).toEqual(['breath', 'puzzle', 'move', 'values', 'futureSelf', 'supporter']);
    expect(ODAK_SOS.tools.items.map((x) => x.id)).toEqual(SOS_TOOLS);
    expect(sos).toMatch(/useState<OdakToolId>\('breath'\)/);
    expect(sos).toMatch(/<BreathPlayer/);
    expect(sos).toMatch(/<BlockPuzzle/);
  });

  it('DAYY rows are whole-row checkboxes; the gauge is used before and (compared) after', () => {
    expect(sos).toMatch(/function DayyRow/);
    expect(sos).toMatch(/accessibilityRole="checkbox"/);
    expect(sos).not.toMatch(/ChoiceCard key=\{it\.id\} multi/);
    expect((sos.match(/<UrgeGauge/g) ?? []).length).toBe(2);
    expect(sos).toMatch(/compareTo=\{before\}/);
  });

  it('a crisis is never blocked: "Devam" works without a value; the move-first step stays', () => {
    expect(sos).not.toMatch(/disabled=\{before === null\}/);
    expect(sos).toMatch(/<Relocate/);
  });

  it('new sources are listed', () => {
    const ids = new Set(sourcesJson.map((s) => s.id));
    for (const id of ['balban2023', 'zaccaro2018', 'skorkabrown2015']) {
      expect(ids.has(id)).toBe(true);
      expect(sosJson.sourceIds).toContain(id);
    }
  });
});

describe('Odak Dürtü kaydı (SPEC_V4 §D.3)', () => {
  const log = read('app/odak/log-urge.tsx');

  it('uses the gauge; every situation chip is shown, most frequent first', () => {
    expect(log).toMatch(/<UrgeGauge/);
    const ordered = odakTriggerOrder(ONB.triggers.options, [{ trigger: ONB.triggers.options[3]!.id as never }, { trigger: ONB.triggers.options[3]!.id as never }, { trigger: ONB.triggers.options[2]!.id as never }]);
    expect(ordered).toHaveLength(ONB.triggers.options.length);
    expect(ordered.slice(0, 2).map((o) => o.id)).toEqual([ONB.triggers.options[3]!.id, ONB.triggers.options[2]!.id]);
  });

  it('"Yönettim / Kaydım" look like normal secondary buttons with a "Birini seç" hint', () => {
    expect(log).not.toMatch(/disabled=\{intensity === null\}/);
    expect((log.match(/variant="secondary"/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(log).toMatch(/D\.urge\.pick/);
  });
});

describe('Odak home (SPEC_V4 §D.1)', () => {
  const home = read('app/odak/index.tsx');

  it('five layers: hero with the one filled button, Bugün, one situational card, 8 tools, support', () => {
    for (const x of ['<PanelHero tone="focus"', '<HeroButton', '<TodayCard', '<ToolGrid', '<SupportRow']) expect(home).toContain(x);
    expect((home.match(/<HeroButton/g) ?? []).length).toBe(1);
    const tools = home.slice(home.indexOf('const tools: ToolTile[] = ['), home.indexOf('];', home.indexOf('const tools: ToolTile[] = [')));
    expect((tools.match(/route: '/g) ?? []).length).toBe(8);
    for (const r of ['/odak/boundaries', '/odak/diary', '/odak/skills', '/odak/library', '/odak/stats', '/odak/rewards', '/odak/rebuild', '/odak/privacy']) expect(tools).toContain(r);
  });

  it('no long button list and no coach; the lock icon shows the lock state', () => {
    expect((home.match(/variant="secondary"/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(home).not.toMatch(/coach/);
    expect(home).toMatch(/lockOn \? 'lock' : 'lockOpen'/);
  });

  it('new Odak texts keep the neutral naming and the banned-word rules', () => {
    const text = JSON.stringify((tr as unknown as { odak: { home2: unknown } }).odak.home2);
    for (const b of [/porno|mastürbasyon|cinsel/i, /başarısız/i, /temiz gün/i, /kirli/i, /günah/i, /%\s?\d/]) expect(text).not.toMatch(b);
  });
});
