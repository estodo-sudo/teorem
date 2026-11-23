import { CATEGORIES, getCategory } from '@/features/bodyweight/catalog';
import tr from '@/i18n/tr.json';
import { currentDay, dayPlan, programDone, trainDayList, workoutPhases, workoutSec, type ProgramProgress } from '@/features/bodyweight/program';
import { sanitizeProgress } from '@/stores/bodyweightStore';

const karin = getCategory('karin')!;
const prog = (id: string) => karin.programs.find((p) => p.id === id)!;

describe('Aletsiz Fitness catalogue', () => {
  const READY = CATEGORIES.filter((c) => c.ready);
  const PROGRAMMED = READY.filter((c) => c.programs.length > 0);

  it('has the 11 categories in order; the finished ones are ready', () => {
    expect(CATEGORIES.map((c) => c.id)).toEqual(['karin', 'gogus', 'sirt', 'omuz', 'kol', 'bacak', 'kalca', 'baldir', 'tamVucut', 'kardiyo', 'isinma']);
    expect(READY.map((c) => c.id)).toEqual(['karin', 'gogus', 'sirt', 'omuz', 'kol', 'bacak', 'kalca', 'baldir', 'tamVucut', 'kardiyo', 'isinma']);
    expect(PROGRAMMED.map((c) => c.id)).toEqual(['karin', 'gogus', 'sirt', 'omuz', 'kol', 'bacak', 'kalca', 'baldir', 'tamVucut', 'kardiyo']);
  });

  it.each(PROGRAMMED.map((c) => [c.id, c] as const))('%s: Toparla 30 days × 3/week, Geliştir 60 × 4, Güçlendir 90 × 5', (_, c) => {
    expect(c.programs.map((p) => [p.id, p.days, p.trainDays.length])).toEqual([
      ['toparla', 30, 3],
      ['gelistir', 60, 4],
      ['guclendir', 90, 5],
    ]);
    expect(c.text!.science.length).toBeGreaterThanOrEqual(3);
  });

  it.each(PROGRAMMED.map((c) => [c.id, c] as const))('%s: every move in every workout has a how-to text and a figure whose tempo poses exist', (_, karin) => {
    for (const p of karin.programs)
      for (const ph of p.phases)
        for (const w of ph.workouts)
          for (const m of w.moves) {
            const ex = karin.exercises.find((e) => e.id === m);
            expect([m, Boolean(ex && ex.steps.length === 3 && ex.setup && ex.tip && ex.mistake)]).toEqual([m, true]);
            const move = karin.moves[m]!;
            expect([m, Boolean(move)]).toEqual([m, true]);
            for (const s of move.tempo) expect([m, s.to, Boolean(move.poses[s.to])]).toEqual([m, s.to, true]);
          }
    // Every described move is drawn and every drawn move is described.
    expect(Object.keys(karin.moves).sort()).toEqual(karin.exercises.map((e) => e.id).sort());
  });

  it('every tempo word the figures use has a Turkish label', () => {
    const tempo = (tr as { fitness: { tempo: Record<string, string> } }).fitness.tempo;
    const words = new Set(READY.flatMap((c) => Object.values(c.moves).flatMap((m) => m.tempo.map((s) => s.word))));
    expect([...words].filter((w) => !tempo[w])).toEqual([]);
  });

  it.each(PROGRAMMED.map((c) => [c.id, c] as const))('%s: workouts get longer from Toparla to Güçlendir but stay reasonable', (_, c) => {
    const prog = (id: string) => c.programs.find((p) => p.id === id)!;
    const mins = (id: string) => trainDayList(prog(id)).map((d) => dayPlan(prog(id), d)).map((d) => (d.kind === 'workout' ? workoutSec(d.workout) / 60 : 0));
    expect(Math.min(...mins('toparla'))).toBeGreaterThanOrEqual(9);
    expect(Math.max(...mins('toparla'))).toBeLessThanOrEqual(12);
    expect(Math.max(...mins('gelistir'))).toBeLessThanOrEqual(18);
    expect(Math.max(...mins('guclendir'))).toBeLessThanOrEqual(24);
    expect(Math.min(...mins('guclendir'))).toBeGreaterThan(Math.min(...mins('toparla')));
  });
});

