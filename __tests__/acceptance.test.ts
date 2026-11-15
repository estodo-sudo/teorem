/**
 * Static checks for v1 acceptance criteria (privacy, offline, i18n, originality).
 */
import fs from 'fs';
import path from 'path';

import tr from '@/i18n/tr.json';

const ROOT = path.join(__dirname, '..');

function walk(dir: string, exts = ['.ts', '.tsx', '.json']): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, exts));
    else if (exts.includes(path.extname(e.name))) out.push(p);
  }
  return out;
}

const codeFiles = [...walk(path.join(ROOT, 'app')), ...walk(path.join(ROOT, 'src'))];
const read = (f: string) => fs.readFileSync(f, 'utf8');
const rel = (f: string) => path.relative(ROOT, f);

describe('privacy & offline', () => {
  const pkg = JSON.parse(read(path.join(ROOT, 'package.json')));
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });

  it('has no analytics / ads / tracking / remote-config SDKs', () => {
    const banned = /firebase|analytics|amplitude|mixpanel|segment|appsflyer|adjust|branch|facebook|fbsdk|admob|google-mobile-ads|sentry|bugsnag|datadog|onesignal|revenuecat|purchases|posthog|braze|clevertap|expo-updates/i;
    expect(deps.filter((d) => banned.test(d))).toEqual([]);
  });

  it('makes network calls only from allow-listed modules', () => {
    // iap.ts → platform store; fileTransfer.ts → reads a local picked file on web.
    const allowed = ['src/features/purchases/iap.ts', 'src/features/data/fileTransfer.ts'];
    const offenders = codeFiles.filter((f) => /\bfetch\(|XMLHttpRequest|new WebSocket|axios/.test(read(f)) && !allowed.includes(rel(f)));
    expect(offenders.map(rel)).toEqual([]);
  });

  it('uses only local notifications (no push token registration)', () => {
    const offenders = codeFiles.filter((f) => /getExpoPushTokenAsync|getDevicePushTokenAsync/.test(read(f)));
    expect(offenders).toEqual([]);
  });
});

describe('i18n', () => {
  const lookup = (key: string) => key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], tr);

  it('every literal translation key used in code exists in tr.json', () => {
    const missing: string[] = [];
    for (const f of codeFiles.filter((x) => x.endsWith('.tsx') || x.endsWith('.ts'))) {
      const src = read(f);
      for (const m of src.matchAll(/\b(?:tr|t|i18n\.t)\(\s*'([a-zA-Z0-9_.]+)'/g)) {
        const key = m[1]!;
        if (key.endsWith('.')) continue;
        if (lookup(key) === undefined && lookup(`${key}_one`) === undefined) missing.push(`${rel(f)}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('the app name is only defined in src/config/app.ts', () => {
    const offenders = codeFiles.filter((f) => read(f).includes('[UYGULAMA_ADI]') && rel(f) !== 'src/config/app.ts');
    expect(offenders.map(rel)).toEqual([]);
  });
});

describe('originality', () => {
  it('never mentions the competitor anywhere in app code or content', () => {
    const offenders = codeFiles.filter((f) => /dr\.?\s*kegel|appercut/i.test(read(f)));
    expect(offenders.map(rel)).toEqual([]);
  });
});
