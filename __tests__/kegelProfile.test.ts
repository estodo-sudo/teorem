import fs from 'fs';
import path from 'path';

import { generateSession } from '@/features/training/generateSession';
import { chooseTrack, confirmSurgeryClearance, initialTrack, needsScreening, rescreenReminder, saveScreening, SCREENING } from '@/features/training/kegelProfile';
import { buildTodaySession } from '@/features/training/service';
import { defaultTraining } from '@/features/training/plan';
import { defaultKegelData, sanitizeKegelData, useKegelStore } from '@/stores/kegelStore';
import { useTrainingStore } from '@/stores/trainingStore';

const root = path.join(__dirname, '..');

beforeEach(() => {
  useKegelStore.getState().reset();
  useTrainingStore.getState().replace(defaultTraining());
});

describe('muscle profile screening (spec 2)', () => {
  it('8 questions, the first three about pain; intro says it is not a diagnosis; content unreviewed', () => {
    expect(SCREENING.questions).toHaveLength(8);
    expect(SCREENING.questions.slice(0, 3).every((q) => q.pain)).toBe(true);
    expect(SCREENING.questions.slice(3).some((q) => q.pain)).toBe(false);
    expect(SCREENING.intro).toMatch(/tanı değildir/);
    const json = JSON.parse(fs.readFileSync(path.join(root, 'src', 'content', 'kegel', 'screening.tr.json'), 'utf8')) as { reviewed: boolean; sourceIds: string[] };
    expect(json.reviewed).toBe(false);
    expect(json.sourceIds.length).toBeGreaterThan(0);
  });

  it('the relaxation suggestion uses the spec text and recommends a specialist', () => {
    expect(SCREENING.result.relaxText).toMatch(/gerginlik taşıyor olabileceğini/);
    expect(SCREENING.result.relaxText).toMatch(/pelvik taban fizyoterapistine/);
  });

  it('saves the profile; ≥ 2 yes → hypertonic, sessions then cap holds and add release', () => {
    const r = saveScreening([false, true, false, true, false, false, false, false]);
    expect(r).toMatchObject({ hypertonicFlag: true, painFlag: true, suggestTrack: 'relax' });
    const p = useKegelStore.getState().profile!;
    expect(p).toMatchObject({ hypertonicFlag: true, painFlag: true, primaryTrack: 'general' });
    expect(p.screeningAnswers).toHaveLength(8);
    // The track stays the user's choice; the session follows the profile.
    expect(useTrainingStore.getState().training.track).toBe('general');
    const s = buildTodaySession(useTrainingStore.getState().training, '2026-11-19', { strengthFalling: false });
    expect(Math.max(...s.phases.filter((x) => x.kind === 'contract').map((x) => x.durationMs))).toBeLessThanOrEqual(5000);
    expect(s.blocks.filter((b) => b.role === 'main' && b.type === 'release').length).toBeGreaterThan(0);
  });

  it('asked once (new and migrated users), skipping is allowed; relax track re-screens every 2 weeks', () => {
    expect(needsScreening(useKegelStore.getState())).toBe(true);
    useKegelStore.getState().skipScreening('2026-11-19T10:00:00.000Z');
    expect(needsScreening(useKegelStore.getState())).toBe(false);
    saveScreening(Array(8).fill(false), new Date(2026, 10, 1, 10));
    expect(rescreenReminder(useKegelStore.getState(), 'relax', '2026-11-10')).toBe(false);
    expect(rescreenReminder(useKegelStore.getState(), 'relax', '2026-11-19')).toBe(true);
    expect(rescreenReminder(useKegelStore.getState(), 'general', '2026-11-19')).toBe(false);
  });
});

describe('tracks and the surgery clearance (spec 3, 11.3)', () => {
  it('the surgery track does not open without "my doctor approved"', () => {
    expect(chooseTrack('surgery')).toBe(false);
    expect(useTrainingStore.getState().training.track).toBe('general');
    confirmSurgeryClearance(new Date(2026, 10, 19));
    expect(chooseTrack('surgery')).toBe(true);
    expect(useTrainingStore.getState().training.track).toBe('surgery');
  });

  it('changing the track keeps the level and updates the profile', () => {
    useTrainingStore.getState().update({ level: 9 });
    saveScreening(Array(8).fill(false));
    expect(chooseTrack('bladder')).toBe(true);
    expect(useTrainingStore.getState().training).toMatchObject({ track: 'bladder', level: 9 });
    expect(useKegelStore.getState().profile?.primaryTrack).toBe('bladder');
  });

  it('onboarding goals pick the first track by priority; surgery only once cleared', () => {
    expect(initialTrack(['postSurgery', 'erection'])).toBe('erection');
    confirmSurgeryClearance();
    expect(initialTrack(['postSurgery', 'erection'])).toBe('surgery');
  });

  it('the surgery clearance and the skip survive backup sanitising', () => {
    const d = sanitizeKegelData({ ...defaultKegelData(), surgeryClearance: { confirmedAt: '2026-11-19T10:00:00.000Z' }, screeningSkippedAt: '2026-11-19T10:00:00.000Z' });
    expect(d.surgeryClearance).toEqual({ confirmedAt: '2026-11-19T10:00:00.000Z' });
    expect(d.screeningSkippedAt).toBe('2026-11-19T10:00:00.000Z');
    expect(sanitizeKegelData({ surgeryClearance: { confirmedAt: 4 } }).surgeryClearance).toBeNull();
  });

  it('erection track uses all three positions every session; relax never standing', () => {
    for (const weekIndex of [0, 1, 6]) {
      const e = generateSession({ track: 'erection', level: 10, durationPreset: 'quick', dayIndex: 0, weekIndex, hypertonic: false, seed: 'x' });
      expect(new Set(e.blocks.filter((b) => b.role === 'main').map((b) => b.position)).size).toBe(3);
      const r = generateSession({ track: 'relax', level: 10, durationPreset: 'full', dayIndex: 0, weekIndex, hypertonic: true, seed: 'x' });
      expect(r.blocks.some((b) => b.position === 'standing')).toBe(false);
    }
  });
});

describe('screens', () => {
  it('onboarding goes to the screening before the tutorial; screens have roles and ≥ 48 px targets', () => {
    expect(fs.readFileSync(path.join(root, 'app', 'onboarding', 'index.tsx'), 'utf8')).toMatch(/\/kegel\/screening/);
    for (const f of ['screening.tsx', 'tracks.tsx']) {
      const src = fs.readFileSync(path.join(root, 'app', 'kegel', f), 'utf8');
      for (const m of src.matchAll(/<Pressable\b([\s\S]*?)(?<!=)>/g)) {
        expect([f, m[1]!.includes('accessibilityRole')]).toEqual([f, true]);
        for (const n of m[1]!.matchAll(/minHeight: (\d+)/g)) expect(Number(n[1])).toBeGreaterThanOrEqual(48);
      }
    }
    expect(fs.readFileSync(path.join(root, 'app', 'kegel', 'tracks.tsx'), 'utf8')).toMatch(/tracks\.catheter/);
  });
});
