import fs from 'fs';
import path from 'path';

import { cleanAnswers, clampHold, HOLD_ATTEMPTS, HOLD_MAX_MS, HOLD_REST_SEC, personalRecords, QUICK_SEC, SELF_RATING, scoreFor, scoreTrend, selfRatingDue, selfRatingQuestions, selfRatingTrend, TEST_POSITION } from '@/features/training/strengthV2';
import tr from '@/i18n/tr.json';
import type { SelfRating, StrengthTest, TrackId } from '@/types';

const root = path.join(__dirname, '..');
const test = (date: string, holdBestMs: number, quickCount: number, extra: Partial<StrengthTest> = {}): StrengthTest => ({ id: date, date, holdBestMs, holdAttemptsMs: [holdBestMs], quickCount, ...extra });

describe('Güç Testi v2 (spec 9)', () => {
  it('fixed rules: 3 hold attempts up to 60 s with 20 s rest, 10 s quick test, always sitting', () => {
    expect([HOLD_ATTEMPTS, HOLD_MAX_MS, HOLD_REST_SEC, QUICK_SEC, TEST_POSITION]).toEqual([3, 60000, 20, 10, 'sitting']);
    expect(clampHold(75000)).toBe(60000);
    expect(clampHold(-5)).toBe(0);
  });

  it('personal records only beat earlier tests; the first test is not a record', () => {
    expect(personalRecords([], { holdBestMs: 9000, quickCount: 12 })).toEqual({ hold: false, quick: false });
    const prev = [test('2026-11-01', 8000, 10), test('2026-11-08', 9000, 9)];
    expect(personalRecords(prev, { holdBestMs: 9500, quickCount: 10 })).toEqual({ hold: true, quick: false });
    expect(personalRecords(prev, { holdBestMs: 9000, quickCount: 11 })).toEqual({ hold: false, quick: true });
  });

  it('Kas Skoru: the first test is the baseline (50), later ones against it, 0–100', () => {
    expect(scoreFor([], { holdBestMs: 6000, quickCount: 10 })).toBe(50);
    const prev = [test('2026-11-08', 9000, 15), test('2026-11-01', 6000, 10)];
    expect(scoreFor(prev, { holdBestMs: 12000, quickCount: 20 })).toBe(100);
    expect(scoreFor(prev, { holdBestMs: 9000, quickCount: 15 })).toBe(75);
    const trend = scoreTrend([test('2026-11-08', 9000, 15), test('2026-11-01', 6000, 10), test('2026-11-15', 3000, 5, { muscleScore: 25 })]);
    expect(trend).toEqual([
      { date: '2026-11-01', value: 50 },
      { date: '2026-11-08', value: 75 },
      { date: '2026-11-15', value: 25 },
    ]);
  });

  it('the label says it is the user’s own measure, not a medical one', () => {
    const s = (tr as unknown as { strength: Record<string, string> }).strength;
    expect(s.scoreLabel).toMatch(/tıbbi ölçüm değildir/);
    expect(s.releaseBody).toMatch(/hız ölçümü değil/);
  });

  it('the test screen fills the button bottom-up, rests 20 s, and only offers test C on the relaxation track', () => {
    const src = fs.readFileSync(path.join(root, 'app', 'strength-test.tsx'), 'utf8');
    expect(src).toMatch(/holdMs \/ HOLD_MAX_MS/);
    expect(src).toMatch(/setPhase\('rest'\)/);
    expect(src).toMatch(/relaxTrack \? 'introC' : 'done'/);
    expect(src).toMatch(/position: TEST_POSITION/);
    expect(src).toMatch(/muscleScore: score/);
  });
});

describe('monthly self rating (spec 10)', () => {
  const TRACKS: TrackId[] = ['general', 'erection', 'control', 'bladder', 'surgery', 'relax'];

  it('2–4 questions per track, 0–10, the spec questions for erection / bladder / control', () => {
    for (const t of TRACKS) {
      const q = selfRatingQuestions(t);
      expect([t, q.length >= 1 && q.length <= 4]).toEqual([t, true]);
    }
    expect(selfRatingQuestions('erection').map((q) => q.text)).toEqual(['Sertleşmenin sertliğinden memnuniyetim', 'Sertleşmeyi sürdürmekten memnuniyetim', 'Kendime güvenim']);
    expect(selfRatingQuestions('bladder').map((q) => q.id)).toEqual(['dribble', 'control']);
    expect(selfRatingQuestions('bladder')[0]!.better).toBe('low');
    expect(selfRatingQuestions('control')[0]!.text).toBe('Zamanlama üzerindeki kontrol hissim');
  });

  it('labelled as the app’s own questions, never a licensed clinical scale; no scale names', () => {
    expect(SELF_RATING.intro).toMatch(/lisanslı bir klinik ölçek/);
    const raw = fs.readFileSync(path.join(root, 'src', 'content', 'kegel', 'self-rating.tr.json'), 'utf8');
    expect(raw).not.toMatch(/IIEF|SHIM|ICIQ/);
    expect((JSON.parse(raw) as { reviewed: boolean }).reviewed).toBe(false);
  });

  it('due once a month per track; trend per question; answers cleaned to 0–10 integers of that track', () => {
    const r = (at: string, track: TrackId, answers: Record<string, number>): SelfRating => ({ id: at, at, track, answers });
    const ratings = [r('2026-10-01T10:00:00.000Z', 'bladder', { dribble: 7, control: 4 }), r('2026-10-25T10:00:00.000Z', 'bladder', { dribble: 5, control: 6 })];
    expect(selfRatingDue([], 'bladder', '2026-11-19')).toBe(true);
    expect(selfRatingDue(ratings, 'bladder', '2026-11-19')).toBe(false);
    expect(selfRatingDue(ratings, 'bladder', '2026-11-24')).toBe(true);
    expect(selfRatingDue(ratings, 'erection', '2026-11-19')).toBe(true);
    expect(selfRatingTrend(ratings, 'bladder', 'dribble')).toEqual([
      { date: '2026-10-01', value: 7 },
      { date: '2026-10-25', value: 5 },
    ]);
    expect(cleanAnswers('bladder', { dribble: 3, control: 11, hardness: 5, x: 2.5 })).toEqual({ dribble: 3 });
  });
});
