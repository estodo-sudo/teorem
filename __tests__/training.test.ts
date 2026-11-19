import { adjustLevel, OK_STREAK_FOR_LEVEL_UP } from '@/features/training/adjustLevel';
import { contractionCount, DURATION_TOLERANCE, generateMicroSet, generateReleaseSession, generateSession, generateTrialSession, HYPERTONIC_RELEASE_SHARE, type SessionInput } from '@/features/training/generateSession';
import { clampLevel, dailyContractionCap, getLevel, HYPERTONIC_HOLD_CAP_SEC, LEVELS, MAX_LEVEL, sessionContractionCap, startingLevelFor } from '@/features/training/levels';
import { applyReturn, applySessionResult, defaultTraining, migrateTraining, setManualLevel, todayPlanDay, todayWeekIndex } from '@/features/training/plan';
import { capStatus, deloadDue, isPlanDeloadDay, missedDaysPolicy, muscleScore, painPolicy, refreshFreezes, screeningToTrack, sessionAllowed, strengthFallingTwoWeeks, validVacation } from '@/features/training/schedule';
import { CONTRACTION_TYPES, DURATION_SEC, goalsToTrack, KEGEL_CUES, KEGEL_TRACKS, positionsFor, shorterPreset, trackAllowed } from '@/features/training/tracks';
import type { GeneratedSession } from '@/features/training/types';
import type { DurationPreset, StrengthTest, TrackId, TrainingState } from '@/types';

const SEED = '2026-11-15';
const TRACKS: TrackId[] = ['general', 'erection', 'control', 'bladder', 'surgery', 'relax'];
const PRESETS: DurationPreset[] = ['quick', 'standard', 'full'];
const input = (o: Partial<SessionInput> = {}): SessionInput => ({ track: 'general', level: 8, durationPreset: 'standard', dayIndex: 0, weekIndex: 0, hypertonic: false, seed: SEED, ...o });

/** Every combination the generator can see (sampled levels, days and weeks). */
function* everySession(): Generator<[SessionInput, GeneratedSession]> {
  for (const track of TRACKS)
    for (const durationPreset of PRESETS)
      for (const level of [1, 4, 5, 9, 15, 22, 30])
        for (const [dayIndex, weekIndex] of [
          [0, 0],
          [1, 1],
          [3, 3],
          [4, 5],
          [12, 9],
        ] as const)
          for (const hypertonic of [false, true]) {
            const i = input({ track, durationPreset, level, dayIndex, weekIndex, hypertonic });
            yield [i, generateSession(i)];
          }
}

const contractSec = (s: GeneratedSession, i: number) => s.phases.filter((p) => p.exerciseIndex === i && (p.kind === 'contract' || p.kind === 'cough')).reduce((a, p) => a + p.durationMs, 0);
const restSec = (s: GeneratedSession, i: number) => s.phases.filter((p) => p.exerciseIndex === i && (p.kind === 'relax' || p.kind === 'release')).reduce((a, p) => a + p.durationMs, 0);

describe('levels v2: intensity, never length', () => {
  it('has 30 levels and never lowers intensity from one level to the next', () => {
    expect(LEVELS).toHaveLength(30);
    LEVELS.forEach((l, i) => expect(l.level).toBe(i + 1));
    for (let i = 1; i < LEVELS.length; i++) {
      for (const k of ['holdSec', 'maxHoldSec', 'enduranceSec', 'elevatorTopSec', 'sessionCap'] as const) expect(LEVELS[i]![k]).toBeGreaterThanOrEqual(LEVELS[i - 1]![k]);
      expect(LEVELS[i]!.restFactor).toBeLessThanOrEqual(LEVELS[i - 1]!.restFactor);
    }
    expect(getLevel(1).holdSec).toBe(3);
    expect(getLevel(30).holdSec).toBe(10);
    expect(getLevel(30).maxHoldSec).toBe(5);
    expect(getLevel(4).enduranceSec).toBe(0);
    expect(getLevel(5).enduranceSec).toBe(10);
    expect(getLevel(30).enduranceSec).toBe(30);
  });

  it('clamps levels and maps experience to a start level', () => {
    expect(clampLevel(0)).toBe(1);
    expect(clampLevel(99)).toBe(30);
    expect(clampLevel(NaN)).toBe(1);
    expect(getLevel(-3).level).toBe(1);
    expect([startingLevelFor('none'), startingLevelFor('some'), startingLevelFor('regular'), startingLevelFor(null)]).toEqual([1, 3, 5, 1]);
  });

  it('the session length does not grow with the level (preset only)', () => {
    for (const durationPreset of PRESETS) {
      const lengths = [1, 10, 20, 30].map((level) => generateSession(input({ level, durationPreset })).plannedSec);
      for (const l of lengths) expect(Math.abs(l - DURATION_SEC[durationPreset]) / DURATION_SEC[durationPreset]).toBeLessThanOrEqual(DURATION_TOLERANCE);
    }
  });
});

