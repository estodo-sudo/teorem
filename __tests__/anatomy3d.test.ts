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
    expect(screen).toMatch(/<Anatomy3DStage time=\{time\} playing=\{playing\} \/>/);
    const stage = read('src/features/intro-anatomy/Anatomy3DStage.tsx');
    expect(stage).toMatch(/p\.muted = true/);
    expect(stage).toMatch(/CONTENT_LANGUAGE === 'en'/);
  });
});
