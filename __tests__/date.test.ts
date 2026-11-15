import { addDays, daysBetween, formatDuration, startOfWeek, toDateKey } from '@/lib/date';

describe('date utils', () => {
  it('formats date keys in local time', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
  it('adds days across month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('counts days between keys', () => {
    expect(daysBetween('2026-03-28', '2026-04-02')).toBe(5);
    expect(daysBetween('2026-04-02', '2026-03-28')).toBe(-5);
  });
  it('finds monday as start of week', () => {
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09'); // Sunday → previous Monday
    expect(startOfWeek('2026-11-09')).toBe('2026-11-09');
  });
  it('formats durations', () => {
    expect(formatDuration(65)).toBe('1:05');
  });
});
