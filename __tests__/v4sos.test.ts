import fs from 'fs';
import path from 'path';

import { breathState, BREATH_MODES, cyclesFor, hapticOffsets, orbTarget, sessionMs } from '@/features/breath/patterns';
import { CAMP_ONBOARDING as ONB, CAMP_SOS } from '@/features/camps/smoking/content';
import { toolGroup } from '@/features/camps/smoking/engine/checkin';
import { triggerCoverage, triggerMapGroups, triggerOrder } from '@/features/camps/smoking/engine/panel';
import type { TriggerId } from '@/features/camps/smoking/types';
import { MIGRATIONS } from '@/features/data/migrations';
import { at, canPlace, deal, emptyBoard, fitsAnywhere, hasMove, newGame, place, play, relief, SHAPES, SIZE } from '@/features/games/BlockPuzzle/engine';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));
jest.mock('expo-notifications', () => ({ setNotificationCategoryAsync: jest.fn(), scheduleNotificationAsync: jest.fn(), SchedulableTriggerInputTypes: { DATE: 'date' } }));

const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

describe('SOS tool set (SPEC_V4 §C.3)', () => {
  it('urge surfing, the matching game, 4E and the coach are gone from Sigarasız Kamp', () => {
    const files = ['app/camp/sos.tsx', 'src/features/camps/smoking/sosTools.tsx', 'src/features/camps/smoking/definition.tsx', 'src/features/camps/smoking/content.ts', 'src/features/camps/smoking/engine/sos.ts', 'src/features/camps/smoking/engine/premium.ts'];
    for (const f of files) expect([f, /UrgeSurf|MatchGameView|FourECard|newMatchGame|CAMP_COACH|'surf'|'game'|'four_e'|'coach'|\/camp\/coach/.test(read(f))]).toEqual([f, false]);
    expect(fs.existsSync(path.join(root, 'app/camp/coach.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'src/content/camp/coach.tr.json'))).toBe(false);
    expect(Object.keys(CAMP_SOS)).not.toEqual(expect.arrayContaining(['surf']));
    expect(['surf', 'fourE', 'game'].filter((k) => k in CAMP_SOS)).toEqual([]);
  });

  it('offers breath (default), the block puzzle, the 10-minute delay and reasons, in that order', () => {
    const src = read('app/camp/sos.tsx');
    const order = [...src.matchAll(/\{ id: '(\w+)', icon: '\w+' \}/g)].map((m) => m[1]);
    expect(order).toEqual(['breath', 'puzzle', 'delay', 'reasons']);
    expect(src).toMatch(/useState<SosTool>\('breath'\)/);
    expect(CAMP_SOS.puzzle.title).toBe('Blok Bulmaca');
  });

  it('old records keep their tools; statistics show them as "Diğer araçlar"', () => {
    expect(['surf', 'game', 'four_e', 'coach'].map((x) => toolGroup(x as never))).toEqual(['other', 'other', 'other', 'other']);
    expect(['breath', 'puzzle', 'delay', 'reasons', 'call171'].map((x) => toolGroup(x as never))).toEqual(['breath', 'puzzle', 'delay', 'reasons', 'call171']);
  });

  it('no content still tells users to open a removed tool', () => {
    for (const f of ['src/content/camp/missions.tr.json', 'src/content/camp/plans.tr.json', 'src/content/camp/skills.tr.json']) {
      expect([f, /aracındaki dalga sörfü|dalga sörfünü dene|dalga sörfü yapıp/i.test(read(f))]).toEqual([f, false]);
    }
  });

  it('a craving can store several triggers and a free text (migration v4)', () => {
    const m = MIGRATIONS.find((x) => x.version === 4);
    expect(m?.sql).toMatch(/ALTER TABLE camp_cravings ADD COLUMN extra TEXT/);
  });
});

describe('breath module (SPEC_V4 §C.4)', () => {
  it('has the three modes with their rhythms and durations', () => {
    expect(BREATH_MODES.quick.steps.map((s) => s.kind)).toEqual(['in', 'inMore', 'out']);
    const q = BREATH_MODES.quick.steps;
    expect(q[2]!.sec).toBeGreaterThanOrEqual(2 * (q[0]!.sec + q[1]!.sec) - 0.01);
    expect(BREATH_MODES.slow.steps).toEqual([{ kind: 'in', sec: 4 }, { kind: 'out', sec: 6 }]);
    expect(BREATH_MODES.box.steps.map((s) => s.sec)).toEqual([4, 4, 4, 4]);
    expect([BREATH_MODES.quick.minutes, BREATH_MODES.slow.minutes, BREATH_MODES.box.minutes]).toEqual([[1, 3, 5], [2, 5, 10], [2, 4]]);
    expect(BREATH_MODES.quick.defaultMinutes).toBe(1);
  });

  it('a session is whole cycles and walks through the steps', () => {
    expect(cyclesFor('slow', 2)).toBe(12);
    expect(sessionMs('quick', 1)).toBe(6 * 9000);
    expect(breathState('quick', 1, 0)).toMatchObject({ kind: 'in', cycle: 1, done: false });
    expect(breathState('quick', 1, 2500)).toMatchObject({ kind: 'inMore', step: 1 });
    expect(breathState('quick', 1, 4000)).toMatchObject({ kind: 'out', stepElapsed: 1000 });
    expect(breathState('quick', 1, 9500)).toMatchObject({ kind: 'in', cycle: 2 });
    expect(breathState('box', 2, 6000)).toMatchObject({ kind: 'hold' });
    expect(breathState('quick', 1, 10 ** 7)).toMatchObject({ done: true, remainingMs: 0, progress: 1 });
  });

  it('the orb grows in (a little more on the second breath) and shrinks out', () => {
    expect(orbTarget('in', 0.7)).toBe(1);
    expect(orbTarget('inMore', 1)).toBeGreaterThan(1);
    expect(orbTarget('out', 1.08)).toBe(0.7);
    expect(orbTarget('hold', 0.85)).toBe(0.85);
  });

  it('haptic taps get closer breathing in, further apart breathing out, none while holding', () => {
    const gaps = (xs: number[]) => xs.slice(1).map((x, i) => x - xs[i]!);
    const inn = gaps(hapticOffsets('in', 4000));
    const out = gaps(hapticOffsets('out', 6000));
    expect(inn[inn.length - 1]!).toBeLessThan(inn[0]!);
    expect(out[out.length - 1]!).toBeGreaterThan(out[0]!);
    expect(hapticOffsets('hold', 4000)).toEqual([]);
    expect(Math.max(...hapticOffsets('out', 6000))).toBeLessThan(6000);
  });

  it('is told as research with positive results, with a safety note and sources', () => {
    const tr = JSON.parse(read('src/i18n/tr.json'));
    expect(tr.breath.safety).toBe('Başın dönerse normal nefese dön.');
    expect(tr.breath.evidence).toMatch(/olumlu sonuç verdi/);
    expect(tr.breath.evidence).not.toMatch(/kanıtlanmış|garanti|tedavi eder/);
    const setup = read('src/features/breath/BreathSetup.tsx');
    expect(setup).toMatch(/Balban/);
    expect(setup).toMatch(/Zaccaro/);
  });
});

describe('Blok Bulmaca (SPEC_V4 §C.5)', () => {
  const fillRow = (b: boolean[], r: number, except: number[] = []) => {
    for (let c = 0; c < SIZE; c++) if (!except.includes(c)) b[at(r, c)] = true;
  };

  it('pieces are 1–5 cells', () => {
    expect(SHAPES.every((s) => s.length >= 1 && s.length <= 5)).toBe(true);
    expect(new Set(SHAPES.map((s) => s.length))).toEqual(new Set([1, 2, 3, 4, 5]));
  });

  it('clears a full row and a full column', () => {
    const b = emptyBoard();
    fillRow(b, 2, [5]);
    const r1 = place(b, [[0, 0]], 2, 5);
    expect(r1.lines).toBe(1);
    expect(r1.board.filter(Boolean)).toHaveLength(0);
    const c = emptyBoard();
    for (let r = 0; r < SIZE; r++) if (r !== 7) c[at(r, 3)] = true;
    const r2 = place(c, [[0, 0]], 7, 3);
    expect(r2.lines).toBe(1);
    expect(r2.cleared).toHaveLength(SIZE);
    expect(r2.points).toBe(1 + 10);
  });

  it('rejects pieces off the board or on filled cells', () => {
    const b = emptyBoard();
    b[at(0, 0)] = true;
    expect(canPlace(b, [[0, 0]], 0, 0)).toBe(false);
    expect(canPlace(b, [[0, 0], [0, 1]], 0, 7)).toBe(false);
    expect(play({ board: b, pieces: deal(() => 0), score: 0 }, 0, 0, 0)).toBeNull();
  });

  it('with no move left, half the board is cleared instead of "game over"', () => {
    const b = emptyBoard().map(() => true);
    expect(fitsAnywhere(b, [[0, 0]])).toBe(false);
    const r = relief(b);
    expect(r.cleared).toHaveLength(32);
    expect(hasMove(r.board, [{ id: 1, shape: SHAPES[14]! }])).toBe(true);
  });

  it('never gets stuck: 300 random moves always leave a move', () => {
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let g = newGame(random);
    for (let i = 0; i < 300; i++) {
      const live = g.pieces.map((p, slot) => ({ p, slot })).filter((x) => x.p);
      expect(hasMove(g.board, live.map((x) => x.p!))).toBe(true);
      let moved = false;
      for (const { p, slot } of live)
        for (let r = 0; r < SIZE && !moved; r++)
          for (let c = 0; c < SIZE && !moved; c++)
            if (canPlace(g.board, p!.shape, r, c)) {
              g = play(g, slot, r, c, random)!.state;
              moved = true;
            }
      expect(moved).toBe(true);
    }
    expect(g.score).toBeGreaterThan(300);
  });

  it('is a placement puzzle, not the falling-block game (no trademark, no falling)', () => {
    const files = ['src/features/games/BlockPuzzle/engine.ts', 'src/features/games/BlockPuzzle/BlockPuzzle.tsx', 'src/i18n/tr.json', 'src/content/camp/sos.tr.json'];
    for (const f of files) expect([f, /tetris/i.test(read(f))]).toEqual([f, false]);
  });
});

describe('triggers (SPEC_V4 §C.2)', () => {
  const catalog = ONB.triggers.map((x) => x.id);

  it('"Canım çekiyor" shows every catalogue trigger, most frequent first', () => {
    const order = triggerOrder(catalog, [{ trigger: 'alcohol' }, { trigger: 'stress', triggers: ['stress', 'alcohol'] }], [{ trigger: 'phone' }]);
    expect(new Set(order)).toEqual(new Set(catalog));
    expect(order.slice(0, 3)).toEqual(['alcohol', 'stress', 'phone']);
  });

  it('the trigger map lists the whole catalogue in three groups', () => {
    const g = triggerMapGroups(catalog, ['coffee_tea', 'stress'], [{ trigger: 'alcohol' }], [], [{ trigger: 'stress' }, { trigger: 'custom' }]);
    expect(g.planned).toEqual(['stress']);
    expect(g.livedNoPlan).toEqual(expect.arrayContaining(['coffee_tea', 'alcohol']));
    expect([...g.planned, ...g.livedNoPlan, ...g.other].sort()).toEqual([...catalog].sort());
  });

  it('coverage counts lived situations only; with none it says so instead of "0 of 0"', () => {
    expect(triggerCoverage(['stress'] as TriggerId[], [{ triggers: ['alcohol', 'boredom'] }], [], [{ trigger: 'alcohol' }])).toEqual({ done: 1, total: 3 });
    expect(triggerCoverage([], [], [], [])).toEqual({ done: 0, total: 0 });
    const tr = JSON.parse(read('src/i18n/tr.json'));
    expect(tr.camp.triggers.coverageEmpty).toBe('Sık karşılaştığın durumları işaretle, her birine bir plan hazırla');
    expect(tr.camp.triggers.addOwn).toBe('Kendi durumunu ekle');
    expect(tr.camp.triggers.coverage).toBeUndefined();
  });
});
