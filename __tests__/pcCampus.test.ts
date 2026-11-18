import { PC } from '@/features/campus/porn/content';
import {
  BPS_QUESTIONS,
  MIN_ACTIVITIES,
  bpsBand,
  bpsPositive,
  bpsScore,
  cleanDays,
  DAY_MS,
  defaultPcState,
  goalReached,
  longestCleanDays,
  MAX_VALUES,
  PC_GOALS,
  PC_GUIDE_STEP_IDS,
  pcPhase,
  recommendationKeys,
  riskMap,
  sanitizePcState,
  type PcState,
} from '@/features/campus/porn/logic';
import { useCampusStore } from '@/stores/campusStore';

const iso = (d: Date) => d.toISOString();
const base = (extra: Partial<PcState>): PcState => ({ ...defaultPcState(), setupDone: true, ...extra });

describe('özgür zihin · screening', () => {
  it('scores the Brief Pornography Screen (0–10, 4+ = possible problematic use)', () => {
    expect(PC.bps.questions).toHaveLength(BPS_QUESTIONS);
    expect(PC.bps.options.map((o) => o.score)).toEqual([0, 1, 2]);
    expect(bpsScore([1, 1, 0, 1, 0])).toBe(3);
    expect(bpsPositive([1, 1, 0, 1, 0])).toBe(false);
    expect(bpsPositive([2, 1, 0, 1, 0])).toBe(true);
    expect(bpsBand(3, PC.bps.bands)!.id).toBe('low');
    expect(bpsBand(4, PC.bps.bands)!.id).toBe('possible');
    expect(bpsBand(10, PC.bps.bands)!.id).toBe('possible');
  });
});

describe('özgür zihin · counter', () => {
  const now = new Date(2026, 10, 17, 12);
  const ago = (d: number) => new Date(now.getTime() - d * DAY_MS);

  it('counts from the last lapse and keeps the longest stretch', () => {
    const s = base({ startedAt: iso(ago(20)), firstStartedAt: iso(ago(20)), goalDays: 7, lapses: [{ at: iso(ago(12)), deviceId: null, feelingId: null, firstStepId: null }] });
    expect(cleanDays(s, now)).toBe(12);
    expect(goalReached(s, now)).toBe(true);
    expect(longestCleanDays(s, now)).toBe(12);
    s.lapses.push({ at: iso(ago(1.5)), deviceId: null, feelingId: null, firstStepId: null });
    expect(cleanDays(s, now)).toBe(1);
    expect(longestCleanDays(s, now)).toBe(10);
  });
});

describe('özgür zihin · risk map', () => {
  it('finds the most common device, time, feeling and first step and maps them to recommendations', () => {
    const at = (h: number) => iso(new Date(2026, 10, 10, h));
    const lapses = [
      { at: at(23), deviceId: 'phone', feelingId: 'lonely', firstStepId: 'social' },
      { at: at(0), deviceId: 'phone', feelingId: 'bored', firstStepId: 'social' },
      { at: at(15), deviceId: 'computer', feelingId: 'lonely', firstStepId: null },
    ];
    const m = riskMap(lapses);
    expect(m).toEqual({
      total: 3,
      device: { id: 'phone', count: 2 },
      time: { id: 'night', count: 2 },
      feeling: { id: 'lonely', count: 2 },
      firstStep: { id: 'social', count: 2 },
    });
    expect(recommendationKeys(m)).toEqual(['first:social', 'feeling:lonely', 'device:phone', 'time:night']);
    expect(riskMap([])).toEqual({ total: 0, device: null, time: null, feeling: null, firstStep: null });
  });

  it('has a recommendation for every possible key', () => {
    const r = PC.analysis.recommendations;
    for (const d of PC.analysis.devices) expect(r[`device:${d.id}`]).toBeTruthy();
    for (const f of PC.analysis.feelings) expect(r[`feeling:${f.id}`]).toBeTruthy();
    for (const f of PC.analysis.firstSteps) expect(r[`first:${f.id}`]).toBeTruthy();
    for (const p of ['morning', 'afternoon', 'evening', 'night']) expect(r[`time:${p}`]).toBeTruthy();
  });
});

describe('özgür zihin · activities', () => {
  it('offers dozens of everyday activities in categories', () => {
    expect(PC.activities.length).toBeGreaterThanOrEqual(30);
    expect(new Set(PC.activities.map((a) => a.id)).size).toBe(PC.activities.length);
    const cats = new Set(PC.activityCategories.map((c) => c.id));
    for (const a of PC.activities) expect(cats.has(a.category)).toBe(true);
    expect(MIN_ACTIVITIES).toBe(3);
  });

  it('reads older backups that stored urges as plain times', () => {
    expect(sanitizePcState({ urgesBeaten: ['2026-11-08T22:00:00.000Z', 'x'] }).urges).toEqual([{ at: '2026-11-08T22:00:00.000Z', activityId: null }]);
  });

  it('describes the harms honestly', () => {
    expect(PC.harms.items.length).toBeGreaterThanOrEqual(5);
    expect(new Set(PC.harms.items.map((x) => x.id)).size).toBe(PC.harms.items.length);
  });
});

