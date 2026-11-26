import { formatLockLeft, kegelLock, LOCK_HOURS, ROUNDS_BEFORE_LOCK } from '@/features/training/cooldown';
import type { WorkoutSession } from '@/types';

const w = (date: string, time: string, o: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: `${date}-${time}`,
  date,
  finishedAt: new Date(`${date}T${time}:00`).toISOString(),
  level: 1,
  plannedSec: 120,
  actualSec: 120,
  exercises: [],
  completed: true,
  contractions: 40,
  ...o,
});
const at = (date: string, time: string) => new Date(`${date}T${time}:00`);

describe('Kegel rest lock (2026-11-25): Tur 1 + Tur 2 + one more session (3 rounds), then 10 hours', () => {
  it('limits: 3 rounds, 10 hours', () => {
    expect([ROUNDS_BEFORE_LOCK, LOCK_HOURS]).toEqual([3, 10]);
  });
  it('open after Tur 1 + Tur 2; locked for 10 hours after the extra session', () => {
    const two = [w('2026-11-23', '08:00'), w('2026-11-23', '08:03')];
    expect(kegelLock(two, at('2026-11-23', '09:30'))).toEqual({ until: null, rounds: 2 });
    const three = [...two, w('2026-11-23', '09:03')];
    expect(kegelLock(three, at('2026-11-23', '09:30')).until).toEqual(at('2026-11-23', '19:03'));
    expect(kegelLock(three, at('2026-11-23', '19:03')).until).toBeNull();
  });
  it('the lock runs past midnight; rounds start from zero after it', () => {
    const four = ['20:00', '20:03', '21:03'].map((t) => w('2026-11-23', t));
    expect(kegelLock(four, at('2026-11-24', '06:00')).until).toEqual(at('2026-11-24', '07:03'));
    expect(kegelLock(four, at('2026-11-24', '08:00'))).toEqual({ until: null, rounds: 0 });
  });
  it('release sessions and unfinished rounds do not count', () => {
    const list = [w('2026-11-23', '08:00'), w('2026-11-23', '08:10', { isMicro: true, track: 'relax', contractions: 0 }), w('2026-11-23', '08:30', { completed: false }), w('2026-11-23', '08:40')];
    expect(kegelLock(list, at('2026-11-23', '09:00'))).toEqual({ until: null, rounds: 2 });
  });
  it('a round finished with skipped exercises (0 contractions) counts, as it does for the day (bug 2026-11-25)', () => {
    const list = ['08:00', '08:03', '09:00'].map((t) => w('2026-11-23', t, { contractions: 0 }));
    expect(kegelLock(list, at('2026-11-23', '09:30')).until).toEqual(at('2026-11-23', '19:00'));
  });
  it('rounds of earlier days do not add up', () => {
    const list = [w('2026-11-22', '08:00'), w('2026-11-22', '08:03'), w('2026-11-23', '08:00'), w('2026-11-23', '08:03')];
    expect(kegelLock(list, at('2026-11-23', '09:00'))).toEqual({ until: null, rounds: 2 });
  });
  it('formats the countdown as hh:mm:ss', () => {
    expect(formatLockLeft(at('2026-11-23', '19:03'), new Date(at('2026-11-23', '09:03').getTime() + 1000))).toBe('09:59:59');
    expect(formatLockLeft(at('2026-11-23', '09:00'), at('2026-11-23', '10:00'))).toBe('00:00:00');
  });
});
