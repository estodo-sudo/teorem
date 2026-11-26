import { bestHold, heatMap, holdTrend, strengthTestDue, summarize, weeklyMinutes } from '@/features/progress/stats';
import type { StrengthTest, WorkoutSession } from '@/types';

const w = (date: string, sec: number, completed = true): WorkoutSession => ({
  id: `${date}-${sec}-${completed}`,
  date,
  finishedAt: `${date}T20:00:00.000Z`,
  level: 1,
  plannedSec: sec,
  actualSec: sec,
  exercises: [],
  completed,
});

const st = (date: string, holdBestMs: number, quickCount = 10): StrengthTest => ({
  id: date,
  date,
  holdBestMs,
  holdAttemptsMs: [holdBestMs],
  quickCount,
});

describe('progress stats', () => {
  const today = '2026-11-15'; // Sunday; week starts 2026-11-09

  it('summarizes totals', () => {
    const s = summarize([w('2026-11-14', 240), w('2026-11-15', 300), w('2026-11-15', 60, false)], 5, 7);
    expect(s).toEqual({ totalWorkouts: 2, totalMinutes: 10, longestStreak: 5, level: 7 });
  });

  it('buckets weekly minutes, oldest first', () => {
    const r = weeklyMinutes([w('2026-11-09', 300), w('2026-11-15', 300), w('2026-11-02', 120), w('2025-01-01', 999)], today, 3);
    expect(r).toEqual([
      { week: '2026-10-26', minutes: 0 },
      { week: '2026-11-02', minutes: 2 },
      { week: '2026-11-09', minutes: 10 },
    ]);
  });

  it('builds a heat map of weeks × 7 days with intensities', () => {
    // A day is Tur 1 + Tur 2 (2026-11-25): one half = 1, both = 2, both and an extra = 3.
    const r2 = (date: string): WorkoutSession => ({ ...w(date, 240), round: 2 });
    const micro = (date: string): WorkoutSession => ({ ...w(date, 60), isMicro: true });
    const cols = heatMap([w('2026-11-15', 240), r2('2026-11-15'), micro('2026-11-15'), w('2026-11-14', 240), r2('2026-11-14'), w('2026-11-13', 240), w('2026-11-12', 30, false)], today, 2);
    expect(cols).toHaveLength(2);
    expect(cols[0]![0]!.date).toBe('2026-11-02');
    const last = cols[1]!;
    expect(last[6]).toEqual({ date: '2026-11-15', intensity: 3 });
    expect(last[5]!.intensity).toBe(2);
    expect(last[4]!.intensity).toBe(1);
    expect(last[3]!.intensity).toBe(0);
    expect(last[0]!.intensity).toBe(0);
  });

  it('heat map leaves future days empty', () => {
    const cols = heatMap([w('2026-11-12', 240)], '2026-11-11', 1);
    expect(cols[0]![3]).toEqual({ date: '2026-11-12', intensity: 0 });
  });

  it('sorts trends by date and converts hold to seconds', () => {
    expect(holdTrend([st('2026-11-08', 6500), st('2026-11-01', 4000)])).toEqual([
      { date: '2026-11-01', value: 4 },
      { date: '2026-11-08', value: 6.5 },
    ]);
  });

  it('reminds weekly about the strength test', () => {
    expect(strengthTestDue([], today)).toBe(true);
    expect(strengthTestDue([st('2026-11-10', 1)], today)).toBe(false);
    expect(strengthTestDue([st('2026-11-01', 1), st('2026-11-08', 1)], today)).toBe(true);
  });

  it('takes the best hold attempt', () => {
    expect(bestHold([3200, 4100, 3900])).toBe(4100);
    expect(bestHold([])).toBe(0);
  });
});
