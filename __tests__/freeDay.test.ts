import fs from 'fs';
import path from 'path';

import { createMemoryRepo } from '@/features/data/repo';
import { completedDates } from '@/features/gamification/service';
import { computeStreak } from '@/features/gamification/streak';
import { premiumRuleFor } from '@/features/purchases/routeGate';
import { generateSession } from '@/features/training/generateSession';
import { defaultTraining } from '@/features/training/plan';
import { recordWorkout } from '@/features/training/service';
import { dailyProgress, dayStatus, targetDays } from '@/features/training/summary';
import { setHistoryRepo, useHistoryStore } from '@/stores/historyStore';
import { useTrainingStore } from '@/stores/trainingStore';

/**
 * Premium audit (2026-11-26): without premium Tur 2 is locked, so a free user could never finish a day —
 * the streak stayed at 0, trophies never came and the daily reminders kept nagging after Tur 1.
 * A Tur 1 finished while Tur 2 was locked now completes that day on its own (stored per day).
 */
const read = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const session = generateSession({ level: 5, dayIndex: 1, weekIndex: 1, seed: 'free' });
const done = { actualSec: 300, endedEarly: false, outcomes: session.blocks.map(() => ({ completed: true, skipped: false })), pauses: 0 };

beforeEach(() => {
  setHistoryRepo(createMemoryRepo());
  useHistoryStore.getState().replaceAll({ workouts: [], strengthTests: [], fitnessLogs: [], notes: [] });
  useTrainingStore.getState().replace({ ...defaultTraining() });
});

describe('a free day is complete after Tur 1', () => {
  it('recordWorkout marks a finished Tur 1 when Tur 2 is locked (never Tur 2, a micro set or an early stop)', () => {
    const w = recordWorkout(session, done, new Date(2026, 10, 20, 20), { round2Locked: true });
    expect(w.round2Locked).toBe(true);
    expect(recordWorkout(session, done, new Date(2026, 10, 21, 20)).round2Locked).toBeUndefined();
    expect(recordWorkout({ ...session, round: 2 }, done, new Date(2026, 10, 22, 20), { round2Locked: true }).round2Locked).toBeUndefined();
    expect(recordWorkout({ ...session, isMicro: true }, done, new Date(2026, 10, 23, 20), { round2Locked: true }).round2Locked).toBeUndefined();
    // an early stop is stored with the flag but is no finished round, so the day stays open
    const early = recordWorkout(session, { ...done, endedEarly: true }, new Date(2026, 10, 24, 20), { round2Locked: true });
    expect(dayStatus([early], early.date).full).toBe(false);
  });

  it('dayStatus: Tur 1 alone completes a locked day; with premium both halves are still needed', () => {
    const free = [{ date: '2026-11-20', completed: true, round2Locked: true }];
    expect(dayStatus(free, '2026-11-20')).toMatchObject({ mainDone: true, round2Done: false, round2Locked: true, full: true, counted: 1, target: 2 });
    // the feedback card: "1/1" with a full bar, not "1/2" next to "done"
    expect(dailyProgress(free, '2026-11-20')).toEqual({ done: 1, target: 1, reached: true });
    const premium = [{ date: '2026-11-20', completed: true }];
    expect(dayStatus(premium, '2026-11-20').full).toBe(false);
    expect(dayStatus([...premium, { date: '2026-11-20', completed: true, round: 2 as const }], '2026-11-20').full).toBe(true);
  });

  it('the streak grows on free days, and buying premium later keeps those days', () => {
    const days = ['2026-11-18', '2026-11-19', '2026-11-20'];
    const free = days.map((date, i) => ({ id: `w${i}`, date, finishedAt: `${date}T20:00:00Z`, level: 1, plannedSec: 300, actualSec: 300, exercises: [], completed: true, round2Locked: true }));
    expect(targetDays(free).full).toEqual(days);
    expect(computeStreak(completedDates(free), '2026-11-20').current).toBe(3);
    // the next day with premium: only Tur 1 so far → that day is open, but the run of free days stays
    const withPremium = [...free, { ...free[0]!, id: 'w3', date: '2026-11-21', finishedAt: '2026-11-21T20:00:00Z', round2Locked: undefined }];
    expect(targetDays(withPremium).partial).toEqual(['2026-11-21']);
    expect(computeStreak(completedDates(withPremium), '2026-11-21').current).toBe(3);
  });

  it('the player stores the flag from the gate; the Günüm card still offers Tur 2 after a free Tur 1', () => {
    expect(read('app/workout/[sessionId].tsx')).toMatch(/recordWorkout\(session, result, undefined, \{ round2Locked: !canAccess\('round2'\) \}\)/);
    expect(read('src/features/data/db.ts')).toMatch(/'round2Locked'\] as const/);
    expect(read('src/features/today/WorkoutCard.tsx')).toMatch(/const dayDone = status\.mainDone && status\.round2Done;/);
  });
});

