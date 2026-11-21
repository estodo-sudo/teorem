import fs from 'fs';
import path from 'path';

import { APP_NAME } from '@/config/app';
import { EXERCISE_GUIDE } from '@/features/training/exerciseGuide';
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
    const order = ['<WorkoutCard', '<ThisWeek', '<DailyGoalCard', '<FitnessCard', '<RelaxCard', '<TodayExtras'].map((x) => home.indexOf(x));
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

  it('Rahatla has three equal boxes; Nefes opens the breath module', () => {
    const src = read('src/features/today/WeekSections.tsx');
    expect(src).toMatch(/key: 'breathing', route: '\/mind\/breathing'/);
    expect(src).toMatch(/key: 'unload'/);
    expect(src).toMatch(/key: 'bodyScan'/);
    expect(read('app/mind/breathing.tsx')).toMatch(/BreathPlayer/);
  });

  it('the micro set and breath buttons carry icons', () => {
    const card = read('src/features/today/WorkoutCard.tsx');
    expect(card).toMatch(/microShort[^\n]*icon="pulse"/);
    expect(card).toMatch(/breathShort'\)\} icon="wind"/);
  });
});

describe('Profil (SPEC_V4 §A.3)', () => {
  const profile = read('app/(tabs)/profile.tsx');

  it('Antrenman: active track, "Kas yapını öğrenelim", the exercise guide, then tutorial · trophies · settings', () => {
    const order = ['<ActiveTrackCard', '<MuscleStructureCard', '<ExerciseGuide', "profile.replayTutorial", "profile.training.trophies", "settings.training.title"].map((x) => profile.indexOf(x));
    expect(order.every((x) => x > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(EXERCISE_GUIDE).toHaveLength(8);
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
