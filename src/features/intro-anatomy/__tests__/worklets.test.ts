import fs from 'fs';
import path from 'path';

/**
 * On a phone the animation runs on the UI thread: a worklet may only call other worklets. A plain helper
 * called from a worklet crashes there ("Tried to synchronously call a Remote Function") while the web
 * preview, which runs everything on one thread, works fine. This scans the animation files: every
 * function a worklet calls, if it is defined in these files, must itself be a worklet.
 */
const dir = path.join(__dirname, '..');
// Line endings normalised: git may check files out with CRLF on Windows.
const files = ['paths.ts', 'timeline.ts', 'AnatomyScene.tsx'].map((f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n'));

/** name → body, for `function name(...) {...}` and `const name = (...) => ...` definitions. */
function definitions(src: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /(?:^|\n)\s*(?:export\s+)?(?:function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*(?::[^=]+)?=>)/g;
  const starts: { name: string; at: number }[] = [];
  for (let m = re.exec(src); m; m = re.exec(src)) starts.push({ name: (m[1] ?? m[2])!, at: m.index });
  starts.forEach((s, i) => out.set(s.name, src.slice(s.at, starts[i + 1]?.at ?? src.length)));
  return out;
}

describe('UI-thread safety of the animation', () => {
  // Each file is read on its own, so a definition never runs into the next file.
  const defs = new Map(files.flatMap((src) => [...definitions(src)]));
  // The body starts at the first "{" that ends a line (a return type like `{ a?: number }` stays inside
  // the signature line), or at the first "{" for a one-line arrow.
  const isWorklet = (body: string) => {
    const open = body.indexOf('{\n');
    if (open >= 0 && /^\s*'worklet';/.test(body.slice(open + 2))) return true;
    return /^[^{]*\{\s*'worklet';/.test(body);
  };

  it('every helper a worklet calls is a worklet', () => {
    const problems: string[] = [];
    for (const [name, body] of defs) {
      if (!isWorklet(body)) continue;
      for (const [other, otherBody] of defs) {
        if (other === name) continue;
        if (new RegExp(`\\b${other}\\s*\\(`).test(body) && !isWorklet(otherBody) && /^[a-z]/.test(other)) problems.push(`${name} → ${other}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('floorPath and its helpers are worklets', () => {
    for (const n of ['floorPath', 'floorControls', 'lerp', 'clamp01']) expect([n, isWorklet(defs.get(n) ?? '')]).toEqual([n, true]);
  });
});
