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
  it('Tur 2 is the second half of the day (2026-11-25); it is not a separate session in totals; the summary adds both rounds', () => {
    const day = '2026-11-23';
    const list = [
      { date: day, completed: true },
      { date: day, completed: true, round: 2 as const },
    ];
    expect(list.map(countsAsSession)).toEqual([true, false]);
    expect(dailyProgress(list, day)).toEqual({ done: 2, target: 2, reached: true });
    expect(read('src/features/training/service.ts')).toMatch(/session\.round === 2 \? \{ round: 2 as const \}/);
    expect(read('src/features/data/db.ts')).toMatch(/'deload', 'round', 'advancedPlan'\]/);
    expect(read('app/workout/[sessionId].tsx')).toMatch(/\{ id: first, second: w\.id \}/);
    expect(read('app/workout/feedback.tsx')).toMatch(/workout\.actualSec \+ \(round2\?\.actualSec \?\? 0\)/);
  });
  it('an unfinished micro set is not called "tamam"', () => {
    expect(read('app/workout/feedback.tsx')).toMatch(/const title = !completed \? tr\('feedback\.partialShort'\)/);
  });
  it('rest lock: the countdown numbers show only on the Günüm "Başla" button (2026-11-25)', () => {
    const card = read('src/features/today/WorkoutCard.tsx');
    expect(card).toMatch(/<Button label=\{lock\.left\}/);
    expect(card).not.toMatch(/kegel\.lock\.note|kegel\.lock\.button/);
    expect(read('app/workout/next.tsx')).not.toMatch(/lock\.left/);
    expect(read('src/features/today/DailyGoalCard.tsx')).not.toMatch(/lock\.left/);
    // after the extra session the rest starts: straight to the summary, no Tur 2 offer
    expect(read('app/workout/[sessionId].tsx')).toMatch(/!result\.endedEarly && !restNow\) return router\.replace\(\{ pathname: '\/workout\/next'/);
  });
});

describe('black screen only with "Gizli mod", never in the tutorial (2026-11-25)', () => {
  it('a double tap blacks the screen only with Gizli mod on, otherwise it pauses like a tap; the black screen shows a clear way out', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'features', 'training', 'player', 'WorkoutPlayer.tsx'), 'utf8') as string;
    expect(src).toMatch(/const blackAllowed = !minimal && settings\.discreetPlayer;/);
    expect(src).toMatch(/onDoubleTap: blackAllowed/);
    expect(src).toMatch(/: toggle,/);
    expect(src).toMatch(/\{black && blackAllowed \? \(/);
    expect(src).toMatch(/<BlackNotice key=\{notice\} \/>/);
    expect(src).toMatch(/tr\('player\.blackExit'\)/);
    expect(src).toMatch(/tr\(minimal \? 'player\.gestureHintTrial' : 'player\.gestureHint'\)/);
  });
});

describe('yavaş sıkma mini lesson before the first Tur 2 (2026-11-25)', () => {
  it('opens by itself after the first Tur 1; learn → practise in the player → check → Tur 2, or later', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rd = (p: string) => require('fs').readFileSync(require('path').join(__dirname, '..', p), 'utf8') as string;
    // since 2026-11-26 through lessonRoute, which sends the first-ever Tur 2 to round2-intro (moves180.test.ts)
    expect(rd('app/workout/[sessionId].tsx')).toMatch(/const lesson = !session\.isMicro && !result\.endedEarly && !restNow \? lessonRoute\(useTrainingStore\.getState\(\)\.training, w\.id\) : null;\s*if \(lesson\) return router\.replace\(lesson\);/);
    const lesson = rd('app/workout/round2-intro.tsx');
    expect(lesson).toMatch(/const ORDER: Step\[\] = \['learn', 'practice', 'check'\];/);
    expect(lesson).toMatch(/<WorkoutPlayer key=\{runKey\} session=\{practice\} minimal forceLabels onDone=\{\(\) => setStep\('check'\)\} \/>/);
    expect(lesson).toMatch(/update\(\{ round2IntroDone: true \}\)/);
    expect(lesson).toMatch(/tr\('round\.intro\.later'\)/);
  });
});
