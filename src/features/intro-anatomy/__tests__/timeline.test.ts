import fs from 'fs';
import path from 'path';

import { floorPath, pathLength } from '../paths';
import { ease, poseAt, poseAtReduced, SCENES, sceneIndexAt, TOTAL_MS, track, TRACKS } from '../timeline';

/** SPEC_ANIMASYON_PELVIK §4, §5, §8 and §9 (tests), ANIM_A0_DUZELTME §4 (labels). */
const tr = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../i18n/tr.json'), 'utf8')) as Record<string, unknown>;
const get = (key: string) => key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], tr);

describe('scenes', () => {
  it('8 scenes add up to 50 000 ms, back to back with no gap or overlap', () => {
    expect(SCENES).toHaveLength(8);
    expect(SCENES[0]!.start).toBe(0);
    expect(SCENES.at(-1)!.end).toBe(TOTAL_MS);
    expect(TOTAL_MS).toBe(50000);
    expect(SCENES.reduce((n, s) => n + (s.end - s.start), 0)).toBe(50000);
    for (let i = 1; i < SCENES.length; i++) expect(SCENES[i]!.start).toBe(SCENES[i - 1]!.end);
  });

  it('every scene has its caption in tr.json, word for word as in the spec', () => {
    for (const s of SCENES) expect([s.caption, typeof get(s.caption)]).toEqual([s.caption, 'string']);
    expect(get('introAnatomy.captions.s3')).toBe('Altında, hamak gibi gerilen bir kas var: pelvik taban.');
  });

  it('finds the scene playing at any time', () => {
    expect(sceneIndexAt(0)).toBe(0);
    expect(sceneIndexAt(4999)).toBe(0);
    expect(sceneIndexAt(5000)).toBe(1);
    expect(sceneIndexAt(49999)).toBe(7);
    expect(sceneIndexAt(60000)).toBe(7);
  });

  it('every track key lies inside the 50 s and in time order', () => {
    for (const [name, keys] of Object.entries(TRACKS))
      keys.forEach(([t], i) => {
        expect([name, t >= 0 && t <= TOTAL_MS]).toEqual([name, true]);
        if (i > 0) expect([name, t > keys[i - 1]![0]]).toEqual([name, true]);
      });
  });
});

describe('easing and tracks', () => {
  it('standard and sine easing start at 0, end at 1 and rise in between', () => {
    for (const e of ['standard', 'sine', 'linear'] as const) {
      expect(ease(e, 0)).toBeCloseTo(0, 3);
      expect(ease(e, 1)).toBeCloseTo(1, 3);
      expect(ease(e, 0.6)).toBeGreaterThan(ease(e, 0.4));
    }
    expect(ease('sine', 0.5)).toBeCloseTo(0.5, 5);
  });

  it('a track holds its first value before and its last value after', () => {
    const k = [[100, 2], [200, 4]] as const;
    expect(track(k, 0)).toBe(2);
    expect(track(k, 300)).toBe(4);
    expect(track(k, 150)).toBeGreaterThan(2);
  });
});

