import { buildExport, EXPORT_FORMAT, exportFileName, parseImport, serializeExport, type AppSnapshot } from '@/features/data/exportImport';
import { createMemoryRepo } from '@/features/data/repo';
import { setHistoryRepo, useHistoryStore } from '@/stores/historyStore';
import { defaultProfile, useProfileStore } from '@/stores/profileStore';
import { defaultContentProgress, useProgressStore } from '@/stores/progressStore';
import { defaultSettings, useSettingsStore } from '@/stores/settingsStore';
import { defaultTraining, useTrainingStore } from '@/stores/trainingStore';
import { restoreApp, snapshotApp, wipeApp } from '@/features/data/appData';

const sample = (): AppSnapshot => ({
  profile: { ...defaultProfile(), goals: ['endurance', 'bladder'], ageRange: '35-44', experience: 'some', activity: 'mid', onboardingDone: true, tutorialDone: true, disclaimerAcceptedAt: '2026-11-01T10:00:00.000Z', createdAt: '2026-11-01T10:00:00.000Z' },
  settings: { ...defaultSettings(), hapticStrength: 3, reminderTimes: ['08:30', '21:00'], theme: 'dark', saveUnloadNotes: true },
  training: { ...defaultTraining(), level: 7, consecutiveOk: 2, planDayIndex: 12, lastAdvancedDate: '2026-11-14' },
  progress: {
    content: { ...defaultContentProgress(), readStoryIds: ['pf-basics'], favoriteStoryIds: ['water'], courseProgress: { pf101: { completedLessonIds: ['pf101-1'], quizScores: { 'pf101-1': 0.5 } } } },
    challengeLogs: { '2026-11-14': { date: '2026-11-14', challengeIds: ['ph01', 'me02', 'nu03'], completedIds: ['ph01'] } },
    achievements: { first_workout: '2026-11-02T20:00:00.000Z' },
    lastMindSession: '2026-11-13',
  },
  history: {
    workouts: [
      { id: 'w1', date: '2026-11-14', finishedAt: '2026-11-14T20:05:00.000Z', level: 7, plannedSec: 300, actualSec: 296, exercises: [{ type: 'hold', completed: true, skipped: false }], feedback: 'ok', completed: true },
    ],
    strengthTests: [{ id: 's1', date: '2026-11-10', holdBestMs: 5400, holdAttemptsMs: [5000, 5400, 5100], quickCount: 14 }],
    fitnessLogs: [{ id: 'f1', date: '2026-11-12', routineId: 'beginner', durationSec: 290 }],
    notes: [{ id: 'n1', date: '2026-11-12', createdAt: '2026-11-12T09:00:00.000Z', text: 'Bugün daha iyi hissettim', kind: 'progress' }],
  },
});

describe('export / import', () => {
  it('round-trips losslessly through JSON', () => {
    const s = sample();
    const parsed = parseImport(serializeExport(buildExport(s)));
    expect(parsed).toEqual({ ok: true, data: s });
  });

  it('includes format, schema version and app name; never the entitlement', () => {
    const b = buildExport(sample(), new Date('2026-11-15T00:00:00Z'));
    expect(b.format).toBe(EXPORT_FORMAT);
    expect(b.schemaVersion).toBe(1);
    expect(b.exportedAt).toBe('2026-11-15T00:00:00.000Z');
    expect(JSON.stringify(b)).not.toContain('entitlement');
  });

  it('rejects invalid, foreign, newer and corrupt files', () => {
    expect(parseImport('not json')).toEqual({ ok: false, error: 'invalidJson' });
    expect(parseImport('{"hello":1}')).toEqual({ ok: false, error: 'wrongFormat' });
    const b = buildExport(sample());
    expect(parseImport(JSON.stringify({ ...b, schemaVersion: 99 }))).toEqual({ ok: false, error: 'newerVersion' });
    expect(parseImport(JSON.stringify({ ...b, history: { workouts: 'x' } }))).toEqual({ ok: false, error: 'corrupt' });
    expect(parseImport(JSON.stringify({ ...b, history: { ...b.history, workouts: [{ nope: 1 }] } }))).toEqual({ ok: false, error: 'corrupt' });
  });

  it('builds a safe file name', () => {
    expect(exportFileName(new Date('2026-11-15T10:00:00Z'))).toMatch(/^[\p{L}\p{N}-]+-yedek-2026-11-15\.json$/u);
  });

  it('export → wipe → import cycle restores every store exactly', () => {
    setHistoryRepo(createMemoryRepo());
    const s = sample();
    restoreApp(s);
    const json = serializeExport(buildExport(snapshotApp()));
    wipeApp();
    expect(useHistoryStore.getState().workouts).toEqual([]);
    expect(useProfileStore.getState().profile.onboardingDone).toBe(false);
    expect(useTrainingStore.getState().training.level).toBe(1);
    const r = parseImport(json);
    if (!r.ok) throw new Error(r.error);
    restoreApp(r.data);
    expect(snapshotApp()).toEqual(s);
    expect(useSettingsStore.getState().settings.theme).toBe('dark');
    expect(useProgressStore.getState().achievements.first_workout).toBeDefined();
  });
});