describe('days, rounds and lighter weeks', () => {
  it('Toparla trains on days 1, 3, 5 of each week; workouts alternate A, B', () => {
    const p = prog('toparla');
    expect(trainDayList(p).slice(0, 6)).toEqual([1, 3, 5, 8, 10, 12]);
    expect(dayPlan(p, 2).kind).toBe('rest');
    expect([1, 3, 5].map((d) => (dayPlan(p, d) as { workout: { id: string } }).workout.id)).toEqual(['A', 'B', 'A']);
  });
  it('the second phase is harder (longer work, harder moves)', () => {
    const p = prog('toparla');
    const w1 = dayPlan(p, 1);
    const w3 = dayPlan(p, 15);
    expect(w1.kind === 'workout' && w3.kind === 'workout' && w3.workout.workSec > w1.workout.workSec).toBe(true);
    expect(w3.kind === 'workout' && w3.workout.moves.includes('plank')).toBe(true);
  });
  it('every 4th week of Geliştir and Güçlendir has one round less', () => {
    const g = prog('gelistir');
    const normal = dayPlan(g, 1);
    const light = dayPlan(g, 22);
    expect(normal.kind === 'workout' && light.kind === 'workout' && light.light && light.workout.rounds === normal.workout.rounds - 1).toBe(true);
  });
  it('the player timeline matches the workout length', () => {
    for (const p of karin.programs) {
      const d = dayPlan(p, 1);
      if (d.kind !== 'workout') throw new Error('day 1 is a workout');
      const phases = workoutPhases(d.workout);
      expect(phases.reduce((a, x) => a + x.durationMs, 0) / 1000).toBe(workoutSec(d.workout));
      expect(phases.filter((x) => x.kind === 'work')).toHaveLength(d.workout.moves.length * d.workout.rounds);
    }
  });
});

describe('progress', () => {
  const p = prog('toparla');
  const start: ProgramProgress = { programId: 'toparla', startedAt: '2026-11-22', done: {} };
  it('starts on day 1, ready', () => {
    expect(currentDay(p, start, '2026-11-22')).toMatchObject({ day: 1, ready: true, finished: false });
  });
  it('after a workout: the next one waits for tomorrow; rest days pass by themselves', () => {
    const after = { ...start, done: { 1: '2026-11-22' } };
    expect(currentDay(p, after, '2026-11-22')).toMatchObject({ day: 2, ready: false });
    expect(currentDay(p, after, '2026-11-23')).toMatchObject({ day: 3, ready: true });
    expect(programDone(p, after)).toEqual({ done: 1, total: trainDayList(p).length });
  });
  it('finishes after the last workout', () => {
    const all = Object.fromEntries(trainDayList(p).map((d) => [d, '2026-11-01']));
    expect(currentDay(p, { ...start, done: all }, '2026-12-30').finished).toBe(true);
  });
  it('stored progress is cleaned', () => {
    expect(sanitizeProgress({ karin: { programId: 'toparla', startedAt: '2026-11-22', done: { 1: '2026-11-22', x: 'nope', 3: 5 } }, gogus: { programId: 'bad', startedAt: '2026-11-22' } })).toEqual({ karin: { programId: 'toparla', startedAt: '2026-11-22', done: { 1: '2026-11-22' } } });
  });
});

describe('Göğüs progression', () => {
  const g = getCategory('gogus')!;
  const moves = (programId: string, day: number) => {
    const d = dayPlan(g.programs.find((p) => p.id === programId)!, day);
    return d.kind === 'workout' ? d.workout.moves : [];
  };
  it('Toparla starts from the wall, incline and knee push-ups — no full push-up yet', () => {
    expect(new Set([...moves('toparla', 1), ...moves('toparla', 3)])).toEqual(new Set(['wall_pushup', 'incline_pushup', 'chest_squeeze', 'knee_pushup']));
  });
  it('the hardest moves (explosive) only come in Güçlendir from week 5', () => {
    for (const p of g.programs)
      for (let d = 1; d <= p.days; d++) if (moves(p.id, d).includes('plyo_pushup')) expect([p.id, d >= 29]).toEqual(['guclendir', true]);
  });
});

describe('Sırt programmes', () => {
  const s = getCategory('sirt')!;
  const plan = (programId: string, day: number) => dayPlan(s.programs.find((p) => p.id === programId)!, day);
  it('Toparla starts with mobility and prone moves; the table row joins from week 3', () => {
    const d1 = plan('toparla', 1);
    const d15 = plan('toparla', 15);
    expect(d1.kind === 'workout' && d1.workout.moves.includes('table_row')).toBe(false);
    expect(d15.kind === 'workout' && d15.workout.moves.includes('table_row')).toBe(true);
  });
  it('the main pull (table row) is in every A and B workout of Geliştir and Güçlendir; C is a lighter day', () => {
    for (const id of ['gelistir', 'guclendir'])
      for (const ph of s.programs.find((p) => p.id === id)!.phases)
        for (const w of ph.workouts) expect([id, w.id, w.moves.includes('table_row')]).toEqual([id, w.id, w.id !== 'C']);
  });
});

