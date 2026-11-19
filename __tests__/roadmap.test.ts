import fs from 'fs';
import path from 'path';

import { generateMicroSet } from '@/features/training/generateSession';
import { applySessionResult, defaultTraining, migrateTraining } from '@/features/training/plan';
import { deloadOnPlanDay, FUNCTIONAL_TASKS, roadmapNodes, tasksForDay, tasksForTrack, weekIndexForPlanDay, weekTheme } from '@/features/training/roadmap';
import { sessionAllowed } from '@/features/training/schedule';
import { buildTodaySession } from '@/features/training/service';
import { dailyContractionCap } from '@/features/training/levels';
import tr from '@/i18n/tr.json';
import type { TrackId } from '@/types';

const root = path.join(__dirname, '..');
const TRACKS: TrackId[] = ['general', 'erection', 'control', 'bladder', 'surgery', 'relax'];

describe('plan roadmap (spec 8)', () => {
  it('30 nodes: done filled, today ringed, future faded; under 4 week headers', () => {
    const t = { ...defaultTraining(), planDayIndex: 9, dayIndex: 2, weekIndex: 1 };
    const n = roadmapNodes(t, '2026-11-19');
    expect(n).toHaveLength(30);
    expect(n.filter((x) => x.state === 'done')).toHaveLength(9);
    expect(n[9]!.state).toBe('today');
    expect(n.slice(10).every((x) => x.state === 'future')).toBe(true);
    expect([n[0]!.week, n[7]!.week, n[14]!.week, n[21]!.week, n[29]!.week]).toEqual([0, 1, 2, 3, 3]);
    // After today's session the day counts as done and "today" points at it for extra sessions.
    const after = applySessionResult(t, { date: '2026-11-19', feedback: 'ok' });
    expect(roadmapNodes(after, '2026-11-19').filter((x) => x.state === 'done')).toHaveLength(10);
  });

  it('week headers follow the spec themes; the 4th is the deload week', () => {
    expect([0, 1, 2, 3].map((w) => weekTheme(w).title)).toEqual(['1. Hafta: Kası tanı', '2. Hafta: Kontrol', '3. Hafta: Güç', '4. Hafta: Toparlanma']);
    expect(weekTheme(9).title).toBe('4. Hafta: Toparlanma');
  });

  it('what the roadmap says is what the session does: "4. Hafta: Toparlanma" days are exactly the light days', () => {
    for (const planDayIndex of [0, 9, 20, 21, 27]) {
      const t = { ...defaultTraining(), planDayIndex, weekIndex: 5, dayIndex: planDayIndex % 7 };
      const nodes = roadmapNodes(t, '2026-11-19');
      for (const n of nodes) {
        const header = weekTheme(n.week).title;
        expect([planDayIndex, n.day, deloadOnPlanDay(t, '2026-11-19', n.day)]).toEqual([planDayIndex, n.day, header === '4. Hafta: Toparlanma']);
      }
      // Today's real session agrees with its node.
      const today = buildTodaySession(t, '2026-11-19', { hypertonic: false, strengthFalling: false });
      expect([planDayIndex, today.deload]).toEqual([planDayIndex, nodes[planDayIndex]!.week === 3]);
    }
  });

  it('an early deload (falling strength) shows on this week’s days and in today’s session', () => {
    const t = { ...defaultTraining(), planNumber: 2, planDayIndex: 9, lastDeloadWeek: 3 };
    expect(deloadOnPlanDay(t, '2026-11-19', 10, true)).toBe(true);
    expect(deloadOnPlanDay(t, '2026-11-19', 3, true)).toBe(false);
    expect(deloadOnPlanDay(t, '2026-11-19', 16, true)).toBe(false);
    expect(buildTodaySession(t, '2026-11-19', { hypertonic: false, strengthFalling: true }).deload).toBe(true);
    expect(buildTodaySession(t, '2026-11-19', { hypertonic: false, strengthFalling: false }).deload).toBe(false);
  });

  it('day preview uses the right programme week for past and future days', () => {
    const t = { ...defaultTraining(), planDayIndex: 9, dayIndex: 2, weekIndex: 1 };
    expect(weekIndexForPlanDay(t, '2026-11-19', 9)).toBe(1);
    expect(weekIndexForPlanDay(t, '2026-11-19', 14)).toBe(2);
    expect(weekIndexForPlanDay(t, '2026-11-19', 7)).toBe(1);
    expect(weekIndexForPlanDay(t, '2026-11-19', 6)).toBe(0);
  });
});

