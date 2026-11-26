import fs from 'fs';
import path from 'path';

import { ambientVolume, soundPlan } from '../soundPlan';
import { HAPTIC, SOUND, TOTAL_MS, TRACKS } from '../timeline';

/** The animation's own sounds follow the motion (timeline.ts SOUND). */
describe('intro sound', () => {
  it('the cues sit on the motion: ticks on the crosses, chime with the button', () => {
    const at = (id: string) => SOUND.cues.filter((c) => c.id === id).map((c) => c.at);
    // Contraction, hold and release have no sound (only vibration).
    expect(SOUND.cues.some((c) => c.at >= HAPTIC.contract.start && c.at < HAPTIC.release.end)).toBe(false);
    expect(at('tick')).toEqual([TRACKS.markBelly[0][0], TRACKS.markButtock[0][0], TRACKS.markThigh[0][0]]);
    expect(at('chime')).toEqual([TRACKS.buttons[0][0]]);
  });

  it('from the start: the ambient loop and every cue ahead', () => {
    const p = soundPlan(0);
    expect(p.ambient).toEqual({ offsetMs: 0 });
    expect(p.cues).toHaveLength(SOUND.cues.length);
    expect(p.cues[0]).toEqual({ id: 'tick', inMs: 39300, offsetMs: 0 });
  });

  it('resuming in the middle of a cue joins it part way, and finished cues are left out', () => {
    const p = soundPlan(46500);
    expect(p.cues[0]).toEqual({ id: 'chime', inMs: 0, offsetMs: 500 });
    expect(p.cues.some((c) => c.id === 'tick')).toBe(false);
    expect(p.ambient!.offsetMs).toBe(46500 % SOUND.ambient.loopMs);
  });

  it('nothing plays at the end (after "Geç" or when the 50 s are over)', () => {
    expect(soundPlan(TOTAL_MS)).toEqual({ ambient: null, cues: [] });
  });

  it('the ambient fades to silence over the last seconds', () => {
    expect(ambientVolume(10000)).toBe(SOUND.ambient.volume);
    expect(ambientVolume(48500)).toBeLessThan(SOUND.ambient.volume);
    expect(ambientVolume(TOTAL_MS)).toBe(0);
  });

  it('every sound file is in the app (no network)', () => {
    for (const f of ['music.m4a', 'tick.wav', 'chime.wav']) {
      expect(fs.existsSync(path.join(__dirname, '../../../../assets/sounds/intro', f))).toBe(true);
    }
  });
});
