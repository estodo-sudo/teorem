import { planReminders, type ReminderInput } from '@/features/reminders/plan';
import tr from '@/i18n/tr.json';

const base = (patch: Partial<ReminderInput> = {}): ReminderInput => ({
  now: new Date(2026, 10, 15, 10, 0), // 15 Nov 2026 10:00 local
  times: ['21:00'],
  enabled: true,
  completedToday: false,
  discreet: true,
  weeklyTest: false,
  lastStrengthTest: null,
  ...patch,
});

describe('planReminders', () => {
  it('plans one reminder per day for the next 7 days', () => {
    const r = planReminders(base());
    expect(r).toHaveLength(7);
    expect(r[0]!.fireAt).toEqual(new Date(2026, 10, 15, 21, 0));
    expect(r[6]!.fireAt).toEqual(new Date(2026, 10, 21, 21, 0));
  });

  it('skips times that already passed today', () => {
    const r = planReminders(base({ now: new Date(2026, 10, 15, 22, 0) }));
    expect(r[0]!.fireAt).toEqual(new Date(2026, 10, 16, 21, 0));
    expect(r).toHaveLength(6);
  });

  it('cancels the rest of today once the workout is done', () => {
    const r = planReminders(base({ times: ['12:00', '18:00', '21:00'], completedToday: true }));
    expect(r.every((x) => x.fireAt.getDate() !== 15)).toBe(true);
    expect(r).toHaveLength(18);
  });

  it('Kegel v2: up to 4 times per day in any order, de-duplicated and sorted, never an error', () => {
    const r = planReminders(base({ times: ['21:00', '09:00', '21:00', '13:00', '18:00', '22:30', 'xx'] }));
    const today = r.filter((x) => x.fireAt.getDate() === 15).map((x) => x.fireAt.getHours());
    expect(today).toEqual([13, 18, 21]); // 09:00 already passed; max 4 → 09,13,18,21
    expect(r.filter((x) => x.fireAt.getDate() === 16).map((x) => x.fireAt.getHours())).toEqual([9, 13, 18, 21]);
    expect(planReminders(base({ times: ['xx'] }))).toEqual([]);
  });

  it('Kegel v2: "skip today" and vacation silence reminders; the weekly test moves past the vacation', () => {
    const skip = planReminders(base({ times: ['12:00', '21:00'], skipDate: '2026-11-15' }));
    expect(skip.some((x) => x.fireAt.getDate() === 15)).toBe(false);
    expect(skip.some((x) => x.fireAt.getDate() === 16)).toBe(true);
    const away = planReminders(base({ vacation: { from: '2026-11-16', to: '2026-11-18' }, weeklyTest: true, lastStrengthTest: '2026-11-09' }));
    expect(away.filter((x) => x.kind === 'daily').map((x) => x.fireAt.getDate())).toEqual([15, 19, 20, 21]);
    const test = away.find((x) => x.kind === 'weeklyTest')!;
    expect(test.fireAt.getDate()).toBe(19);
  });

  it('returns nothing when disabled', () => {
    expect(planReminders(base({ enabled: false }))).toEqual([]);
    expect(planReminders(base({ times: [] }))).toEqual([]);
  });

  it('uses neutral texts by default and explicit ones when discreet is off', () => {
    const d = planReminders(base());
    expect(d.every((x) => x.bodyKey.startsWith('reminders.discreet.'))).toBe(true);
    const e = planReminders(base({ discreet: false }));
    expect(e.every((x) => x.bodyKey.startsWith('reminders.explicit.'))).toBe(true);
  });

  it('neutral notification texts never mention sensitive words', () => {
    const texts = JSON.stringify((tr as { reminders: { discreet: unknown } }).reminders.discreet).toLocaleLowerCase('tr');
    for (const word of ['kegel', 'cinsel', 'pelvik', 'sertleşme', 'penis', 'mesane', 'idrar']) {
      expect(texts).not.toContain(word);
    }
  });

  it('every referenced message key exists', () => {
    const all = [...planReminders(base({ weeklyTest: true })), ...planReminders(base({ discreet: false, weeklyTest: true }))];
    const dict = tr as unknown as Record<string, unknown>;
    for (const r of all) {
      for (const key of [r.bodyKey, r.titleKey]) {
        const v = key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], dict);
        expect(typeof v).toBe('string');
      }
    }
  });

  it('schedules the weekly strength test 7 days after the last one', () => {
    const r = planReminders(base({ weeklyTest: true, lastStrengthTest: '2026-11-12' }));
    const test = r.find((x) => x.kind === 'weeklyTest')!;
    expect(test.fireAt).toEqual(new Date(2026, 10, 19, 21, 30));
  });

  it('schedules an overdue strength test reminder today if time allows', () => {
    const r = planReminders(base({ weeklyTest: true, lastStrengthTest: '2026-11-01' }));
    expect(r.find((x) => x.kind === 'weeklyTest')!.fireAt).toEqual(new Date(2026, 10, 15, 21, 30));
  });

  it('ids are stable for idempotent re-planning', () => {
    expect(planReminders(base()).map((x) => x.id)).toEqual(planReminders(base()).map((x) => x.id));
  });
});
