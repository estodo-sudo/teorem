import * as Haptics from 'expo-haptics';

import { introTaps, playIntroTaps } from '../haptics';
import { HAPTIC, poseAt, TRACKS } from '../timeline';

/** SPEC_ANIMASYON_PELVIK §4 (scenes 5–8) and §6 (vibration). */
describe('vibration pattern', () => {
  const taps = introTaps();
  const gaps = (from: number, to: number) => {
    const at = taps.filter((p) => p.at >= from && p.at < to).map((p) => p.at);
    return at.slice(1).map((t, i) => t - at[i]!);
  };

  it('contraction: a light tap every 180 ms, every 120 ms in its last second', () => {
    expect(taps[0]).toEqual({ at: HAPTIC.contract.start, kind: 'light' });
    expect(new Set(gaps(25000, 27000))).toEqual(new Set([180]));
    const last = gaps(27000, 28000);
    expect(last.length).toBeGreaterThan(5);
    expect(new Set(last)).toEqual(new Set([120]));
    expect(taps.filter((p) => p.at < 28000).every((p) => p.kind === 'light')).toBe(true);
  });

  it('hold: a very light tap every 600 ms', () => {
    const hold = taps.filter((p) => p.at >= 28000 && p.at < 31000);
    expect(hold.map((p) => p.at)).toEqual([28000, 28600, 29200, 29800, 30400]);
    expect(hold.every((p) => p.kind === 'soft')).toBe(true);
  });

  it('release: the gaps grow from 200 towards 700 ms and stop by 35 s', () => {
    const g = gaps(31000, 35000);
    expect(g[0]).toBe(200);
    for (let i = 1; i < g.length; i++) expect(g[i]!).toBeGreaterThan(g[i - 1]!);
    expect(g.at(-1)!).toBeLessThanOrEqual(700);
    expect(taps.at(-1)!.at).toBeLessThan(35000);
  });

  it('plays only the taps still ahead, nothing when vibration is off, and cancels at once', () => {
    jest.useFakeTimers();
    const spy = jest.spyOn(Haptics, 'impactAsync').mockResolvedValue(undefined);
    playIntroTaps(0, false)();
    jest.advanceTimersByTime(60000);
    expect(spy).not.toHaveBeenCalled();

    const cancel = playIntroTaps(30000, true);
    jest.advanceTimersByTime(500);
    expect(spy).toHaveBeenCalledTimes(1); // the hold tap at 30.4 s
    cancel();
    jest.advanceTimersByTime(10000);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
    jest.useRealTimers();
  });
});

describe('scenes 5–8', () => {
  it('contraction 25–28 s, hold to 31 s, release over 4 s (longer than the contraction)', () => {
    expect(poseAt(24999).contract).toBe(0);
    expect(poseAt(28000).contract).toBe(1);
    expect(poseAt(30999).contract).toBe(1);
    expect(poseAt(35000).contract).toBe(0);
    expect(poseAt(26500).glow).toBeCloseTo(0.5, 1);
    expect(poseAt(29000).glow).toBeGreaterThanOrEqual(0.8);
  });

  it('scene 7 lights belly, buttock and thigh in turn; the crosses stay until scene 8', () => {
    expect([poseAt(39200).wrongBelly > 0, poseAt(39200).wrongButtock, poseAt(39200).wrongThigh]).toEqual([true, 0, 0]);
    expect(poseAt(40800).wrongButtock).toBeGreaterThan(0);
    expect(poseAt(42300).wrongThigh).toBeGreaterThan(0);
    for (const k of ['markBelly', 'markButtock', 'markThigh'] as const) {
      expect(poseAt(44900)[k]).toBe(1);
      expect(poseAt(46000)[k]).toBe(0);
    }
  });

  it('the camera pulls back to 1.4 in scene 7 and to the whole figure in scene 8', () => {
    expect(poseAt(39000).scale).toBeCloseTo(1.4, 5);
    expect(poseAt(47000).scale).toBe(1);
  });

  it('labels go off as scene 7 starts', () => {
    expect(poseAt(37600).labelFloor).toBe(0);
    expect(poseAt(37600).labelOrgans).toBe(0);
  });

  it('scene 8: the glow follows the endless loop, and the buttons rise in from 46 s', () => {
    expect(poseAt(48000, 0).glow).toBeCloseTo(0.4, 5);
    expect(poseAt(48000, 1).glow).toBeCloseTo(0.8, 5);
    expect(TRACKS.buttons[0][0]).toBe(46000);
    expect(poseAt(45999).buttons).toBe(0);
    expect(poseAt(47000).buttons).toBe(1);
  });
});