describe('scenes 1–4 (A1)', () => {
  it('scene 1: the silhouette fades in rising 12 units; the pelvis light blinks twice and ends off', () => {
    expect(poseAt(0)).toMatchObject({ silhouette: 0, silhouetteRise: 12, scale: 1 });
    expect(poseAt(1200)).toMatchObject({ silhouette: 1, silhouetteRise: 0 });
    expect(poseAt(2200).pelvisLight).toBeGreaterThan(0.9);
    expect(poseAt(3600).pelvisLight).toBeGreaterThan(0.9);
    expect(poseAt(4999)).toMatchObject({ pelvisLight: 0, bones: 0, muscle: 0, organs: 0 });
  });

  it('scene 2: zooms 1 → 2.6 on the pelvis, dims the silhouette to 35 %, draws the bones', () => {
    expect(poseAt(5000).scale).toBe(1);
    expect(poseAt(7500).scale).toBeCloseTo(2.6, 5);
    expect(poseAt(8000).silhouette).toBeCloseTo(0.35, 5);
    expect(poseAt(8000).bonesDraw).toBeGreaterThan(0.2);
    expect(poseAt(8000).bonesDraw).toBeLessThan(1);
    expect(poseAt(9000).bonesDraw).toBe(1);
  });

  it('scene 3: the muscle is drawn 11.5–14.5 s, sags 2 units once, and its label appears', () => {
    expect(poseAt(11400).muscle).toBe(0);
    expect(poseAt(13000).muscleDraw).toBeGreaterThan(0);
    expect(poseAt(13000).muscleDraw).toBeLessThan(1);
    expect(poseAt(15000).sag).toBeCloseTo(2, 5);
    expect(poseAt(15600).sag).toBe(0);
    expect(poseAt(14400).labelFloor).toBe(0);
    expect(poseAt(15000).labelFloor).toBe(1);
  });

  it('scene 4: the organs land from 4 units above, the muscle gives 3 units, the organ labels appear', () => {
    expect(poseAt(18000)).toMatchObject({ organs: 0, organsDrop: -4 });
    expect(poseAt(19000)).toMatchObject({ organs: 1, organsDrop: 0 });
    expect(poseAt(19300).sag).toBeCloseTo(3, 5);
    expect(poseAt(20000).sag).toBe(0);
    expect(poseAt(19400).labelOrgans).toBe(0);
    expect(poseAt(20000).labelOrgans).toBe(1);
    expect(poseAt(23999)).toMatchObject({ contract: 0, glow: 0, scale: 2.6 });
  });

  it('labels go out as scene 7 starts', () => {
    expect(poseAt(37600)).toMatchObject({ labelFloor: 0, labelOrgans: 0 });
  });
});

describe('contraction (scenes 5–6, data for A2)', () => {
  it('contracts over 3 s, holds, and releases over 4 s (longer on purpose)', () => {
    expect(poseAt(25000).contract).toBe(0);
    expect(poseAt(28000).contract).toBe(1);
    expect(poseAt(30000).contract).toBe(1);
    expect(poseAt(35000).contract).toBe(0);
    const g = [28200, 28600, 29000, 29400].map((t) => poseAt(t).glow);
    expect(Math.min(...g)).toBeGreaterThanOrEqual(0.8);
    expect(Math.max(...g)).toBeLessThanOrEqual(1);
  });
});

describe('reduce motion (§8)', () => {
  it('the camera does not move inside a scene', () => {
    for (const s of SCENES) {
      const scales = [s.start, (s.start + s.end) / 2, s.end - 1].map((t) => poseAtReduced(t).scale);
      expect([s.id, new Set(scales).size]).toEqual([s.id, 1]);
    }
  });

  it('nothing is drawn on: lines are complete when shown; scenes fade in over 300 ms', () => {
    expect(poseAtReduced(10000).bonesDraw).toBe(1);
    expect(poseAtReduced(12000).muscleDraw).toBe(1);
    expect(poseAtReduced(5150).fade).toBeCloseTo(0.5, 5);
    expect(poseAtReduced(5400).fade).toBe(1);
  });

  it('the contraction is still shown, over 600 ms', () => {
    expect(poseAtReduced(24000).contract).toBe(0);
    expect(poseAtReduced(24300).contract).toBeCloseTo(0.5, 5);
    expect(poseAtReduced(24600).contract).toBe(1);
  });
});

describe('path lengths (draw-on)', () => {
  it('measures straight and curved paths', () => {
    expect(pathLength('M0 0 L3 4')).toBeCloseTo(5, 5);
    expect(pathLength('M0 0 L10 0 L10 10 Z')).toBeCloseTo(10 + 10 + Math.SQRT2 * 10, 5);
    expect(pathLength(floorPath(0))).toBeGreaterThan(39);
  });
});
