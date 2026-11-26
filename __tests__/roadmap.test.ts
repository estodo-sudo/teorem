import fs from 'fs';
import path from 'path';

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
  it('30 nodes a stage: done filled, today ringed, future faded; under 4 week headers (all 180 days + the 7-day cycle, 2026-11-26)', () => {
    const t = { ...defaultTraining(), planDayIndex: 9, dayIndex: 2, weekIndex: 1 };
    const all = roadmapNodes(t, '2026-11-19');
    expect(all).toHaveLength(180 + 7);
    expect(all.filter((x) => x.cycle).map((x) => x.state)).toEqual(Array(7).fill('future'));
    const n = all.filter((x) => x.stage === 0);
    expect(n).toHaveLength(30);
    expect(n.filter((x) => x.state === 'done')).toHaveLength(9);
    expect(n[9]!.state).toBe('today');
    expect(n.slice(10).every((x) => x.state === 'future')).toBe(true);
    expect([n[0]!.week, n[7]!.week, n[14]!.week, n[21]!.week, n[29]!.week]).toEqual([0, 1, 2, 3, 3]);
    // After today's session the day counts as done and "today" points at it for extra sessions.
    const after = applySessionResult(t, { date: '2026-11-19', feedback: 'ok' });
    expect(roadmapNodes(after, '2026-11-19').filter((x) => x.state === 'done')).toHaveLength(10);
    // in the cycle after the 180 days: all 180 done, the cycle's days show today
    const cyc = roadmapNodes({ ...defaultTraining(), planNumber: 3, planDayIndex: 2 }, '2026-11-19');
    expect(cyc.filter((x) => !x.cycle).every((x) => x.state === 'done')).toBe(true);
    expect(cyc.filter((x) => x.cycle).map((x) => x.state)).toEqual(['done', 'done', 'today', 'future', 'future', 'future', 'future']);
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
      const today = buildTodaySession(t, '2026-11-19', { strengthFalling: false });
      expect([planDayIndex, today.deload]).toEqual([planDayIndex, nodes[planDayIndex]!.week === 3]);
    }
  });

  it('an early deload (falling strength) shows on this week’s days and in today’s session', () => {
    // stage 2, week 2 (week number 5) is two weeks after the last deload (3)
    const t = { ...defaultTraining(), planNumber: 1, planDayIndex: 39, lastDeloadWeek: 3 };
    expect(deloadOnPlanDay(t, '2026-11-19', 40, true)).toBe(true);
    expect(deloadOnPlanDay(t, '2026-11-19', 33, true)).toBe(false);
    expect(deloadOnPlanDay(t, '2026-11-19', 46, true)).toBe(false);
    expect(buildTodaySession(t, '2026-11-19', { strengthFalling: true }).deload).toBe(true);
    expect(buildTodaySession(t, '2026-11-19', { strengthFalling: false }).deload).toBe(false);
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
  it('one session length: a stored preset never changes the session; only the level does', () => {
    const t = migrateTraining({ ...defaultTraining(), durationPreset: 'full', level: 3 });
    const q = migrateTraining({ ...defaultTraining(), durationPreset: 'quick', level: 3 });
    expect(buildTodaySession(t, '2026-11-19', { strengthFalling: false }).plannedSec).toBe(buildTodaySession(q, '2026-11-19', { strengthFalling: false }).plannedSec);
    expect(buildTodaySession({ ...t, level: 25 }, '2026-11-19', { strengthFalling: false }).plannedSec).toBeGreaterThan(buildTodaySession(t, '2026-11-19', { strengthFalling: false }).plannedSec);
  });

  it('daily target 1–4 (default 2: one session + a micro set); invalid values fall back', () => {
    expect(defaultTraining().dailyTarget).toBe(2);
    expect(migrateTraining({ dailyTarget: 4 }).dailyTarget).toBe(4);
    expect(migrateTraining({ dailyTarget: 7 }).dailyTarget).toBe(2);
  });

  it('a day of Tur 1 + Tur 2 + a micro set stays under the daily cap; over it only release opens', () => {
    const level = 15;
    const t = { ...defaultTraining(), level };
    const main = buildTodaySession(t, '2026-11-19', { strengthFalling: false }).contractions + buildTodaySession(t, '2026-11-19', { round: 2, strengthFalling: false }).contractions;
    // Tur 1 + Tur 2 + the one extra session allowed before the 10-hour rest (2026-11-25).
    const extra = buildTodaySession(t, '2026-11-19', { strengthFalling: false }).contractions;
    expect(main + extra).toBeLessThanOrEqual(dailyContractionCap(level));
    expect(sessionAllowed(dailyContractionCap(level), extra, level)).toBe(false);
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

  it('screens: roadmap and texts are wired; no duration chips', () => {
    expect(fs.existsSync(path.join(root, 'app', 'kegel', 'plan.tsx'))).toBe(true);
    const card = fs.readFileSync(path.join(root, 'src', 'features', 'today', 'WorkoutCard.tsx'), 'utf8');
    // One session length (user decision 2026-11-22): no duration chips any more.
    expect(card).not.toMatch(/DurationPreset/);
    // The cap dialog (→ release-only session) lives in the shared starter used by the card.
    expect(card).toMatch(/useSessionStarter\(\)/);
    expect(fs.readFileSync(path.join(root, 'src', 'features', 'training', 'useSessionStarter.tsx'), 'utf8')).toMatch(/sessionId: 'release'/);
    const w = (tr as unknown as { today: { workout: Record<string, string> } }).today.workout;
    expect(w.capBody).toMatch(/Yarın görüşürüz/);
  });
});