describe('generateSession v2 constraints (spec 6.4)', () => {
  it('total length within ±10 % of the preset, for every track / level / week / profile', () => {
    for (const [i, s] of everySession()) {
      const target = DURATION_SEC[i.durationPreset];
      expect([i, Math.abs(s.plannedSec - target) / target <= DURATION_TOLERANCE]).toEqual([i, true]);
    }
  });

  it('every block rests at least as long as it contracts (quick 1:1, hold 1:1–1:2, max 1:2)', () => {
    for (const [i, s] of everySession()) {
      s.blocks.forEach((b, k) => {
        if (!CONTRACTION_TYPES.has(b.type)) return;
        expect([i.track, b.type, restSec(s, k) >= contractSec(s, k)]).toEqual([i.track, b.type, true]);
        if (b.type === 'quick_flick') expect(b.restSec).toBe(b.holdSec);
        if (b.type === 'slow_hold') expect(b.restSec / b.holdSec!).toBeGreaterThanOrEqual(1);
        if (b.type === 'slow_hold') expect(b.restSec / b.holdSec!).toBeLessThanOrEqual(2);
        if (b.type === 'max_contraction') expect(b.restSec).toBe(2 * b.holdSec!);
      });
    }
  });

  it('never more contractions than the level cap', () => {
    for (const [i, s] of everySession()) expect(s.contractions).toBeLessThanOrEqual(sessionContractionCap(i.level));
  });

  it('hypertonic profile: holds ≤ 5 s and at least 40 % release', () => {
    for (const [i, s] of everySession()) {
      if (!i.hypertonic) continue;
      const holds = s.phases.filter((p) => p.kind === 'contract').map((p) => p.durationMs);
      expect(Math.max(...holds)).toBeLessThanOrEqual(HYPERTONIC_HOLD_CAP_SEC * 1000);
      const calm = s.blocks.reduce((a, b, k) => a + (b.type === 'release' || b.type === 'breath' ? s.phases.filter((p) => p.exerciseIndex === k).reduce((x, p) => x + p.durationMs, 0) : 0), 0);
      expect([i.track, i.durationPreset, calm / (s.plannedSec * 1000) >= HYPERTONIC_RELEASE_SHARE]).toEqual([i.track, i.durationPreset, true]);
    }
  });

  it('deterministic for the same input; the day changes the block order', () => {
    expect(generateSession(input({ dayIndex: 3 }))).toEqual(generateSession(input({ dayIndex: 3 })));
    const types = (dayIndex: number) =>
      generateSession(input({ dayIndex }))
        .blocks.map((b) => b.type)
        .join();
    expect(types(0)).not.toBe(types(1));
  });

  it('structure: countdown, then the main blocks; no breathing (inhale/exhale) phases anywhere', () => {
    const s = generateSession(input({ durationPreset: 'full', level: 12 }));
    expect(s.phases[0]!.kind).toBe('countdown');
    expect(s.blocks.filter((b) => b.role === 'main')).toHaveLength(5);
    expect(generateSession(input({ durationPreset: 'quick' })).blocks.filter((b) => b.role === 'main')).toHaveLength(3);
    expect(s.blocks.some((b) => b.type === 'breath' || b.role === 'warmup')).toBe(false);
    // Only a gentle release block may close the session (rest, not more squeezing).
    for (const b of s.blocks.filter((x) => x.role === 'cooldown')) expect(b.type).toBe('release');
    for (const [, x] of everySession()) expect(x.phases.some((p) => p.kind === 'inhale' || p.kind === 'exhale')).toBe(false);
    expect(s.plannedSec).toBe(Math.round(s.phases.reduce((a, p) => a + p.durationMs, 0) / 1000));
    expect(s.exercises.map((e) => e.type)).toEqual(s.blocks.map((b) => b.type));
  });

  it('a release rep is "loosen" then "let go fully" — no breathing commands', () => {
    const s = generateSession(input({ track: 'relax', level: 10 }));
    const i = s.blocks.findIndex((b) => b.type === 'release');
    expect(s.phases.filter((p) => p.exerciseIndex === i && p.rep === 1).map((p) => `${p.kind}:${p.variant}`)).toEqual(['rest:settle', 'relax:letGo']);
  });

  it('deload week: 20 % fewer contractions, same length', () => {
    for (const track of TRACKS) {
      const normal = generateSession(input({ track, level: 14, weekIndex: 2 }));
      const light = generateSession(input({ track, level: 14, weekIndex: 2, deload: true }));
      if (normal.contractions === 0) continue;
      expect([track, light.contractions <= Math.round(normal.contractions * 0.85)]).toEqual([track, true]);
      expect(Math.abs(light.plannedSec - normal.plannedSec) / normal.plannedSec).toBeLessThanOrEqual(0.2);
    }
    // The light week is plan week 4 (days 22–30), whatever the programme week.
    expect(generateSession(input({ dayIndex: 21, weekIndex: 7 })).deload).toBe(true);
    expect(generateSession(input({ dayIndex: 29, weekIndex: 2 })).deload).toBe(true);
    expect(generateSession(input({ dayIndex: 20, weekIndex: 3 })).deload).toBe(false);
    expect(generateSession(input({ dayIndex: 0, weekIndex: 3 })).deload).toBe(false);
  });

  it('track mixes: erection uses max contractions in all 3 positions; bladder has the Knack; relax is release-heavy', () => {
    const e = generateSession(input({ track: 'erection', level: 12 }));
    expect(e.blocks.some((b) => b.type === 'max_contraction')).toBe(true);
    expect(new Set(e.blocks.filter((b) => b.role === 'main').map((b) => b.position))).toEqual(new Set(['lying', 'sitting', 'standing']));
    const b = generateSession(input({ track: 'bladder', dayIndex: 1 }));
    expect(b.blocks.some((x) => x.type === 'knack')).toBe(true);
    const kn = b.blocks.findIndex((x) => x.type === 'knack');
    expect(b.phases.filter((p) => p.exerciseIndex === kn && p.rep === 1).map((p) => p.kind)).toEqual(['contract', 'cough', 'relax']);
    const r = generateSession(input({ track: 'relax', level: 30 }));
    expect(r.blocks.filter((x) => x.role === 'main' && x.type === 'release').length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...r.phases.filter((p) => p.kind === 'contract').map((p) => p.durationMs))).toBeLessThanOrEqual(5000);
  });

  it('endurance only from level 5; "slow squeeze / slow release": squeeze slowly, short hold, let go slowly, rest', () => {
    const types = (level: number) => [0, 1, 2, 3, 4].flatMap((dayIndex) => generateSession(input({ level, dayIndex, durationPreset: 'full' })).blocks.map((b) => b.type));
    expect(types(4)).not.toContain('endurance');
    expect(types(12)).toContain('endurance');
    const s = generateSession(input({ dayIndex: 1 }));
    const i = s.blocks.findIndex((b) => b.type === 'elevator');
    const rep = s.phases.filter((p) => p.exerciseIndex === i && p.rep === 1);
    expect(rep.map((p) => `${p.kind}:${p.variant ?? ''}`)).toEqual(['contract:slowUp', 'contract:top', 'release:slowDown', 'relax:']);
    // Slow phases are seconds long (3–6 s), squeeze and release equally slow; rest at least as long as the squeeze.
    expect(rep[0]!.durationMs).toBeGreaterThanOrEqual(3000);
    expect(rep[0]!.durationMs).toBe(rep[2]!.durationMs);
    expect(rep[3]!.durationMs).toBeGreaterThanOrEqual(rep[0]!.durationMs + rep[1]!.durationMs);
    expect(s.phases.some((p) => p.stage)).toBe(false);
  });

  it('positions progress: week 1 lying → sitting → standing; surgery one step slower; relax never standing', () => {
    expect(positionsFor('general', 0)).toEqual(['lying']);
    expect(positionsFor('general', 1)).toEqual(['lying', 'sitting']);
    expect(positionsFor('general', 3)).toEqual(['lying', 'sitting', 'standing']);
    expect(positionsFor('surgery', 1)).toEqual(['lying']);
    expect(positionsFor('surgery', 4)).toEqual(['lying', 'sitting', 'standing']);
    expect(positionsFor('relax', 20)).toEqual(['lying', 'sitting']);
    expect(positionsFor('erection', 0)).toEqual(['lying', 'sitting', 'standing']);
    const s = generateSession(input({ weekIndex: 0 }));
    expect(new Set(s.blocks.map((b) => b.position))).toEqual(new Set(['lying']));
  });

  it('surgery track starts gentle (short holds), no max contractions', () => {
    const s = generateSession(input({ track: 'surgery', level: 30, weekIndex: 0 }));
    expect(Math.max(...s.blocks.filter((b) => b.type === 'slow_hold').map((b) => b.holdSec!))).toBe(3);
    expect(s.blocks.some((b) => b.type === 'max_contraction')).toBe(false);
  });

  it('blocks carry known technique cues', () => {
    const ids = new Set(KEGEL_CUES.map((c) => c.id));
    expect(KEGEL_CUES.length).toBeGreaterThanOrEqual(30);
    for (const b of generateSession(input({ durationPreset: 'full' })).blocks) {
      expect(b.cueSet.length).toBeGreaterThan(0);
      for (const c of b.cueSet) expect(ids.has(c)).toBe(true);
    }
  });

  it('micro set 30–60 s; release session has no contractions; trial is 3 × 3 s / 3 s', () => {
    for (const track of TRACKS)
      for (const hypertonic of [false, true])
        for (const level of [1, 30]) {
          const m = generateMicroSet({ track, level, hypertonic, seed: SEED });
          expect(m.isMicro).toBe(true);
          expect([track, hypertonic, level, m.plannedSec >= 30 && m.plannedSec <= 65]).toEqual([track, hypertonic, level, true]);
        }
    expect(generateReleaseSession(SEED).contractions).toBe(0);
    const t = generateTrialSession();
    expect(t.phases.filter((p) => p.kind === 'contract')).toHaveLength(3);
    expect(t.plannedSec).toBe(3 + 18);
    expect(contractionCount(t.blocks)).toBe(3);
  });
});

