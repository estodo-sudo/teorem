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
    const order = ['<WorkoutCard', '<ThisWeek', '<DailyGoalCard', '<FitnessCard', '<GlossaryStrip'].map((x) => home.indexOf(x));
    // "Senin için" was removed; today's foods are shown under "Bugün" as suggestions only (2026-11-23).
    expect(home).not.toMatch(/TodayExtras/);
    const daily = read('src/features/today/DailyGoalCard.tsx');
    expect(daily).toMatch(/nutritionTasksForDay/);
    expect(daily).not.toMatch(/setChallengeLog|challengeCategory/);
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

  it('Kasık Fitness is one photo card: chips and a single Başla, no level list (2026-11-23)', () => {
    const src = read('src/features/today/WeekSections.tsx');
    const fitness = src.slice(src.indexOf('export function FitnessCard'));
    expect(fitness).toMatch(/appImage\('today\/fitness'\)/);
    expect(fitness).toMatch(/<PhotoBackground image=\{cover\} id="fitnessVeil" textAt="bottom" \/>/);
    expect(fitness).toMatch(/standardRoutine\(\)/);
    expect(fitness).not.toMatch(/ROUTINES\.map|recommended/);
    expect((fitness.match(/<Button /g) ?? []).length).toBe(1);
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
    expect(card).toMatch(/microShort[\s\S]{0,200}icon="pulse"/);
    expect(card).not.toMatch(/breathShort/);
  });
});

describe('Profil (SPEC_V4 §A.3)', () => {
  const profile = read('app/(tabs)/profile.tsx');

  it('Antrenman: active track, "Kas yapını öğrenelim", then tutorial · trophies; Ayarlar under restore', () => {
    // "Kas yapını öğrenelim" was removed from Profil (2026-11-23).
    expect(profile).not.toMatch(/<MuscleStructureCard/);
    const order = ['<ActiveTrackCard', "profile.replayTutorial", "profile.training.trophies", "profile.groups.options"].map((x) => profile.indexOf(x));
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

describe('Günün antrenmanı cover (2026-11-23)', () => {
  it('Monday shows photo 1 … Sunday photo 7, then Monday photo 1 again', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { workoutCoverId } = require('@/features/today/weekdayCover') as typeof import('@/features/today/weekdayCover');
    // 23 November 2026 is a Monday.
    const ids = Array.from({ length: 8 }, (_, i) => workoutCoverId(new Date(2026, 10, 23 + i, 9)));
    expect(ids).toEqual(['today/workout-1', 'today/workout-2', 'today/workout-3', 'today/workout-4', 'today/workout-5', 'today/workout-6', 'today/workout-7', 'today/workout-1']);
  });

  it('the card draws the couple photo as its background with a light shade; a smooth progressive blur is baked into the file', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { appImage } = require('@/content/images') as typeof import('@/content/images');
    // Seven photos, one per weekday (2026-11-23).
    for (let n = 1; n <= 7; n++) expect(appImage(`today/workout-${n}`)?.bytes).toBeGreaterThan(0);
    const card = read('src/features/today/WorkoutCard.tsx');
    expect(card).toMatch(/appImage\(workoutCoverId\(new Date\(\)\)\)/);
    expect(card).toMatch(/<PhotoBackground image=\{cover\} id="workoutVeil" \/>/);
    const fetchSrc = read('scripts/images/fetch.mjs');
    expect(fetchSrc).toMatch(/hero: \{[^}]*bottomBlur: \{ from: 0\.56, to: 0\.86/);
    expect(fetchSrc).toMatch(/const levels = \[0\.35, 0\.65, 1\]/);
    // No stacked BlurView bands on the card (2026-11-23: "sansür gibi").
    expect(read('src/features/today/PhotoCard.tsx')).not.toMatch(/BlurView/);
  });
});

describe('"Neden, Nedir ve Ne Demek?" pages (2026-11-23)', () => {
  it('every term has its own header photo (bottom blurred) and the page puts it on top', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { IMAGES } = require('@/content/images') as typeof import('@/content/images');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GLOSSARY } = require('@/features/content/data') as typeof import('@/features/content/data');
    for (const g of GLOSSARY) expect([g.id, !!IMAGES[`glossary/${g.id}`]?.slide]).toEqual([g.id, true]);
    const page = read('app/glossary/[termId].tsx');
    expect(page).toMatch(/<Hero image=\{image\}/);
    expect(page).toMatch(/<NextCard /);
  });
});

describe('second polish round (2026-11-23)', () => {
  it('Bugün: the plain task list with the micro set again; the foods are their own section below; photo cards share one short height', () => {
    const daily = read('src/features/today/DailyGoalCard.tsx');
    expect(daily).toMatch(/today\.goals\.micro/);
    expect(daily).toMatch(/function TodayFoods/);
    const card = read('src/features/today/WorkoutCard.tsx');
    expect(card).not.toMatch(/today\.workout\.repeat/);
  });
  it('third round: summary next to the day, micro set back in the card, chips on the Kasık photo, plain move texts', () => {
    const card = read('src/features/today/WorkoutCard.tsx');
    expect(card).toMatch(/today\.workout\.summaryInline/);
    expect(card).not.toMatch(/BlurView/);
    expect(card.indexOf('today.workout.microShort')).toBeLessThan(card.indexOf('</Card>'));
    const fit = read('src/features/today/WeekSections.tsx');
    expect(fit.indexOf('chips.map')).toBeLessThan(fit.indexOf("tr('fitness.title')"));
    expect(fit).toMatch(/fitness\.cardDesc/);
    expect(read('src/features/today/PhotoCard.tsx')).toMatch(/export const PHOTO_SPACE = 170;/);
    expect(read('src/content/fitness.tr.json')).not.toMatch(/[Ll]eğen|[Pp]elvik/);
  });
  it('every story cover has a wide banner crop and the story of the day uses it', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { IMAGES } = require('@/content/images') as typeof import('@/content/images');
    const covers = Object.keys(IMAGES).filter((k) => /^story\/[^/]+$/.test(k));
    expect(covers.length).toBeGreaterThan(0);
    for (const k of covers) expect([k, !!IMAGES[k]!.wide]).toEqual([k, true]);
    expect(read('src/features/content/explore/ExploreCards.tsx')).toMatch(/style=\{StyleSheet\.absoluteFill\} wide \/>/);
  });
});
