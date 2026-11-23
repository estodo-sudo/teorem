import { androidWaveform, boostIntensity, dutyFor, cueForHoldSecond, cueForPhase, cueLengthMs, hapticEvents, iosFallbackCalls, onOffPattern, phaseVibration, PREVIEW_CUES, RUMBLE_GRAIN_MS, scaleEvents, type Cue, type HapticEvent } from '@/features/training/hapticPatterns';
import { voiceKeyForPhase } from '@/features/training/voice';
import tr from '@/i18n/tr.json';

const pulses = (cue: Cue) => hapticEvents(cue, 3).filter((e) => e.type === 'transient').length;
const ramp = (cue: Cue) => hapticEvents(cue, 3).find((e): e is Extract<HapticEvent, { type: 'continuous' }> => e.type === 'continuous');
/** Amplitudes of the vibrating segments of an Android waveform. */
const amps = (cue: Cue, strength: 1 | 2 | 3 = 3) => {
  const w = androidWaveform(hapticEvents(cue, strength));
  return w.amplitudes.filter((a) => a > 0);
};

describe('Titreşim Dili v2 (spec 7.4)', () => {
  it('vibration is felt 60 % stronger app-wide, without losing the strength order', () => {
    expect(boostIntensity(0.25)).toBeCloseTo(0.4, 5);
    expect(boostIntensity(0.5)).toBeCloseTo(0.8, 5);
    expect(boostIntensity(1)).toBe(1);
    for (let x = 0; x < 1; x += 0.05) expect(boostIntensity(x + 0.05)).toBeGreaterThan(boostIntensity(x));
  });

  it('off means nothing; strengths scale the intensity (light < normal < strong)', () => {
    expect(hapticEvents('squeezeStart', 0)).toEqual([]);
    const peak = (s: 1 | 2 | 3) => Math.max(...hapticEvents('quickFlick', s).map((e) => e.intensity));
    expect(peak(1)).toBeLessThan(peak(2));
    expect(peak(2)).toBeLessThan(peak(3));
    expect(peak(3)).toBe(1);
  });

  it('squeeze: 300 ms rising ramp 0.3 → 1.0; release: 500 ms falling ramp 0.6 → 0 plus a soft double pulse', () => {
    // Intensities carry the app-wide +60 % (boostIntensity): 0.3 → 0.48, 0.6 → 0.893, 1 stays 1.
    expect(ramp('squeezeStart')).toMatchObject({ duration: 300, intensity: 0.48, intensityEnd: 1 });
    expect(ramp('releaseStart')).toMatchObject({ duration: 500, intensity: 0.893, intensityEnd: 0 });
    expect(pulses('releaseStart')).toBe(2);
    expect(
      hapticEvents('releaseStart', 3)
        .filter((e) => e.type === 'transient')
        .every((e) => e.sharpness <= 0.2),
    ).toBe(true);
  });

  it('hold ticks 0.25, last 3 s 0.5 (×1.6 app gain); quick flick one sharp pulse; floors 1/2/3 pulses; cough sharp double', () => {
    expect(hapticEvents('holdTick', 3)).toEqual([{ type: 'transient', time: 0, intensity: 0.4, sharpness: 0.3 }]);
    expect(hapticEvents('holdTickFinal', 3)[0]!.intensity).toBe(0.8);
    expect(hapticEvents('quickFlick', 3)).toEqual([{ type: 'transient', time: 0, intensity: 1, sharpness: 1 }]);
    expect([pulses('elevatorFloor1'), pulses('elevatorFloor2'), pulses('elevatorFloor3')]).toEqual([1, 2, 3]);
    expect(hapticEvents('knackCough', 3).map((e) => e.sharpness)).toEqual([1, 1]);
    // Block change: long then short.
    const bc = hapticEvents('blockChange', 3);
    expect(bc.map((e) => e.type)).toEqual(['continuous', 'transient']);
    // Session end: three rising pulses.
    const end = hapticEvents('sessionEnd', 3).map((e) => e.intensity);
    expect(end).toHaveLength(3);
    expect(end[0]! < end[1]! && end[1]! < end[2]!).toBe(true);
  });

  it('Android waveform: squeeze rises, release falls, so they feel different', () => {
    const up = amps('squeezeStart');
    const down = androidWaveform(hapticEvents('releaseStart', 3))
      .amplitudes.slice(0, 10)
      .filter((a) => a > 0);
    expect(up.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < up.length; i++) expect(up[i]!).toBeGreaterThanOrEqual(up[i - 1]!);
    expect(up.at(-1)).toBe(255);
    for (let i = 1; i < down.length; i++) expect(down[i]!).toBeLessThanOrEqual(down[i - 1]!);
    const w = androidWaveform(hapticEvents('squeezeStart', 3));
    expect(w.timings.reduce((a, b) => a + b, 0)).toBe(300);
    expect(w.timings.length).toBe(w.amplitudes.length);
    expect(amps('squeezeStart', 1).at(-1)!).toBeLessThan(255);
  });

  it('Android waveform keeps gaps between pulses and drops a silent tail', () => {
    const w = androidWaveform(hapticEvents('elevatorFloor3', 3));
    expect(w.amplitudes.filter((a) => a > 0)).toHaveLength(3);
    expect(w.amplitudes.filter((a) => a === 0)).toHaveLength(2);
    expect(w.amplitudes.at(-1)).not.toBe(0);
    expect(androidWaveform([])).toEqual({ timings: [], amplitudes: [] });
  });

  it('on/off fallback: [off, on…] pairs; squeeze pulses lengthen, release pulses shorten', () => {
    const sq = onOffPattern(hapticEvents('squeezeStart', 3));
    expect(sq.length % 2).toBe(0);
    const on = (p: number[]) => p.filter((_, i) => i % 2 === 1);
    const sqOn = on(sq);
    expect(sqOn.at(-1)!).toBeGreaterThan(sqOn[0]!);
    const relOn = on(onOffPattern([hapticEvents('releaseStart', 3)[0]!]));
    expect(relOn.at(-1)!).toBeLessThan(relOn[0]!);
    expect(on(onOffPattern(hapticEvents('elevatorFloor2', 3)))).toHaveLength(2);
  });

  it('iOS fallback (no Core Haptics) still plays something for every cue, sharp ones as rigid', () => {
    for (const cue of PREVIEW_CUES) expect([cue, iosFallbackCalls(hapticEvents(cue, 2)).length > 0]).toEqual([cue, true]);
    expect(iosFallbackCalls(hapticEvents('quickFlick', 3))).toEqual([{ style: 'rigid', delayMs: 0 }]);
    const calls = iosFallbackCalls(hapticEvents('releaseStart', 3)).map((c) => c.delayMs);
    expect([...calls].sort((a, b) => a - b)).toEqual(calls);
  });

  it('v1 cue names used elsewhere in the app keep working', () => {
    for (const cue of ['contractStart', 'contractTick', 'relaxStart', 'releaseStage', 'exerciseEnd', 'breatheIn', 'breatheOut', 'countdownTick', 'tap', 'sessionEnd'] as Cue[]) expect(hapticEvents(cue, 2).length).toBeGreaterThan(0);
    expect(pulses('exerciseEnd')).toBe(3);
    expect(pulses('relaxStart')).toBe(2);
  });

  it('every try-screen cue has a title and text; lengths fit the preview spacing', () => {
    const cueText = (tr as unknown as { settings: { training: { cue: Record<string, { title: string; text: string }> } } }).settings.training.cue;
    for (const cue of PREVIEW_CUES) {
      expect(cueText[cue]?.title).toBeTruthy();
      expect(cueLengthMs(cue)).toBeLessThanOrEqual(1800);
    }
  });
});