describe('adjustLevel v2 (spec 6.5)', () => {
  const st = (level: number, consecutiveOk = 0, consecutiveHard = 0) => ({ level, consecutiveOk, consecutiveHard });

  it('too easy → +1', () => {
    expect(adjustLevel(st(4, 2), { feedback: 'easy' })).toMatchObject({ level: 5, consecutiveOk: 0, delta: 1 });
  });

  it('3 ok in a row with ≥ 90 % completion → +1; a weaker ok breaks the streak', () => {
    let s = st(4);
    for (let i = 1; i < OK_STREAK_FOR_LEVEL_UP; i++) {
      const r = adjustLevel(s, { feedback: 'ok', completionRate: 0.95 });
      expect(r).toMatchObject({ level: 4, consecutiveOk: i });
      s = r;
    }
    expect(adjustLevel(s, { feedback: 'ok', completionRate: 1 })).toMatchObject({ level: 5, delta: 1 });
    expect(adjustLevel(s, { feedback: 'ok', completionRate: 0.8 })).toMatchObject({ level: 4, consecutiveOk: 0 });
    expect(adjustLevel(s, { feedback: 'ok', skippedBlocks: 1 })).toMatchObject({ level: 4, consecutiveOk: 0 });
    expect(adjustLevel(s, { feedback: 'ok', pauses: 3 })).toMatchObject({ level: 4, consecutiveOk: 0 });
  });

  it('hard keeps the level and suggests a shorter preset; 2 hard in a row → −1', () => {
    const a = adjustLevel(st(6), { feedback: 'hard' });
    expect(a).toMatchObject({ level: 6, consecutiveHard: 1, suggestShorter: true, delta: 0 });
    expect(adjustLevel(a, { feedback: 'hard' })).toMatchObject({ level: 5, consecutiveHard: 0, delta: -1 });
    expect(shorterPreset('full')).toBe('standard');
    expect(shorterPreset('quick')).toBe('quick');
  });

  it('completion below 70 % → −1; could not finish → −1 and repeat the day', () => {
    expect(adjustLevel(st(6), { feedback: 'ok', completionRate: 0.6 })).toMatchObject({ level: 5, delta: -1, repeatDay: false });
    expect(adjustLevel(st(6, 1), { feedback: 'failed' })).toMatchObject({ level: 5, repeatDay: true, delta: -1 });
    expect(adjustLevel(st(1), { feedback: 'failed' }).level).toBe(1);
  });

  it('a pain lock stops increases but not decreases', () => {
    expect(adjustLevel(st(6), { feedback: 'easy', locked: true })).toMatchObject({ level: 6, delta: 0 });
    expect(adjustLevel(st(6, 2), { feedback: 'ok', locked: true })).toMatchObject({ level: 6, delta: 0 });
    expect(adjustLevel(st(6), { feedback: 'failed', locked: true }).level).toBe(5);
  });

  it('stays within 1..30 and still accepts a bare feedback', () => {
    expect(adjustLevel(st(30), 'easy')).toMatchObject({ level: 30, delta: 0 });
    expect(adjustLevel(st(MAX_LEVEL, 2), 'ok').level).toBe(30);
  });
});