describe('duration chips, daily target and micro sets (spec 6.2, 6.3)', () => {
  it('the chip sets the preset; levels never change it', () => {
    const t = migrateTraining({ ...defaultTraining(), durationPreset: 'full', level: 3 });
    expect(buildTodaySession(t, '2026-11-19', { hypertonic: false, strengthFalling: false }).durationPreset).toBe('full');
    expect(buildTodaySession({ ...t, level: 25 }, '2026-11-19', { hypertonic: false, strengthFalling: false }).durationPreset).toBe('full');
  });

  it('daily target 1–4 (default 2: one session + a micro set); invalid values fall back', () => {
    expect(defaultTraining().dailyTarget).toBe(2);
    expect(migrateTraining({ dailyTarget: 4 }).dailyTarget).toBe(4);
    expect(migrateTraining({ dailyTarget: 7 }).dailyTarget).toBe(2);
  });

  it('a day of main session + 3 micro sets stays under the daily cap; over it only release opens', () => {
    const level = 15;
    const main = buildTodaySession({ ...defaultTraining(), level, durationPreset: 'full' }, '2026-11-19', { hypertonic: false, strengthFalling: false }).contractions;
    const micro = generateMicroSet({ track: 'general', level, hypertonic: false, seed: 'x' }).contractions;
    expect(main + 3 * micro).toBeLessThanOrEqual(dailyContractionCap(level));
    expect(sessionAllowed(dailyContractionCap(level), micro, level)).toBe(false);
    expect(sessionAllowed(dailyContractionCap(level), 0, level)).toBe(true);
  });
});

describe('functional tasks (spec 5)', () => {
  it('at least 20 tasks, unreviewed with sources; every track has enough', () => {
    expect(FUNCTIONAL_TASKS.length).toBeGreaterThanOrEqual(20);
    const json = JSON.parse(fs.readFileSync(path.join(root, 'src', 'content', 'kegel', 'functional-tasks.tr.json'), 'utf8')) as { reviewed: boolean; sourceIds: string[] };
    expect(json.reviewed).toBe(false);
    expect(json.sourceIds.length).toBeGreaterThan(0);
    for (const track of TRACKS) expect([track, tasksForTrack(track).length >= 4]).toEqual([track, true]);
    expect(FUNCTIONAL_TASKS.map((x) => x.id)).toEqual(expect.arrayContaining(['stand_up', 'stairs', 'after_urine']));
  });

  it('from week 6 only; 1–2 a day, the same all day, changing day to day; relax gets calm ones', () => {
    expect(tasksForDay('general', 4, '2026-11-19')).toEqual([]);
    const a = tasksForDay('general', 5, '2026-11-19');
    expect(a.length).toBeGreaterThanOrEqual(1);
    expect(a.length).toBeLessThanOrEqual(2);
    expect(tasksForDay('general', 5, '2026-11-19')).toEqual(a);
    const days = new Set(
      ['2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'].map((d) =>
        tasksForDay('general', 5, d)
          .map((x) => x.id)
          .join(),
      ),
    );
    expect(days.size).toBeGreaterThan(1);
    for (const d of ['2026-11-19', '2026-11-20', '2026-11-21']) for (const task of tasksForDay('relax', 8, d)) expect(task.tracks).toContain('relax');
  });

  it('screens: roadmap, chips and texts are wired', () => {
    expect(fs.existsSync(path.join(root, 'app', 'kegel', 'plan.tsx'))).toBe(true);
    const card = fs.readFileSync(path.join(root, 'src', 'features', 'today', 'WorkoutCard.tsx'), 'utf8');
    expect(card).toMatch(/Segmented<DurationPreset>/);
    expect(card).toMatch(/sessionId: 'release'/);
    const w = (tr as unknown as { today: { workout: Record<string, string> } }).today.workout;
    expect(w.capBody).toMatch(/Yarın görüşürüz/);
  });
});