describe('phase → cue', () => {
  it('maps the player phases', () => {
    expect(cueForPhase({ kind: 'contract', durationMs: 5000 }, 'slow_hold')).toBe('squeezeStart');
    expect(cueForPhase({ kind: 'contract', durationMs: 1000 }, 'quick_flick')).toBe('quickFlick');
    expect(cueForPhase({ kind: 'contract', durationMs: 4000, variant: 'slowUp' }, 'elevator')).toBe('slowSqueeze');
    expect(cueForPhase({ kind: 'release', durationMs: 4000, variant: 'slowDown' }, 'elevator')).toBe('slowRelease');
    expect(cueForPhase({ kind: 'rest', durationMs: 3000, variant: 'settle' }, 'release')).toBeNull();
    expect(cueForPhase({ kind: 'contract', durationMs: 2000, stage: 1 }, 'elevator')).toBe('elevatorFloor1');
    expect(cueForPhase({ kind: 'contract', durationMs: 4000, stage: 3 }, 'elevator')).toBe('elevatorFloor3');
    expect(cueForPhase({ kind: 'release', durationMs: 1000, stage: 2 })).toBe('elevatorDown');
    expect(cueForPhase({ kind: 'cough', durationMs: 1500 }, 'knack')).toBe('knackCough');
    expect(cueForPhase({ kind: 'relax', durationMs: 6000 })).toBe('releaseStart');
    expect(cueForPhase({ kind: 'relax', durationMs: 1000 }, 'quick_flick')).toBeNull();
    expect(cueForPhase({ kind: 'transition', durationMs: 4000 })).toBe('blockChange');
    expect(cueForPhase({ kind: 'inhale', durationMs: 4000 })).toBe('breatheIn');
    expect(cueForPhase({ kind: 'countdown', durationMs: 3000 })).toBe('countdownTick');
  });

  it('hold ticks every second, stronger in the last 3; none for short squeezes or floors', () => {
    const hold = { kind: 'contract', durationMs: 8000 };
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((s) => cueForHoldSecond(hold, s))).toEqual(['holdTick', 'holdTick', 'holdTick', 'holdTick', 'holdTickFinal', 'holdTickFinal', 'holdTickFinal', null]);
    expect(cueForHoldSecond({ kind: 'contract', durationMs: 1000 }, 1)).toBeNull();
    expect(cueForHoldSecond({ kind: 'contract', durationMs: 4000, stage: 3 }, 1)).toBeNull();
    expect(cueForHoldSecond({ kind: 'relax', durationMs: 6000 }, 2)).toBeNull();
  });

  it('voice coach says short commands, nothing on very short phases', () => {
    expect(voiceKeyForPhase({ kind: 'contract', durationMs: 5000 })).toBe('squeeze');
    expect(voiceKeyForPhase({ kind: 'contract', durationMs: 1000 })).toBeNull();
    expect(voiceKeyForPhase({ kind: 'relax', durationMs: 6000 })).toBe('release');
    expect(voiceKeyForPhase({ kind: 'cough', durationMs: 1500 })).toBe('cough');
    expect(voiceKeyForPhase({ kind: 'exhale', durationMs: 6000 }, 'release')).toBe('letGo');
    expect(voiceKeyForPhase({ kind: 'contract', durationMs: 4000, variant: 'slowUp' })).toBe('slowSqueeze');
    expect(voiceKeyForPhase({ kind: 'release', durationMs: 4000, variant: 'slowDown' })).toBe('slowRelease');
    expect(voiceKeyForPhase({ kind: 'relax', durationMs: 6000, variant: 'letGo' })).toBe('release');
    const voice = (tr as unknown as { player: { voice: Record<string, string> } }).player.voice;
    for (const k of ['squeeze', 'release', 'cough', 'inhale', 'exhale', 'letGo', 'floor1', 'floor2', 'floor3']) expect(voice[k]).toBeTruthy();
  });
});