describe('Omuz programmes', () => {
  const o = getCategory('omuz')!;
  it('every workout starts with a shoulder warm-up (arm circles or wall slides)', () => {
    for (const p of o.programs) for (const ph of p.phases) for (const w of ph.workouts) expect([p.id, w.id, ['arm_circles', 'wall_slide'].includes(w.moves[0]!)]).toEqual([p.id, w.id, true]);
  });
  it('the wall handstand only comes in Güçlendir from week 5', () => {
    for (const p of o.programs)
      for (let d = 1; d <= p.days; d++) {
        const plan = dayPlan(p, d);
        if (plan.kind === 'workout' && plan.workout.moves.includes('wall_handstand_hold')) expect([p.id, d >= 29]).toEqual(['guclendir', true]);
      }
  });
});

describe('Kol programmes', () => {
  const k = getCategory('kol')!;
  const PUSH = new Set(['wall_triceps_press', 'knee_diamond_pushup', 'diamond_pushup', 'chair_dips', 'chair_dips_straight', 'plank_up_down', 'pike_pushup', 'pushup_hold']);
  const PULL = new Set(['self_resist_curl', 'door_curl_hold', 'table_row_underhand']);
  it('every workout trains both the triceps (push) and the biceps (pull)', () => {
    for (const p of k.programs)
      for (const ph of p.phases)
        for (const w of ph.workouts) expect([p.id, w.id, w.moves.some((m) => PUSH.has(m)) && w.moves.some((m) => PULL.has(m))]).toEqual([p.id, w.id, true]);
  });
  it('curls lower slowly (the lowering takes longer than the lift)', () => {
    const t = k.moves.self_resist_curl!.tempo;
    expect(t.find((s) => s.word === 'lower')!.sec).toBeGreaterThan(t.find((s) => s.word === 'lift')!.sec);
  });
});

describe('Bacak programmes', () => {
  const b = getCategory('bacak')!;
  const all = (id: string) => b.programs.find((p) => p.id === id)!.phases.flatMap((ph) => ph.workouts.flatMap((w) => w.moves));
  it('Toparla starts from the chair squat and keeps jumps and one-leg squats out', () => {
    const d1 = dayPlan(b.programs[0]!, 1);
    expect(d1.kind === 'workout' && d1.workout.moves[0]).toBe('chair_squat');
    for (const m of ['jump_squat', 'chair_pistol', 'bulgarian_split_squat']) expect(all('toparla')).not.toContain(m);
  });
  it('the wall sit is in most workouts (blood pressure, endurance)', () => {
    const ws = b.programs.flatMap((p) => p.phases.flatMap((ph) => ph.workouts)).filter((w) => w.moves.includes('wall_sit')).length;
    const total = b.programs.flatMap((p) => p.phases.flatMap((ph) => ph.workouts)).length;
    expect(ws / total).toBeGreaterThan(0.6);
  });
});

describe('Kalça programmes', () => {
  const k = getCategory('kalca')!;
  const SIDE = new Set(['clamshell', 'side_lying_leg_raise']);
  const BIG = new Set(['glute_bridge', 'glute_bridge_hold', 'glute_bridge_march', 'single_leg_bridge', 'hip_thrust', 'single_leg_hip_thrust', 'donkey_kick', 'standing_kickback', 'single_leg_rdl', 'reverse_lunge', 'sumo_squat']);
  it('every workout trains both the side of the hip (abductors) and the big glute', () => {
    for (const p of k.programs)
      for (const ph of p.phases)
        for (const w of ph.workouts) expect([p.id, w.id, w.moves.some((m) => SIDE.has(m)) && w.moves.some((m) => BIG.has(m))]).toEqual([p.id, w.id, true]);
  });
  it('the single-leg hip thrust only comes from Geliştir week 5', () => {
    for (const p of k.programs)
      for (let d = 1; d <= p.days; d++) {
        const plan = dayPlan(p, d);
        if (plan.kind === 'workout' && plan.workout.moves.includes('single_leg_hip_thrust')) expect([p.id !== 'toparla', d >= 29]).toEqual([true, true]);
      }
  });
});