describe('schedule rules', () => {
  const test = (date: string, holdBestMs: number): StrengthTest => ({ id: date, date, holdBestMs, holdAttemptsMs: [holdBestMs], quickCount: 10 });

  it('deload = plan week 4 (days 22–30); early (≥ 2 plan weeks after the last) when strength falls two weeks in a row', () => {
    expect([0, 6, 7, 14, 20, 21, 25, 29].map(isPlanDeloadDay)).toEqual([false, false, false, false, false, true, true, true]);
    expect([0, 7, 14, 21].map((planDay) => deloadDue({ planNumber: 1, planDay, lastDeloadWeek: -1 }))).toEqual([false, false, false, true]);
    // Plan 2 starts normal again, even right after the plan-1 deload.
    expect(deloadDue({ planNumber: 2, planDay: 0, lastDeloadWeek: 3 })).toBe(false);
    // Early: plan 2 week 2 (number 5) is 2 weeks after the last deload (3).
    expect(deloadDue({ planNumber: 2, planDay: 7, lastDeloadWeek: 3, strengthFalling: true })).toBe(true);
    expect(deloadDue({ planNumber: 2, planDay: 0, lastDeloadWeek: 3, strengthFalling: true })).toBe(false);
    // An early deload lasts the rest of that plan week.
    expect(deloadDue({ planNumber: 2, planDay: 10, lastDeloadWeek: 5 })).toBe(true);
    expect(deloadDue({ planNumber: 2, planDay: 14, lastDeloadWeek: 5 })).toBe(false);
    expect(strengthFallingTwoWeeks([test('2026-11-01', 9000), test('2026-11-08', 8000), test('2026-11-15', 7000)])).toBe(true);
    expect(strengthFallingTwoWeeks([test('2026-11-01', 9000), test('2026-11-08', 9500), test('2026-11-15', 7000)])).toBe(false);
  });

  it('missed days: 1–2 nothing, 3–6 −1, 7+ −2 with a short re-warm; vacation days do not count', () => {
    expect(missedDaysPolicy('2026-11-13', '2026-11-15')).toMatchObject({ missedDays: 1, levelDelta: 0, kind: 'none' });
    expect(missedDaysPolicy('2026-11-10', '2026-11-15')).toMatchObject({ missedDays: 4, levelDelta: -1, kind: 'gentle' });
    expect(missedDaysPolicy('2026-11-01', '2026-11-15')).toMatchObject({ levelDelta: -2, kind: 'rewarm', preset: 'quick' });
    expect(missedDaysPolicy('2026-11-01', '2026-11-15', { from: '2026-11-02', to: '2026-11-13' })).toMatchObject({ missedDays: 1, levelDelta: 0 });
    expect(missedDaysPolicy(null, '2026-11-15').levelDelta).toBe(0);
    expect(applyReturn({ ...defaultTraining(), level: 2 }, -2).level).toBe(1);
    expect(validVacation('2026-11-20', '2026-11-22', '2026-11-15')).toBe(true);
    expect(validVacation('2026-11-20', '2026-11-21', '2026-11-15')).toBe(false);
    expect(validVacation('2026-11-20', '2026-12-04', '2026-11-15')).toBe(false);
    expect(validVacation('2026-11-10', '2026-11-14', '2026-11-15')).toBe(false);
  });

  it('two streak freezes per month', () => {
    expect(refreshFreezes({ freezeTokens: 0, freezeMonth: '2026-10' }, '2026-11-15')).toEqual({ freezeTokens: 2, freezeMonth: '2026-11' });
    expect(refreshFreezes({ freezeTokens: 1, freezeMonth: '2026-11' }, '2026-11-30')).toEqual({ freezeTokens: 1, freezeMonth: '2026-11' });
  });

  it('daily contraction cap locks extra sessions; a release session still opens', () => {
    const cap = dailyContractionCap(10);
    expect(capStatus(cap - 1, 10).locked).toBe(false);
    expect(capStatus(cap, 10).locked).toBe(true);
    expect(sessionAllowed(cap - 10, 20, 10)).toBe(false);
    expect(sessionAllowed(cap, generateReleaseSession(SEED).contractions, 10)).toBe(true);
    // A main session + the daily micro sets fit under the cap.
    const main = generateSession(input({ level: 30, durationPreset: 'full' })).contractions;
    const micro = generateMicroSet({ track: 'general', level: 30, hypertonic: false, seed: SEED }).contractions;
    expect(main + 3 * micro).toBeLessThanOrEqual(dailyContractionCap(30));
  });

  it('pain: level lock for 7 days; 2 reports in 7 days → referral', () => {
    expect(painPolicy([], '2026-11-15')).toEqual({ lockUntil: null, refer: false });
    expect(painPolicy([{ id: 'a', at: '2026-11-14T20:00:00.000Z' }], '2026-11-15')).toEqual({ lockUntil: '2026-11-21', refer: false });
    expect(
      painPolicy(
        [
          { id: 'a', at: '2026-11-10T20:00:00.000Z' },
          { id: 'b', at: '2026-11-14T20:00:00.000Z' },
        ],
        '2026-11-15',
      ).refer,
    ).toBe(true);
    expect(painPolicy([{ id: 'a', at: '2026-11-01T20:00:00.000Z' }], '2026-11-15').lockUntil).toBeNull();
  });

  it('screening: ≥ 2 yes in the first 7 → relaxation suggested; pain questions set the pain flag; dribbling alone does not', () => {
    const no = Array<boolean>(8).fill(false);
    expect(screeningToTrack(no)).toEqual({ hypertonicFlag: false, painFlag: false, suggestTrack: null });
    expect(screeningToTrack([false, false, false, true, true, false, false, false])).toMatchObject({ hypertonicFlag: true, painFlag: false, suggestTrack: 'relax' });
    expect(screeningToTrack([true, false, false, false, false, false, false, true])).toMatchObject({ hypertonicFlag: false, painFlag: true });
    expect(screeningToTrack([false, false, false, false, false, false, true, true]).hypertonicFlag).toBe(false);
  });

  it('muscle score: baseline 50, double 100, clamped', () => {
    const base = { holdBestMs: 5000, quickCount: 10 };
    expect(muscleScore(base, base)).toBe(50);
    expect(muscleScore(base, { holdBestMs: 10000, quickCount: 20 })).toBe(100);
    expect(muscleScore(base, { holdBestMs: 40000, quickCount: 40 })).toBe(100);
    expect(muscleScore(base, { holdBestMs: 0, quickCount: 0 })).toBe(0);
  });

  it('goals → primary track by priority; surgery only with clearance', () => {
    expect(goalsToTrack(['endurance', 'bladder', 'erection'])).toBe('bladder');
    expect(goalsToTrack(['postSurgery', 'erection'])).toBe('erection');
    expect(goalsToTrack(['postSurgery', 'erection'], true)).toBe('surgery');
    expect(goalsToTrack(['endurance'])).toBe('control');
    expect(goalsToTrack(['confidence'])).toBe('general');
    expect(goalsToTrack([])).toBe('general');
    expect(trackAllowed('surgery', false)).toBe(false);
    expect(KEGEL_TRACKS.map((t) => t.id).sort()).toEqual([...TRACKS].sort());
    expect(KEGEL_TRACKS.find((t) => t.id === 'surgery')?.requiresClearance).toBe(true);
  });
});