describe('Kegel vibration follows the squeeze, like an earthquake (user decision 2026-11-22)', () => {
  const total = (ev: HapticEvent[]) => ev.reduce((a, e) => a + (e.type === 'continuous' ? e.duration : 0), 0);
  const hold = phaseVibration({ kind: 'contract', durationMs: 12000 });
  it('uzun sıkma rumbles for the whole hold with no time gap, and stops when it lets go', () => {
    expect(total(hold)).toBe(12000);
    hold.forEach((e, i) => expect(e.time).toBe(i * RUMBLE_GRAIN_MS));
    for (const kind of ['relax', 'transition', 'rest', 'countdown']) expect(phaseVibration({ kind, durationMs: 5000 })).toEqual([]);
  });
  it('never off, but the strength dips every few hundredths of a second (uneven)', () => {
    const amps = hold.map((e) => e.intensity);
    expect(Math.min(...amps)).toBeGreaterThanOrEqual(0.5);
    expect(Math.max(...amps)).toBe(1);
    expect(new Set(amps).size).toBeGreaterThan(5);
    const w = androidWaveform(scaleEvents(hold, 3));
    expect(w.timings.reduce((a, b) => a + b, 0)).toBe(12000);
    expect(w.amplitudes.every((a) => a > 0)).toBe(true);
    // On/off-only phones: on most of the time, only hairline gaps (≤ 20 ms) where it dips.
    const p = onOffPattern(scaleEvents(hold, 3));
    const offs = p.filter((_, i) => i % 2 === 0).slice(1);
    expect(Math.max(...offs)).toBeLessThanOrEqual(20);
    expect(p.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0)).toBeGreaterThan(12000 * 0.8);
  });
  it('hızlı sık-bırak: rumbles for the 1 s squeeze, the 1 s let-go is silent', () => {
    expect(total(phaseVibration({ kind: 'contract', durationMs: 1000 }))).toBe(1000);
    expect(phaseVibration({ kind: 'relax', durationMs: 1000 })).toEqual([]);
  });
  it('yavaş sıkma builds up while squeezing slowly and is full at the top', () => {
    const up = phaseVibration({ kind: 'contract', durationMs: 3000, variant: 'slowUp' }).map((e) => e.intensity);
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    expect(avg(up.slice(0, 15))).toBeLessThan(avg(up.slice(-15)));
    expect(total(phaseVibration({ kind: 'contract', durationMs: 500, variant: 'top' }))).toBe(500);
  });
  it('after a pause it vibrates only for what is left of the squeeze; off means nothing', () => {
    expect(total(phaseVibration({ kind: 'contract', durationMs: 12000 }, 4000))).toBe(8000);
    expect(phaseVibration({ kind: 'contract', durationMs: 12000 }, 11990)).toEqual([]);
    expect(scaleEvents(hold, 0)).toEqual([]);
  });
});

