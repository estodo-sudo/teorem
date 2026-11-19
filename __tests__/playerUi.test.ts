import fs from 'fs';
import path from 'path';

import { generateSession, POSITION_CHANGE_SEC, TRANSITION_SEC } from '@/features/training/generateSession';
import { createPlayer, pause, restartExercise, start, tick } from '@/features/training/player/machine';
import { blockSegments, classifyRelease, CUE_ROTATE_MS, cueText, DOUBLE_TAP_MS, firstPosition, isDoubleTap, nextPreview, POSITION_CARDS, positionCard, segmentFill, SWIPE_PX } from '@/features/training/player/playerUi';
import { KEGEL_CUES } from '@/features/training/tracks';
import tr from '@/i18n/tr.json';

const session = generateSession({ track: 'erection', level: 12, durationPreset: 'standard', dayIndex: 0, weekIndex: 4, hypertonic: false, seed: 'x' });

describe('player screen v2 helpers (spec 7.1, 7.3)', () => {
  it('one segment per block covering the whole timeline after the countdown; the active one fills', () => {
    const segs = blockSegments(session.phases);
    expect(segs).toHaveLength(session.blocks.length);
    expect(segs.map((s) => s.exerciseIndex)).toEqual(session.blocks.map((_, i) => i));
    expect(segs.reduce((a, s) => a + s.durationMs, 0) + session.phases[0]!.durationMs).toBe(session.plannedSec * 1000);
    const mid = segs[2]!.startMs + segs[2]!.durationMs / 2;
    const f = segmentFill(segs, mid);
    expect(f.slice(0, 2)).toEqual([1, 1]);
    expect(f[2]).toBeCloseTo(0.5);
    expect(f.slice(3).every((x) => x === 0)).toBe(true);
  });

  it('technique cues fit the phase (squeeze vs release) and rotate every 8 s', () => {
    const b = session.blocks.find((x) => x.type === 'max_contraction')!;
    const texts = new Map(KEGEL_CUES.map((c) => [c.text, c.phase]));
    const sq = cueText(b, 'contract', 0)!;
    expect(texts.get(sq)).toBe('squeeze');
    const later = [0, 1, 2, 3].map((k) => cueText(b, 'contract', k * CUE_ROTATE_MS));
    expect(new Set(later).size).toBeGreaterThan(1);
    expect(cueText(undefined, 'contract', 0)).toBeNull();
  });

  it('gestures: swipe left ≥ 60 px, a short still touch is a tap, two taps within 300 ms a double tap', () => {
    expect(classifyRelease({ dx: -SWIPE_PX, dy: 5, durationMs: 200 })).toBe('swipeLeft');
    expect(classifyRelease({ dx: -40, dy: 5, durationMs: 200 })).toBe('none');
    expect(classifyRelease({ dx: -80, dy: 90, durationMs: 200 })).toBe('none');
    expect(classifyRelease({ dx: 3, dy: 2, durationMs: 150 })).toBe('tap');
    expect(classifyRelease({ dx: 3, dy: 2, durationMs: 1200 })).toBe('none');
    expect(isDoubleTap(1000, 1000 + DOUBLE_TAP_MS)).toBe(true);
    expect(isDoubleTap(1000, 1000 + DOUBLE_TAP_MS + 1)).toBe(false);
    expect(isDoubleTap(null, 5)).toBe(false);
  });

  it('"Next" preview during transitions; a position change gets a longer transition and the position card', () => {
    const transitions = session.phases.filter((p) => p.kind === 'transition');
    for (const p of transitions) {
      const n = nextPreview(session, p)!;
      expect(n.block).toBe(session.blocks[p.exerciseIndex]);
      expect(p.durationMs).toBe((n.positionChanged ? POSITION_CHANGE_SEC : TRANSITION_SEC) * 1000);
    }
    expect(transitions.some((p) => nextPreview(session, p)!.positionChanged)).toBe(true);
    expect(nextPreview(session, session.phases[1]!)).toBeNull();
    expect(firstPosition(session)).toBe('lying');
  });

  it('position cards exist for every position and are unreviewed content', () => {
    expect(POSITION_CARDS.map((c) => c.id).sort()).toEqual(['functional', 'lying', 'sitting', 'standing']);
    expect(positionCard('standing').title).toBe('Ayakta');
    const json = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'content', 'kegel', 'positions.tr.json'), 'utf8')) as { reviewed: boolean };
    expect(json.reviewed).toBe(false);
  });

  it('"restart the block" goes back to the block’s first rep (after background)', () => {
    let s = start(createPlayer(session.phases), 0).state;
    // Into the middle of the 2nd main block.
    const segs = blockSegments(session.phases);
    const t = segs[2]!.startMs + segs[2]!.durationMs * 0.6 + session.phases[0]!.durationMs * 0;
    s = tick(s, t).state;
    s = pause(s, t).state;
    const r = restartExercise(s, t + 5000).state;
    expect(r.status).toBe('running');
    const first = session.phases.findIndex((p) => p.exerciseIndex === 2 && p.kind !== 'transition');
    expect(r.index).toBe(first);
    expect(r.phaseOffsetMs).toBe(0);
  });

  it('player texts exist; pain message says Kegel should not hurt and offers release', () => {
    const p = (tr as unknown as { player: Record<string, string> }).player;
    for (const k of ['restartBlock', 'gestureHint', 'painButton', 'painTitle', 'painBody', 'painRefer', 'painRelease', 'painEnd', 'skipTitle', 'nextTitle', 'positionChange', 'blackMode']) expect([k, Boolean(p[k])]).toEqual([k, true]);
    expect(p.painBody).toMatch(/ağrı yapmamalıdır/);
    expect(p.painRefer).toMatch(/fizyoterapist/);
  });

  it('the player keeps controls ≥ 48 px, honours background, and has the black mode and pain button', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'features', 'training', 'player', 'WorkoutPlayer.tsx'), 'utf8');
    for (const m of src.matchAll(/(?:iconBtn|mainBtn): \{ width: (\d+), height: (\d+)/g)) {
      expect(Number(m[1])).toBeGreaterThanOrEqual(48);
      expect(Number(m[2])).toBeGreaterThanOrEqual(48);
    }
    expect(src).toMatch(/AppState\.addEventListener/);
    expect(src).toMatch(/restartBlock/);
    expect(src).toMatch(/backgroundColor: '#000000'/);
    expect(src).toMatch(/painButton/);
    expect(src).toMatch(/useSafeKeepAwake\(\)/);
  });
});