describe('Baldır programmes', () => {
  const b = getCategory('baldir')!;
  const moves = (id: string) => b.programs.find((p) => p.id === id)!.phases.flatMap((ph) => ph.workouts.flatMap((w) => w.moves));
  it('Toparla has no hopping; lengthened (step) raises come in every programme', () => {
    expect(moves('toparla')).not.toContain('pogo_hops');
    for (const p of ['toparla', 'gelistir', 'guclendir']) expect(moves(p)).toContain('step_calf_raise');
  });
  it('the slow eccentric lowers for 4 s; the front of the shin is trained in every workout', () => {
    expect(b.moves.slow_eccentric_raise!.tempo.find((s) => s.word === 'lower')!.sec).toBe(4);
    for (const p of b.programs) for (const ph of p.phases) for (const w of ph.workouts) expect([p.id, w.id, w.moves.includes('tibialis_raise')]).toEqual([p.id, w.id, true]);
  });
});

describe('Tam Vücut programmes', () => {
  const t = getCategory('tamVucut')!;
  const PUSH = ['knee_pushup', 'pushup', 'chair_dips', 'half_burpee', 'burpee'];
  const PULL = ['table_row', 'superman', 'bird_dog'];
  const LEGS = ['squat', 'jump_squat', 'reverse_lunge', 'glute_bridge', 'half_burpee', 'burpee'];
  const CORE = ['plank', 'mountain_climber', 'dead_bug', 'bird_dog', 'inchworm'];
  it('every workout has a push, a pull / back, a legs and a core move', () => {
    for (const p of t.programs)
      for (const ph of p.phases)
        for (const w of ph.workouts) {
          const has = (set: string[]) => w.moves.some((m) => set.includes(m));
          expect([p.id, w.id, has(PUSH), has(PULL), has(LEGS), has(CORE)]).toEqual([p.id, w.id, true, true, true, true]);
        }
  });
  it('the full burpee (with the jump) only from Geliştir week 5 or in Güçlendir; four key poses', () => {
    for (const p of t.programs)
      for (let d = 1; d <= p.days; d++) {
        const plan = dayPlan(p, d);
        if (plan.kind === 'workout' && plan.workout.moves.includes('burpee')) expect([p.id !== 'toparla', p.id === 'guclendir' || d >= 29]).toEqual([true, true]);
      }
    expect(Object.keys(t.moves.burpee!.poses).sort()).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('Kardiyo programmes', () => {
  const k = getCategory('kardiyo')!;
  const JUMPS = ['jumping_jack', 'skater', 'burpee', 'jump_squat', 'jump_rope', 'high_knees'];
  const all = (id: string) => k.programs.find((p) => p.id === id)!.phases.flatMap((ph) => ph.workouts.flatMap((w) => w.moves));
  it('Toparla is low impact: no jumping moves', () => {
    for (const m of JUMPS) expect(all('toparla')).not.toContain(m);
  });
  it("Güçlendir's lighter day (C) is low impact too", () => {
    for (const ph of k.programs.find((p) => p.id === 'guclendir')!.phases) for (const m of JUMPS) expect(ph.workouts.find((w) => w.id === 'C')!.moves).not.toContain(m);
  });
});

describe('Isınma: one 10-minute warm-up, no programmes', () => {
  const c = getCategory('isinma')!;
  const r = c.routine!;

  it('has no programmes and a single routine of about 10 minutes', () => {
    expect(c.ready).toBe(true);
    expect(c.programs).toEqual([]);
    expect(r.rounds).toBe(1);
    expect(workoutSec(r) / 60).toBeGreaterThanOrEqual(9.5);
    expect(workoutSec(r) / 60).toBeLessThanOrEqual(10.5);
  });

  it('every move has a how-to text and a figure; pulse first, then mobility, then light strength', () => {
    for (const m of r.moves) {
      const ex = c.exercises.find((e) => e.id === m);
      expect([m, Boolean(ex && ex.steps.length === 3 && ex.setup && ex.tip && ex.mistake)]).toEqual([m, true]);
      const move = c.moves[m]!;
      expect([m, Boolean(move)]).toEqual([m, true]);
      for (const s of move.tempo) expect([m, s.to, Boolean(move.poses[s.to])]).toEqual([m, s.to, true]);
    }
    expect(Object.keys(c.moves).sort()).toEqual(c.exercises.map((e) => e.id).sort());
    expect(r.moves[0]).toBe('march_in_place');
    expect(r.moves.indexOf('leg_swings')).toBeLessThan(r.moves.indexOf('squat'));
    // No static hold: a warm-up keeps moving.
    expect(r.moves.filter((m) => c.moves[m]!.kind === 'hold')).toEqual([]);
  });

  it('plays as one pass of the moves', () => {
    expect(workoutPhases(r).filter((p) => p.kind === 'work').map((p) => p.exerciseId)).toEqual(r.moves);
  });
});