describe('özgür zihin · content', () => {
  it('is complete and consistent with the code', () => {
    expect(PC.steps.map((x) => x.id)).toEqual([...PC_GUIDE_STEP_IDS]);
    expect(PC.goals).toEqual([...PC_GOALS]);
    expect(PC.stop.map((x) => x.letter).join('')).toBe('DNGS');
    for (const g of [PC.values, PC.env, PC.facts, PC.help, PC.steps, PC.analysis.devices, PC.analysis.feelings, PC.analysis.firstSteps]) {
      expect(new Set(g.map((x) => x.id)).size).toBe(g.length);
    }
    expect(PC.title).toBe('Özgür Zihin Kampüsü (Porno Bağımlılığı)');
    for (const v of PC.values) expect(v.text.trim()).not.toBe('');
    expect(PC.reviewed).toBe(false);
    PC.sources.forEach((s) => expect(s.url).toMatch(/^https:\/\//));
    const all = JSON.stringify(PC).toLocaleLowerCase('tr-TR');
    expect(all).not.toMatch(/garanti|kesin çözüm|tedavi eder|günah|iğrenç|yeşilay/);
  });

  it('sanitizes broken imported data', () => {
    expect(sanitizePcState(undefined)).toEqual(defaultPcState());
    const s = sanitizePcState({ setupDone: true, startedAt: 'x', goalDays: 45, bps: [3, 1, 1, 1, 1], valueIds: ['a', 'b', 'c', 'd'], lapses: [{ at: 5 }, { at: '2026-11-01T22:00:00.000Z', deviceId: 3 }] });
    expect(s.setupDone).toBe(false);
    expect(s.goalDays).toBe(30);
    expect(s.bps).toBeNull();
    expect(s.valueIds).toHaveLength(MAX_VALUES);
    expect(s.lapses).toEqual([{ at: '2026-11-01T22:00:00.000Z', deviceId: null, feelingId: null, firstStepId: null }]);
    const good = base({ startedAt: '2026-11-01T09:00:00.000Z', firstStartedAt: '2026-11-01T09:00:00.000Z', goalDays: 90, bps: [0, 1, 2, 1, 0], valuesConflict: true, valueIds: ['health'] });
    expect(sanitizePcState(JSON.parse(JSON.stringify(good)))).toEqual(good);
  });
});

describe('özgür zihin · store', () => {
  beforeEach(() => useCampusStore.getState().reset());

  it('enrols, logs lapses and urges, keeps the start on edits', () => {
    useCampusStore.getState().savePcSetup({ goalDays: 30, valueIds: ['health', 'growth'], activityIds: ['walk', 'read', 'call-friend'], bps: [1, 1, 1, 1, 1], valuesConflict: false, envDoneIds: ['filter'], guideReadIds: [...PC_GUIDE_STEP_IDS] });
    let s = useCampusStore.getState().porn;
    expect(pcPhase(s)).toBe('active');
    const start = s.startedAt;
    useCampusStore.getState().logPcLapse({ deviceId: 'phone', feelingId: 'stress', firstStepId: 'search', at: new Date('2026-11-17T23:00:00.000Z') });
    useCampusStore.getState().logPcUrge('walk', new Date('2026-11-17T21:00:00.000Z'));
    useCampusStore.getState().togglePcEnv('safesearch');
    useCampusStore.getState().savePcSetup({ goalDays: 90, valueIds: ['health'], activityIds: ['walk', 'read', 'cook'] });
    s = useCampusStore.getState().porn;
    expect(s.startedAt).toBe(start);
    expect(s.goalDays).toBe(90);
    expect(s.bps).toEqual([1, 1, 1, 1, 1]);
    expect(s.lapses).toEqual([{ at: '2026-11-17T23:00:00.000Z', deviceId: 'phone', feelingId: 'stress', firstStepId: 'search' }]);
    expect(s.urges).toEqual([{ at: '2026-11-17T21:00:00.000Z', activityId: 'walk' }]);
    expect(s.activityIds).toEqual(['walk', 'read', 'cook']);
    expect(s.envDoneIds).toEqual(['filter', 'safesearch']);
    useCampusStore.getState().resetPc();
    expect(useCampusStore.getState().porn).toEqual(defaultPcState());
  });
});