describe('plan progression and migration', () => {
  const base: TrainingState = { ...defaultTraining(), level: 3 };

  it('advances one plan day and programme day per calendar day', () => {
    const a = applySessionResult(base, { date: '2026-11-15', feedback: 'ok' });
    expect(a).toMatchObject({ planDayIndex: 1, dayIndex: 1, weekIndex: 0 });
    const b = applySessionResult(a, { date: '2026-11-15', feedback: 'ok' });
    expect(b.planDayIndex).toBe(1); // second session same day
    expect(b.consecutiveOk).toBe(2);
    const c = applySessionResult(b, { date: '2026-11-16', feedback: 'ok' });
    expect(c).toMatchObject({ planDayIndex: 2, level: 4 });
  });

  it('rolls the programme week after 7 days; extra sessions keep the finished day’s week', () => {
    const a = applySessionResult({ ...base, dayIndex: 6, weekIndex: 2 }, { date: '2026-11-15', feedback: 'ok' });
    expect(a).toMatchObject({ dayIndex: 0, weekIndex: 3 });
    expect(todayWeekIndex(a, '2026-11-15')).toBe(2);
    expect(todayWeekIndex(a, '2026-11-16')).toBe(3);
  });

  it('remembers a deload week, the shorter-preset hint and the pain lock', () => {
    // Plan 2, day 23 → plan-week number 4 + 3 = 7.
    expect(applySessionResult({ ...base, planNumber: 2, planDayIndex: 22 }, { date: '2026-11-15', feedback: 'ok', deload: true }).lastDeloadWeek).toBe(7);
    const hard = applySessionResult(base, { date: '2026-11-15', feedback: 'hard' });
    expect(hard.suggestShorter).toBe(true);
    expect(applySessionResult(hard, { date: '2026-11-16', feedback: 'ok' }).suggestShorter).toBeUndefined();
    const locked = applySessionResult({ ...base, levelLockUntil: '2026-11-20' }, { date: '2026-11-15', feedback: 'easy' });
    expect(locked.level).toBe(3);
    expect(applySessionResult({ ...base, levelLockUntil: '2026-11-20' }, { date: '2026-11-20', feedback: 'easy' }).level).toBe(4);
  });

  it('failed does not advance the plan; rolls to Plan 2 after 30 days keeping the level', () => {
    const a = applySessionResult({ ...base, planDayIndex: 4 }, { date: '2026-11-15', feedback: 'failed' });
    expect(a).toMatchObject({ planDayIndex: 4, level: 2, repeatNextDay: true });
    expect(todayPlanDay(a, '2026-11-16')).toBe(4);
    const b = applySessionResult({ ...base, planDayIndex: 29, level: 12 }, { date: '2026-11-15', feedback: 'easy' });
    expect(b).toMatchObject({ planDayIndex: 0, planNumber: 2, level: 13 });
    expect(setManualLevel({ ...base, consecutiveOk: 2 }, 40)).toMatchObject({ level: 30, consecutiveOk: 0 });
  });

  it('migrates v1 state: level and plan kept, general / standard, week from the plans done', () => {
    const v1 = { level: 12, consecutiveOk: 1, planDayIndex: 20, planNumber: 2, lastAdvancedDate: '2026-11-14', repeatNextDay: false };
    const m = migrateTraining(v1);
    expect(m).toMatchObject({ ...v1, track: 'general', durationPreset: 'standard', dailyTarget: 2, weekIndex: 7, dayIndex: 1, consecutiveHard: 0, freezeTokens: 2, lastDeloadWeek: -1 });
    expect(migrateTraining(m)).toEqual(m);
    expect(migrateTraining(null)).toEqual(defaultTraining());
    expect(migrateTraining({ level: 'x', track: 'nope', durationPreset: 'huge', dailyTarget: 9, vacation: { from: 1 } })).toEqual(defaultTraining());
    expect(migrateTraining({ ...m, vacation: { from: '2026-11-20', to: '2026-11-25' }, levelLockUntil: '2026-11-21' })).toMatchObject({ vacation: { from: '2026-11-20', to: '2026-11-25' }, levelLockUntil: '2026-11-21' });
  });
});
