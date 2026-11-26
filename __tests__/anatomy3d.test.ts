import { ANIMATED_ART_NAMES, artPhase } from '@/components/artLoop';
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

describe('3D pelvic floor pictures (2026-11-25)', () => {
  it('the tutorial shows the Blender pelvis on "Pelvik taban kası nedir?"', () => {
    expect(read('app/tutorial.tsx')).toMatch(/what: \{ art: <PelvicFloor3D \/>/);
    expect(fs.statSync(path.join(root, 'assets/art/pelvic-floor.webp')).size).toBeLessThan(120_000);
  });

  it('"Pelvik taban kasın nerede?" plays the 3D video in both languages, small enough to bundle', () => {
    for (const l of ['tr', 'en']) expect([l, fs.statSync(path.join(root, `assets/video/anatomy-${l}.mp4`)).size < 2_000_000]).toEqual([l, true]);
    const screen = read('src/features/intro-anatomy/IntroAnatomyScreen.tsx');
    // full screen: the video sits right behind the controls, not inside the tap area
    expect(screen.indexOf('<Anatomy3DStage time={time} playing={playing} />')).toBeGreaterThan(screen.indexOf('<AnatomyBackground />'));
    expect(screen.indexOf('<Anatomy3DStage')).toBeLessThan(screen.indexOf('style={styles.track}'));
    expect(read('src/features/intro-anatomy/Anatomy3DStage.tsx')).toMatch(/contentFit="cover"/);
    const stage = read('src/features/intro-anatomy/Anatomy3DStage.tsx');
    expect(stage).toMatch(/p\.muted = true/);
    expect(stage).toMatch(/CONTENT_LANGUAGE === 'en'/);
  });
});

describe('animated sign-up and tutorial art (2026-11-25)', () => {
  it('loops are seamless and the screens use them', () => {
    expect(ANIMATED_ART_NAMES).toEqual(['welcome', 'goals', 'plan', 'consent', 'find', 'technique', 'smokefree', 'focus', 'alcoholfree']);
    expect(artPhase('welcome', 4000)).toBeCloseTo(0);
    expect(artPhase('goals', 4500)).toBeCloseTo(0.5);
    const onb = read('app/onboarding/index.tsx');
    for (const a of ['welcome', 'goals', 'plan']) expect(onb).toMatch(new RegExp(`art="${a}"`));
    expect(onb).toMatch(/<Animated\.View key=\{step\} entering=\{FadeInRight/);
    expect(read('app/consent.tsx')).toMatch(/<AnimatedArt name="consent"/);
    const tut = read('app/tutorial.tsx');
    expect(tut).toMatch(/<AnimatedArt name="find"/);
    expect(tut).toMatch(/<AnimatedArt name="technique"/);
  });
});

describe('in-app aesthetic pass (2026-11-25)', () => {
  it('the training sphere has waves, an orbit, a bloom and a glowing ring head, all off with "reduce motion"', () => {
    const src = read('src/features/training/player/MuscleSphere.tsx');
    expect(src).toMatch(/const ORBIT_DOTS = 12;/);
    expect(src).toMatch(/useFrameCallback/);
    expect(src).toMatch(/orbitClock\.setActive\(!reduce && !paused && !finished\)/);
    expect(src.indexOf('{!reduce ? (')).toBeGreaterThan(-1);
    expect(src.indexOf('{!reduce ? (')).toBeLessThan(src.indexOf('Bloom: a wide'));
    expect(src).toMatch(/animatedProps=\{headProps\}/);
  });

  it('finishing a session or a round plays a one-off burst', () => {
    expect(read('app/workout/feedback.tsx')).toMatch(/<CelebrationBurst size=\{size\} play=\{completed\}/);
    expect(read('app/workout/next.tsx')).toMatch(/<CelebrationBurst/);
    expect(read('src/components/CelebrationBurst.tsx')).toMatch(/if \(reduce \|\| !play\) return null;/);
  });
});

describe('Kasık Fitness visuals (2026-11-25)', () => {
  it('every Kasık Fitness move plays its own 3D clip kept at the move clock (redo 2026-11-25)', () => {
    const poses = JSON.parse(read('src/features/fitness/poses.json')) as Record<string, unknown>;
    const video = read('src/features/fitness/FitnessVideo.tsx');
    for (const id of Object.keys(poses).filter((k) => !k.startsWith('_'))) {
      const f = `fit-${id.replace(/_/g, '-')}.mp4`;
      expect([f, fs.statSync(path.join(root, 'assets/video', f)).size < 600_000]).toEqual([f, true]);
      expect(video).toContain(`${id}: require('../../../assets/video/${f}')`);
    }
    // alternating moves loop two reps; side 2 of a one-side-then-the-other move is mirrored
    expect(video).toMatch(/cycleMs\(move\) \* \(move\.alternate \? 2 : 1\)/);
    expect(video).toMatch(/clip\.mirrored \? styles\.mirror : null/);
    const screen = read('app/fitness/[routineId].tsx');
    expect(screen).toMatch(/FITNESS_VIDEO\.has\(move\)/);
    expect(screen).toMatch(/elapsedMs=\{elapsed\} workMs=\{durationMs\}/);
    expect(screen).toMatch(/<FitnessPreview move=\{move\} width=\{260\} paused=\{paused\} \/>/);
    expect(screen).toMatch(/word=\{m\.word\} pulse=/);
    const fig = read('src/features/fitness/FitnessFigure.tsx');
    expect(fig).toMatch(/const ARROW: Partial<Record<TempoWord, 'up' \| 'down' \| 'in' \| 'out'>>/);
    expect(fig).toMatch(/<G opacity=\{0\.7 \+ 0\.6 \* pulse\}>\{glows\}<\/G>/);
  });
});

describe('camp polish (round 6, 2026-11-25)', () => {
  it('camp heroes breathe, rows and tiles enter in turn, and every camp has its own looping drawing', () => {
    const ui = read('src/features/camps/core/panelUi.tsx');
    expect(ui).toMatch(/<HeroAmbient glow=/);
    expect(ui).toMatch(/entering=\{FadeInDown\.delay\(80 \+ i \* 70\)/);
    expect(ui).toMatch(/entering=\{FadeInDown\.delay\(120 \+ i \* 45\)/);
    expect(read('src/features/campus/shared/ui.tsx')).toMatch(/<HeroAmbient glow="#FFFFFF" \/>/);
    expect(read('src/components/HeroAmbient.tsx')).toMatch(/if \(reduce \|\| !live\)/);
    expect(ANIMATED_ART_NAMES).toEqual(expect.arrayContaining(['smokefree', 'focus', 'alcoholfree']));
    const list = read('app/camps/index.tsx');
    expect(list).toMatch(/smoking: \{ art: 'smokefree'/);
    expect(list).toMatch(/odak: \{ art: 'focus'/);
    expect(read('app/campus/alcohol/setup.tsx')).toMatch(/<AnimatedArt name="alcoholfree"/);
  });
});

describe('battery (round 8, 2026-11-25)', () => {
  it('decorative loops and display clocks stop when nobody can see them; players keep their own time', () => {
    expect(read('src/lib/useLive.ts')).toMatch(/return active && focused;/);
    expect(read('src/components/AnimatedArt.tsx')).toMatch(/if \(reduce \|\| !live\) return;/);
    expect(read('src/features/fitness/FitnessFigure.tsx')).toMatch(/if \(paused \|\| !live\) return;/);
    for (const f of ['app/fitness/[routineId].tsx', 'src/features/bodyweight/ui.tsx']) expect([f, /if \(paused \|\| !active\) return;/.test(read(f))]).toEqual([f, true]);
    expect(read('src/features/training/ExerciseDemo.tsx')).toMatch(/if \(reduce \|\| !live\)/);
    expect(read('src/features/training/RoadmapViews.tsx')).toMatch(/if \(!live\) \{/);
    for (const f of ['src/features/content/story/StoryViewer.tsx', 'src/features/content/storyPlayer/StoryPlayer.tsx']) expect([f, /const paused = heldPaused \|\| !appActive;/.test(read(f))]).toEqual([f, true]);
    expect(read('src/lib/useNow.ts')).toMatch(/if \(!active\) return;/);
  });
});

describe('Kasık Fitness extras (2026-11-26)', () => {
  it('a CC0 house beat plays only while the routine runs; a note under every clip says the animations are in development', () => {
    expect(fs.statSync(path.join(root, 'assets/sounds/fitness/music.m4a')).size).toBeLessThan(1_200_000);
    expect(read('assets/sounds/fitness/CREDITS.md')).toMatch(/CC0/);
    const music = read('src/features/fitness/music.ts');
    expect(music).toMatch(/p\.loop = true/);
    expect(music).toMatch(/if \(playing\) p\.play\(\);\s*else p\.pause\(\);/);
    expect(read('app/fitness/[routineId].tsx')).toMatch(/useWorkoutMusic\(state\.status === 'running'\)/);
    const video = read('src/features/fitness/FitnessVideo.tsx');
    expect(video).toMatch(/<DevNote \/>/);
    expect(read('src/i18n/tr.json')).toMatch(/"animDev": "Animasyonlar geliştirme aşamasındadır\."/);
  });

  it('onboarding shows Kadın and Erkek side by side, the word and its sign only', () => {
    const ob = read('app/onboarding/index.tsx');
    expect(ob).toMatch(/<SexTile key=\{v\} sex=\{v\} label=\{tr\(`onboarding\.sex\.\$\{v\}`\)\}/);
    expect(ob).not.toMatch(/onboarding\.sex\.\$\{v\}Hint/);
  });
});
