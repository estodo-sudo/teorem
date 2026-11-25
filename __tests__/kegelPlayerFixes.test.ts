import fs from 'fs';
import path from 'path';

import { generateSession } from '@/features/training/generateSession';
import { createPlayer, currentPhase, skipExercise, skipPhase, start } from '@/features/training/player/machine';
import { countsAsSession, dailyProgress } from '@/features/training/summary';

const read = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

describe('Kegel player review (2026-11-23)', () => {
  it('skip forward: a rest or the countdown only ends the wait; the coming exercise is not skipped', () => {
    const s = generateSession({ level: 1, seed: 'x' });
    let st = start(createPlayer(s.phases), 0).state;
    expect(currentPhase(st)!.kind).toBe('countdown');
    // Countdown → the first exercise starts at once.
    st = skipPhase(st, 500).state;
    expect([currentPhase(st)!.kind, currentPhase(st)!.exerciseIndex]).toEqual(['contract', 0]);
    // Skipping an exercise lands on the rest before the next one.
    st = skipExercise(st, 1000).state;
    expect([currentPhase(st)!.kind, currentPhase(st)!.exerciseIndex]).toEqual(['transition', 1]);
    // Skipping the rest starts exercise 1 — it is not jumped over and not marked skipped.
    st = skipPhase(st, 1500).state;
    expect([currentPhase(st)!.kind, currentPhase(st)!.exerciseIndex]).toEqual(['contract', 1]);
    expect(st.skippedExercises).toEqual([0]);
  });
  it('the player uses that: rest / countdown → skipPhase, an exercise → skip (asks once)', () => {
    const src = read('src/features/training/player/WorkoutPlayer.tsx');
    expect(src).toMatch(/ph\.kind === 'transition' \|\| ph\.kind === 'countdown'\)\) return player\.skipPhase\(\)/);
    expect(src).not.toMatch(/player\.resume\(\), player\.skip\(\)/);
  });
  it('the finish, skip and help dialogs pause the session while open and resume it after', () => {
    const src = read('src/features/training/player/WorkoutPlayer.tsx');
    expect(src).toMatch(/const askFinish = useCallback\(\(\) => \{\s*if \(minimal\) return;\s*holdForDialog\(\);/);
    expect(src).toMatch(/onPress=\{openHelp\}/);
    expect(src).toMatch(/onDismiss=\{closeHelp\}/);
    expect(src).toMatch(/onDismiss=\{\(\) => closeFinish\(false\)\}/);
    // Only the user's own pauses count as a difficulty signal.
    expect(src).not.toMatch(/state\.status === 'paused'\) \{\s*pausesRef\.current \+= 1/);
  });
  it('Tur 2 continues Tur 1: it does not count again for the daily target; the summary adds both rounds', () => {
    const day = '2026-11-23';
    const list = [
      { date: day, completed: true },
      { date: day, completed: true, round: 2 as const },
    ];
    expect(list.map(countsAsSession)).toEqual([true, false]);
    expect(dailyProgress(list, day, 2)).toEqual({ done: 1, target: 2, reached: false });
    expect(read('src/features/training/service.ts')).toMatch(/session\.round === 2 \? \{ round: 2 as const \}/);
    expect(read('src/features/data/db.ts')).toMatch(/'deload', 'round', 'advancedPlan'\]/);
    expect(read('app/workout/[sessionId].tsx')).toMatch(/\{ id: first, second: w\.id \}/);
    expect(read('app/workout/feedback.tsx')).toMatch(/workout\.actualSec \+ \(round2\?\.actualSec \?\? 0\)/);
  });
  it('an unfinished micro set is not called "tamam"', () => {
    expect(read('app/workout/feedback.tsx')).toMatch(/const title = !completed \? tr\('feedback\.partialShort'\)/);
  });
  it('rest lock: the button shows only the countdown, no note above it', () => {
    const card = read('src/features/today/WorkoutCard.tsx');
    expect(card).toMatch(/<Button label=\{lock\.left\}/);
    expect(card).not.toMatch(/kegel\.lock\.note|kegel\.lock\.button/);
    expect(read('app/workout/next.tsx')).toMatch(/<Button label=\{lock\.left\}/);
  });
});
