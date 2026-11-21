import { lightTheme, darkTheme } from '@/config/theme';
import { BLADDER, floorDeepest, floorPoint, floorWidthPx, LANDMARKS, organCentres, organClearance, POSE_CONTRACTED, POSE_REST, RECTUM } from '@/features/intro-anatomy/paths';


/** SPEC_ANIMASYON_PELVIK §3 and ANIM_A0_DUZELTME §3: where the muscle is, how it moves, organs on top. */
describe('pelvic floor geometry', () => {
  it('the muscle runs from the back-lower edge of the pubis to the coccyx tip, and its ends never move', () => {
    for (const c of [0, 0.5, 1]) {
      expect(floorPoint(c, 0)).toEqual(LANDMARKS.pubisBackLower);
      expect(floorPoint(c, 1)).toEqual(LANDMARKS.coccyxTip);
    }
    expect(LANDMARKS.pubisBackLower[0]).toBeGreaterThan(LANDMARKS.coccyxTip[0]);
  });

  it('at rest it hangs 14 units below the line joining its ends', () => {
    expect(floorDeepest(0).depth).toBeCloseTo(14, 1);
  });

  it('contracting lifts the deepest point 12 up and 6 towards the pubis, and it stays a shallow bowl', () => {
    const rest = floorDeepest(0);
    const held = floorDeepest(1);
    expect(rest.y - held.y).toBeCloseTo(12, 0);
    expect(held.x - rest.x).toBeCloseTo(6, 0);
    expect(held.depth).toBeGreaterThan(1);
    expect(held.depth).toBeLessThan(4);
  });

  it('the line is 8 px at rest and 10 px contracted', () => {
    expect(floorWidthPx(0)).toBe(8);
    expect(floorWidthPx(1)).toBe(10);
  });

  it.each([
    ['rest', POSE_REST],
    ['contracted', POSE_CONTRACTED],
  ] as const)('%s: both organs sit on the muscle (0–2 units above its upper edge), never below it', (_, pose) => {
    const half = floorWidthPx(pose.contract) / pose.scale / 2;
    const at = organCentres(pose);
    for (const [o, c] of [
      [BLADDER, at.bladder],
      [RECTUM, at.rectum],
    ] as const) {
      const gap = organClearance(o, c, pose.contract, half);
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThanOrEqual(2);
    }
  });

  it('organs rise and move forwards with the muscle', () => {
    const a = organCentres(POSE_REST);
    const b = organCentres(POSE_CONTRACTED);
    for (const k of ['bladder', 'rectum'] as const) {
      expect(b[k][0] - a[k][0]).toBeCloseTo(3, 5);
      expect(a[k][1] - b[k][1]).toBeGreaterThan(4);
    }
  });

  it('the bladder sits behind the pubis, the bowel in front of the sacrum', () => {
    const at = organCentres(POSE_REST);
    expect(at.bladder[0]).toBeGreaterThan(at.rectum[0]);
    expect(at.bladder[0] + BLADDER.rx).toBeLessThan(LANDMARKS.pubisBackLower[0]);
  });

  it('the comparison frames share one camera, so the bones stay put', () => {
    expect([POSE_CONTRACTED.scale, POSE_CONTRACTED.cx, POSE_CONTRACTED.cy]).toEqual([POSE_REST.scale, POSE_REST.cx, POSE_REST.cy]);
  });

  it('the animation colours are the same in both themes', () => {
    expect(lightTheme.anatomy).toEqual(darkTheme.anatomy);
  });
});
