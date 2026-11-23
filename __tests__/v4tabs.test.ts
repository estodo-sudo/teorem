import fs from 'fs';
import path from 'path';

import { APP_NAME } from '@/config/app';
import { EXERCISE_GUIDE, LOCKED_EXERCISES } from '@/features/training/exerciseGuide';
import { weekCount, weekDays, weekStartKey } from '@/features/today/week';
import tr from '@/i18n/tr.json';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), canDismiss: () => false, dismissAll: jest.fn() } }));

const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

describe('tabs (SPEC_V4 §A.1)', () => {
  it('four tabs: Günüm · İlerleme · Keşfet · Profil; Günüm has the Sun icon', () => {
    const layout = read('app/(tabs)/_layout.tsx');
    const tabs = [...layout.matchAll(/\{ name: '(\w+)', key: '(\w+)', icon: '(\w+)' \}/g)].map((m) => [m[1], m[2], m[3]]);
    expect(tabs).toEqual([
      ['index', 'home', 'sun'],
      ['progress', 'progress', 'chart'],
      ['discover', 'discover', 'compass'],
      ['profile', 'profile', 'user'],
    ]);
    expect(tr.tabs).toEqual({ home: 'Günüm', progress: 'İlerleme', discover: 'Keşfet', profile: 'Profil' });
    expect(fs.readdirSync(path.join(root, 'app/(tabs)')).filter((f) => f.endsWith('.tsx') && f !== '_layout.tsx').sort()).toEqual(['discover.tsx', 'index.tsx', 'profile.tsx', 'progress.tsx']);
  });

  it('/training still works and leads to Günüm', () => {
    const r = read('app/training.tsx');
    expect(r).toMatch(/<Redirect href="\/" \/>/);
    expect(JSON.stringify(read('src/content/camps/odak/rebuild.tr.json'))).not.toMatch(/"\/training"|\\"\/training\\"/);
    for (const f of ['app/kegel/plan.tsx', 'app/kegel/tracks.tsx', 'app/kegel/screening.tsx']) expect([f, read(f).includes('(tabs)/training')]).toEqual([f, false]);
  });
});

describe('Günüm (SPEC_V4 §A.2)', () => {
  const home = read('app/(tabs)/index.tsx');

  it('has this week, the checklist, Kasık Fitness, Rahatla and "Senin için"; no quick start, no mind list', () => {
    const order = ['<WorkoutCard', '<ThisWeek', '<DailyGoalCard', '<FitnessCard', '<GlossaryStrip', '<TodayExtras'].map((x) => home.indexOf(x));
    expect(order.every((x) => x > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(home).not.toMatch(/QuickStart|MindSection/);
  });

  it('the week strip runs Monday → Sunday with done, today, rest and later days', () => {
    expect(weekStartKey('2026-11-21')).toBe('2026-11-16'); // a Saturday → that Monday
    const days = weekDays('2026-11-19', ['2026-11-16', '2026-11-18', '2026-11-19'], ['2026-11-21']);
    expect(days.map((d) => d.state)).toEqual(['done', 'missed', 'done', 'todayDone', 'future', 'rest', 'future']);
    expect(weekCount(days)).toEqual({ done: 3, total: 6 });
    expect(tr.home.week.summary).toBe('Bu hafta {{done}}/{{total}} antrenman · {{theme}}');
  });

  it('Kasık Fitness keeps "8 egzersiz · 8 dk" on one line, with the badge next to the name', () => {
    const src = read('src/features/today/WeekSections.tsx');
    const fitness = src.slice(src.indexOf('export function FitnessCard'), src.indexOf('const RELAX'));
    expect(fitness.indexOf('<Badge')).toBeLessThan(fitness.indexOf('numberOfLines={1}'));
    expect(fitness).toMatch(/numberOfLines=\{1\}/);
  });

  it('"Neden, Nedir ve Ne Demek?" posters replace Rahatla on Günüm (and stay in Keşfet); the breath module still exists', () => {
    const strip = read('src/features/today/GlossaryStrip.tsx');
    expect(strip).toMatch(/StoryPosterCard/);
    expect(strip).toMatch(/\/glossary\/\[termId\]/);
    expect(read('app/(tabs)/discover.tsx')).toMatch(/GlossaryCompactCard/);
    expect(read('src/features/today/WeekSections.tsx')).not.toMatch(/RelaxCard/);
    expect(read('app/mind/breathing.tsx')).toMatch(/BreathPlayer/);
  });

  it('the micro set button carries an icon; the 1-minute breath button is gone (2026-11-22)', () => {
    const card = read('src/features/today/WorkoutCard.tsx');
    expect(card).toMatch(/microShort[^\n]*icon="pulse"/);
    expect(card).not.toMatch(/breathShort/);
  });
});

describe('Profil (SPEC_V4 §A.3)', () => {
  const profile = read('app/(tabs)/profile.tsx');

  it('Antrenman: active track, "Kas yapını öğrenelim", then tutorial · trophies; Ayarlar under restore', () => {
    const order = ['<ActiveTrackCard', '<MuscleStructureCard', "profile.replayTutorial", "profile.training.trophies"].map((x) => profile.indexOf(x));
    // "Ayarlar" sits right under "Satın alımları geri yükle" (2026-11-23).
    expect(profile.indexOf("settings.training.title")).toBeGreaterThan(profile.indexOf("paywall.restore"));
    expect(profile.indexOf("settings.training.title")).toBeLessThan(profile.indexOf('<ActiveTrackCard'));
    expect(tr.settings.training.title).toBe('Ayarlar');
    expect(order.every((x) => x > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // The programme's three moves (user decision 2026-11-22).
    expect(EXERCISE_GUIDE.map((x) => x.type)).toEqual(['slow_hold', 'quick_flick', 'elevator']);
    // Plus nine locked ones "for higher levels": 12 in the guide, each with a name and a short description.
    expect(EXERCISE_GUIDE.length + LOCKED_EXERCISES.length).toBe(12);
    // The guide lives on İlerleme now; locked rows don't reveal their names.
    expect(read('app/(tabs)/progress.tsx')).toContain('<ExerciseGuide');
    expect(profile).not.toContain('<ExerciseGuide');
    expect(read('src/features/training/ProfileTraining.tsx')).not.toMatch(/exerciseSoon\.\$\{x\.id\}/);
    expect(tr.profile.training.muscleTitle).toBe('Kas yapını öğrenelim');
  });

  it('"Kas yapını öğrenelim" has no "Daha sonra"', () => {
    const src = read('src/features/training/ProfileTraining.tsx');
    expect(src).not.toMatch(/kegel\.card\.later/);
  });

  it('shows the app name from app.ts, never the placeholder', () => {
    expect(APP_NAME).toBe('Uygulama');
    expect(profile).toMatch(/\{APP_NAME\}/);
  });
});