describe('strength setting is really felt (user report 2026-11-23)', () => {
  const peak = (strength: 1 | 2 | 3) => Math.max(...hapticEvents('squeezeStart', strength).map((e) => (e.type === 'continuous' ? Math.max(e.intensity, e.intensityEnd) : e.intensity)));
  it('Light, Normal and Strong are clearly apart (about 45 / 75 / 100 %)', () => {
    const [l, n, s] = [peak(1), peak(2), peak(3)];
    expect(n - l).toBeGreaterThan(0.2);
    expect(s - n).toBeGreaterThan(0.2);
    expect(s).toBe(1);
  });

  it('on/off-only phones (Expo Go) vibrate for less of the time at a lighter strength', () => {
    const steady: HapticEvent[] = [{ type: 'continuous', time: 0, duration: 1000, intensity: 1, intensityEnd: 1, sharpness: 0.3 }];
    const onTime = (strength: 1 | 2 | 3) => onOffPattern(scaleEvents(steady, strength)).filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);
    expect(onTime(3)).toBe(1000);
    expect(onTime(2)).toBeLessThan(onTime(3));
    expect(onTime(1)).toBeLessThan(onTime(2) * 0.8);
    expect(dutyFor(1)).toBe(1);
  });

  it('iPhone impacts get lighter with the strength setting', () => {
    const styles = (cue: Cue, strength: 1 | 2 | 3) => [...new Set(iosFallbackCalls(hapticEvents(cue, strength)).map((c) => c.style))];
    expect(styles('squeezeStart', 3)).toContain('heavy');
    expect(styles('squeezeStart', 1)).not.toContain('heavy');
    // Sharp cues are rigid only when strong enough, so Light quick flicks are softer too.
    expect(styles('quickFlick', 1)).not.toEqual(styles('quickFlick', 3));
  });
});