describe('premium-only reminders and direct links', () => {
  it('no weekly-test reminder without premium; reminders re-sync when premium starts or ends', () => {
    expect(read('src/features/reminders/scheduler.ts')).toMatch(/weeklyTest: s\.weeklyTestReminder && canAccess\('strengthTest'\)/);
    expect(read('src/features/app/AppEffects.tsx')).toMatch(/useEntitlementStore\.subscribe\(\(state, prev\) => \{\s*if \(state\.entitlement !== prev\.entitlement\) void syncReminders\(\);/);
  });

  it('a direct link into a premium area opens the "fırsat" paywall, like the buttons', () => {
    expect(read('app/_layout.tsx')).toMatch(/params: \{ source: rule, offer: '1' \}/);
    expect(premiumRuleFor(['fitness', '[routineId]'])).toBe('fitness');
    expect(premiumRuleFor(['story', '[storyId]'])).toBe('stories');
    expect(premiumRuleFor(['mind', 'breathing'])).toBe('mind');
    expect(premiumRuleFor(['strength-test'])).toBe('strengthTest');
    expect(premiumRuleFor(['workout', '[sessionId]'])).toBe('workout');
  });

  it('"Satın alımları geri yükle" in Profil says what happened', () => {
    const p = read('app/(tabs)/profile.tsx');
    expect(p).toMatch(/setRestoreMsg\(ok \? tr\('profile\.sub\.restored'\) : tr\('paywall\.restoreNone'\)\)/);
  });

  it('a lesson is never a dead end without premium: "Tur 2\'yi sonra yap" replaces "Bir kez daha dene"', () => {
    for (const [file, later] of [
      ['app/workout/round2-intro.tsx', 'round.intro.later'],
      ['app/workout/move-intro.tsx', 'moveIntro.later'],
    ] as const) {
      const s = read(file);
      const block = s.slice(s.indexOf('{premium ? ('), s.indexOf('testID="lesson-later"'));
      expect(block).toContain(`label={tr('${later}')}`);
      expect(block).toContain('onPress={later}');
    }
  });
});

describe('trial wording and the subscription row (2026-11-26)', () => {
  const tr = JSON.parse(read('src/i18n/tr.json'));
  const en = JSON.parse(read('src/i18n/en.json'));
  const all = (o: unknown): string[] => (typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(all) : []);

  it('nothing promises a reminder or an e-mail before the trial ends', () => {
    expect(tr.paywall.soft.step2).toBeUndefined();
    expect(tr.paywall.soft.step2Title).toBeUndefined();
    expect(read('app/paywall.tsx')).not.toMatch(/soft\.step2/);
    for (const lang of [tr, en]) {
      const texts = [...all(lang.paywall), ...all(lang.legal)].filter((x) => /deneme|trial/i.test(x));
      for (const x of texts) expect(x).not.toMatch(/e-?posta|e-?mail|hatırlat|remind|bildirim|notif/i);
    }
  });

  it('the policies describe the trial on every plan, not only the yearly one', () => {
    for (const lang of [tr, en]) {
      const legal = all(lang.legal).join(' ');
      expect(legal).not.toMatch(/Yıllık planda ücretsiz deneme|Yıllık planı ücretsiz denemeyle|yearly plan may (offer|include) a free trial|start the yearly plan with a free trial/);
    }
    expect(tr.legal.faq.sections[6].paragraphs[0]).toMatch(/Bir planı ücretsiz denemeyle/);
  });

  it('Profil shows the status only, no renewal or end date', () => {
    expect(read('app/(tabs)/profile.tsx')).not.toMatch(/sub\.renews|expiresAt/);
    expect(tr.profile.sub.renews).toBeUndefined();
  });
});
