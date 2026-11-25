import fs from 'fs';
import path from 'path';

import { completedDates } from '@/features/gamification/service';
import { summarize } from '@/features/progress/stats';
import { painPolicy, rescreenDue } from '@/features/training/schedule';
import { dayOf } from '@/lib/date';
import type { WorkoutSession } from '@/types';

const read = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const w = (o: Partial<WorkoutSession>): WorkoutSession => ({ id: Math.random().toString(36), date: '2026-11-24', finishedAt: '2026-11-24T10:00:00Z', level: 1, plannedSec: 120, actualSec: 120, exercises: [], completed: true, ...o });

describe('app-wide debug sweep (2026-11-24)', () => {
  it('Metro: cache reads and writes are limited and an EMFILE read is a cache miss, not a failed bundle', () => {
    const cfg = read('metro.config.js');
    expect(cfg).toMatch(/config\.cacheStores = \(config\.cacheStores \|\| \[\]\)\.map\(resilientStore\);/);
    expect(cfg).toMatch(/if \(attempt >= 3\) return null;/);
  });

  it('section titles use locale-aware capitals ("ABONELİK", not "ABONELIK")', () => {
    for (const f of ['src/components/ListRow.tsx', 'src/components/ui/Display.tsx', 'app/strength-test.tsx']) expect([f, read(f)]).not.toEqual([f, expect.stringMatching(/textTransform: 'uppercase'/)]);
    expect('Abonelik'.toLocaleUpperCase('tr-TR')).toBe('ABONELİK');
  });

  it('a stored time is turned into the local day (the UTC date is one day early after midnight in Turkey)', () => {
    expect(dayOf('2026-11-24')).toBe('2026-11-24');
    const late = new Date(2026, 10, 24, 1, 30); // 01:30 local
    expect(dayOf(late.toISOString())).toBe('2026-11-24');
    const p = painPolicy([{ id: 'p1', at: late.toISOString() }], '2026-11-24');
    expect(p.lockUntil).toBe('2026-12-01');
    expect(rescreenDue(late.toISOString(), '2026-11-25')).toBe(false);
  });

  it('workout counts and the streak use the shared rule: Tur 2 and the release session are not extra workouts', () => {
    const list = [w({}), w({ round: 2 }), w({ isMicro: true, track: 'relax' }), w({ isMicro: true })];
    expect(summarize(list, 0, 1).totalWorkouts).toBe(2);
    expect(completedDates([w({ isMicro: true, track: 'relax' })])).toEqual([]);
    expect(read('src/features/gamification/service.ts')).toMatch(/totalWorkouts: h\.workouts\.filter\(countsAsSession\)\.length/);
    expect(read('src/features/reminders/scheduler.ts')).toMatch(/return dayStatus\(useHistoryStore\.getState\(\)\.workouts, toDateKey\(\), useTrainingStore\.getState\(\)\.training\.dailyTarget\)\.full;/);
  });

  it('Kasık Fitness and the body scan pause when the app is left; "Rutini bitir?" pauses the routine', () => {
    const fit = read('app/fitness/[routineId].tsx');
    expect(fit).toMatch(/AppState\.addEventListener\('change'/);
    expect(fit).toMatch(/onPress=\{askFinish\}/);
    expect(fit).toMatch(/onDismiss=\{keepGoing\}/);
    expect(read('app/mind/body-scan.tsx')).toMatch(/AppState\.addEventListener\('change'/);
  });

  it('Odak slip and restart screens have a short header instead of repeating the card title', () => {
    expect(read('app/odak/slip.tsx')).toMatch(/<Header title=\{tr\('odak\.slipTitle'\)\}/);
    expect(read('app/odak/relapse.tsx')).toMatch(/<Header title=\{tr\('odak\.relapseTitle'\)\}/);
  });
});
