import { buildExport, EXPORT_FORMAT, exportFileName, parseImport, serializeExport, type AppSnapshot } from '@/features/data/exportImport';
import { createMemoryRepo } from '@/features/data/repo';
import { setHistoryRepo, useHistoryStore } from '@/stores/historyStore';
import { defaultProfile, useProfileStore } from '@/stores/profileStore';
import { defaultContentProgress, useProgressStore } from '@/stores/progressStore';
import { defaultSettings, useSettingsStore } from '@/stores/settingsStore';
import { defaultTraining, useTrainingStore } from '@/stores/trainingStore';
import { restoreApp, snapshotApp, wipeApp } from '@/features/data/appData';
import { defaultAlcState } from '@/features/campus/alcohol/logic';
import { defaultBodyState } from '@/features/campus/body/logic';
import { defaultCampus, useCampusStore } from '@/stores/campusStore';
import { defaultCampState, emptyCampEvents } from '@/features/camps/smoking/state';
import { createMemoryCampRepo } from '@/features/camps/smoking/repo';
import { setCampRepo, useCampEventsStore, useCampStore } from '@/stores/campStore';
import { defaultKegelData, useKegelStore } from '@/stores/kegelStore';

const sample = (): AppSnapshot => ({
  profile: {
    ...defaultProfile(),
    goals: ['endurance', 'bladder'],
    ageRange: '35-44',
    experience: 'some',
    activity: 'mid',
    onboardingDone: true,
    tutorialDone: true,
    disclaimerAcceptedAt: '2026-11-01T10:00:00.000Z',
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  settings: { ...defaultSettings(), hapticStrength: 3, reminderTimes: ['08:30', '21:00'], theme: 'dark', saveUnloadNotes: true },
  training: { ...defaultTraining(), level: 7, consecutiveOk: 2, planDayIndex: 12, lastAdvancedDate: '2026-11-14' },
  progress: {
    content: { ...defaultContentProgress(), readStoryIds: ['pf-basics'], favoriteStoryIds: ['water'], courseProgress: { pf101: { completedLessonIds: ['pf101-1'], quizScores: { 'pf101-1': 0.5 } } } },
    challengeLogs: { '2026-11-14': { date: '2026-11-14', challengeIds: ['sn01', 'fr02', 'pl03'], completedIds: ['ph01'] } },
    achievements: { first_workout: '2026-11-02T20:00:00.000Z' },
    lastMindSession: '2026-11-13',
  },
  campus: {
    alcohol: {
      ...defaultAlcState(),
      setupDone: true,
      mode: 'cut',
      startedAt: '2026-11-02T09:00:00.000Z',
      firstStartedAt: '2026-11-02T09:00:00.000Z',
      weeklyLimit: 7,
      audit: [3, 1, 1],
      withdrawal: [false, false, false, false],
      reasonIds: ['sleep'],
      triggerIds: ['social'],
      drinks: [{ at: '2026-11-07T20:00:00.000Z', typeId: 'beer33', std: 1.3 }],
    },
    neck: {
      ...defaultBodyState(),
      setupDone: true,
      startedAt: '2026-11-04T09:00:00.000Z',
      firstStartedAt: '2026-11-04T09:00:00.000Z',
      answers: { screen: '4to6', pain: 'some' },
      sessions: [{ at: '2026-11-05T19:00:00.000Z', done: 8, total: 8 }],
      measures: [{ at: '2026-11-04T09:00:00.000Z', value: 6.5 }],
      checkDoneIds: ['phone-up'],
      stepDoneIds: ['what'],
    },
    feet: defaultBodyState(),
  },
  camp: {
    state: {
      ...defaultCampState(),
      profile: {
        products: ['cigarette'],
        perDay: 20,
        firstCigMinutes: 30,
        hsiScore: 3,
        hsiLevel: 'mid',
        years: 8,
        ageRange: '25to39',
        reasons: [{ id: 'health' }, { id: 'custom', text: 'Kızım için' }],
        triggers: ['coffee_tea', 'stress'],
        pastAttempts: 1,
        relapseCauses: ['stress'],
        method: 'quit_day',
        createdAt: '2026-11-10T09:00:00.000Z',
      },
      prices: [{ from: '2026-11-10T09:00:00.000Z', packPriceTRY: 100, packSize: 20 }],
      attempts: [{ id: 'att1', attemptNo: 1, startedAt: '2026-11-10T09:00:00.000Z', plannedQuitDate: '2026-11-17T00:00:00.000Z', status: 'preparing' }],
      plans: [{ id: 'p1', trigger: 'coffee_tea', ifText: 'Kahvemi içersem', thenText: 'balkona değil mutfağa geçeceğim', createdAt: '2026-11-10T09:05:00.000Z', usedCount: 2 }],
      missions: [{ missionId: 'prep-1', completedAt: '2026-11-10T20:00:00.000Z' }],
    },
    events: {
      cigarettes: [{ id: 'c1', attemptId: 'att1', at: '2026-11-11T08:00:00.000Z', trigger: 'coffee_tea', mood: 3, need: 2, isSlip: false }],
      cravings: [{ id: 'k1', at: '2026-11-12T15:00:00.000Z', intensityBefore: 7, intensityAfter: 3, toolUsed: ['surf'], outcome: 'resisted', durationSec: 240 }],
      checkins: [{ id: 'h1', at: '2026-11-12T21:00:00.000Z', smoked: false, cravingCount: 3, mood: 4, symptoms: ['irritable'] }],
    },
  },
  kegel: {
    profile: { primaryTrack: 'bladder', hypertonicFlag: false, painFlag: false, screeningAnswers: [false, false, false, true, false, false, false, true], screenedAt: '2026-11-10T09:00:00.000Z' },
    painReports: [{ id: 'pain1', at: '2026-11-13T20:00:00.000Z', sessionId: 'w0' }],
    selfRatings: [{ id: 'sr1', at: '2026-11-14T09:00:00.000Z', track: 'bladder', answers: { dribble: 6, control: 7 } }],
    functionalTasks: [{ id: '2026-11-14_stand', date: '2026-11-14', taskId: 'stand', done: true }],
    surgeryClearance: { confirmedAt: '2026-11-09T09:00:00.000Z' },
    screeningSkippedAt: null,
  },
  history: {
    workouts: [
      { id: 'w1', date: '2026-11-14', finishedAt: '2026-11-14T20:05:00.000Z', level: 7, plannedSec: 300, actualSec: 296, exercises: [{ type: 'hold', completed: true, skipped: false }], feedback: 'ok', completed: true },
      {
        id: 'w2',
        date: '2026-11-15',
        finishedAt: '2026-11-15T20:05:00.000Z',
        level: 7,
        plannedSec: 300,
        actualSec: 300,
        exercises: [{ type: 'slow_hold', completed: true, skipped: false }],
        feedback: 'ok',
        completed: true,
        track: 'bladder',
        durationPreset: 'standard',
        pauses: 1,
        skippedBlocks: 0,
        completionRate: 1,
        isMicro: false,
        contractions: 64,
        deload: false,
      },
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
    expect(b.schemaVersion).toBe(4);
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

  it('imports v1 backups (before campuses) with an empty campus', () => {
    const { campus: _campus, ...v1 } = buildExport(sample());
    const r = parseImport(JSON.stringify({ ...v1, schemaVersion: 1 }));
    if (!r.ok) throw new Error(r.error);
    expect(r.data.campus).toEqual(defaultCampus());
    expect(r.data.training.level).toBe(7);
  });

  it('imports v2 backups (before the smoking camp) with an empty camp', () => {
    const { camp: _camp, ...v2 } = buildExport(sample());
    const r = parseImport(JSON.stringify({ ...v2, schemaVersion: 2 }));
    if (!r.ok) throw new Error(r.error);
    expect(r.data.camp).toEqual({ state: defaultCampState(), events: emptyCampEvents() });
  });

  it('imports v3 backups (before Kegel v2): training migrated, level kept, empty kegel data', () => {
    const { kegel: _kegel, ...v3 } = buildExport(sample());
    const oldTraining = { level: 7, consecutiveOk: 2, planDayIndex: 12, planNumber: 2, lastAdvancedDate: '2026-11-14', repeatNextDay: false };
    const r = parseImport(JSON.stringify({ ...v3, training: oldTraining, schemaVersion: 3 }));
    if (!r.ok) throw new Error(r.error);
    expect(r.data.kegel).toEqual(defaultKegelData());
    expect(r.data.training).toMatchObject({ level: 7, planDayIndex: 12, planNumber: 2, track: 'general', durationPreset: 'standard', weekIndex: 6, dayIndex: 0 });
    expect(r.data.history.workouts).toHaveLength(2);
  });

  it('sanitizes a broken campus section instead of rejecting the file', () => {
    const b = buildExport(sample());
    // An old backup still carrying the removed smoking campus: that part is ignored.
    const r = parseImport(JSON.stringify({ ...b, campus: { smoking: { quitAt: 42, cigsPerDay: 'x' }, masturbation: { mode: 'quit' }, porn: { goalDays: 30 }, alcohol: { mode: 42 } } }));
    if (!r.ok) throw new Error(r.error);
    expect(r.data.campus).not.toHaveProperty('smoking');
    expect(r.data.campus).not.toHaveProperty('masturbation');
    expect(r.data.campus).not.toHaveProperty('porn');
    expect(r.data.campus.alcohol).toEqual(defaultAlcState());
    expect(r.data.campus.neck).toEqual(defaultBodyState());
    expect(r.data.campus.feet).toEqual(defaultBodyState());
  });

  it('builds a safe file name', () => {
    expect(exportFileName(new Date('2026-11-15T10:00:00Z'))).toMatch(/^[\p{L}\p{N}-]+-yedek-2026-11-15\.json$/u);
  });

  it('export → wipe → import cycle restores every store exactly', () => {
    setHistoryRepo(createMemoryRepo());
    setCampRepo(createMemoryCampRepo());
    const s = sample();
    restoreApp(s);
    const json = serializeExport(buildExport(snapshotApp()));
    wipeApp();
    expect(useHistoryStore.getState().workouts).toEqual([]);
    expect(useProfileStore.getState().profile.onboardingDone).toBe(false);
    expect(useTrainingStore.getState().training.level).toBe(1);
    expect(useCampusStore.getState().alcohol).toEqual(defaultAlcState());
    expect(useCampStore.getState().attempts).toEqual([]);
    expect(useCampEventsStore.getState().cigarettes).toEqual([]);
    expect(useKegelStore.getState().profile).toBeNull();
    const r = parseImport(json);
    if (!r.ok) throw new Error(r.error);
    restoreApp(r.data);
    expect(snapshotApp()).toEqual(s);
    expect(useSettingsStore.getState().settings.theme).toBe('dark');
    expect(useProgressStore.getState().achievements.first_workout).toBeDefined();
  });
});
