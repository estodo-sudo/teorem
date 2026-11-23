import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

import { languageForDevice, localeOf, SUPPORTED_LANGUAGES } from '@/i18n/languages';

/**
 * Every translation is complete and safe (user request 2026-11-22): the same keys, array lengths and
 * {{placeholders}} as Turkish; ids, numbers and other machine values untouched.
 */
const ROOT = join(__dirname, '..');
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8')) as unknown;
const OTHERS = SUPPORTED_LANGUAGES.filter((l) => l !== 'tr');

/** A value a translator must not change: ids, slugs, file names, URLs, colours, times. */
const MACHINE = /^(?:https?:\/\/\S+|[a-z0-9]+(?:[_\-./:][a-z0-9]+)+|[a-z]+[A-Z][A-Za-z0-9]*|#[0-9a-fA-F]{3,8}|\d{1,2}:\d{2})$/;
/** Fields whose values are always machine values (ids, icons, tones, kinds…). */
const MACHINE_KEYS = new Set(['id', 'icon', 'tone', 'kind', 'type', 'variant', 'image', 'key', 'slug', 'href', 'url', 'phone', 'color', 'sourceIds', 'evidenceLevel', 'better', 'lastVerified', 'number']);
const placeholders = (s: string) => (s.match(/{{?\s*\w+\s*}}?/g) ?? []).map((x) => x.replace(/\s/g, '')).sort();

function compare(tr: unknown, other: unknown, path: string, out: string[], key = '') {
  if (typeof tr === 'string') {
    if (typeof other !== 'string') return void out.push(`${path}: not a string`);
    if (((MACHINE_KEYS.has(key) && !/\s/.test(tr)) || MACHINE.test(tr)) && tr !== other) out.push(`${path}: machine value changed (${tr} → ${other})`);
    if (placeholders(tr).join() !== placeholders(other).join()) out.push(`${path}: placeholders differ`);
    if (tr.trim() && !other.trim()) out.push(`${path}: empty`);
    return;
  }
  if (Array.isArray(tr)) {
    if (!Array.isArray(other) || other.length !== tr.length) return void out.push(`${path}: array length differs`);
    tr.forEach((v, i) => compare(v, other[i], `${path}[${i}]`, out, key));
    return;
  }
  if (tr && typeof tr === 'object') {
    if (!other || typeof other !== 'object' || Array.isArray(other)) return void out.push(`${path}: not an object`);
    const o = other as Record<string, unknown>;
    for (const k of Object.keys(tr)) {
      if (k === '_meta') continue;
      if (!(k in o)) out.push(`${path}.${k}: missing`);
      else compare((tr as Record<string, unknown>)[k], o[k], `${path}.${k}`, out, k);
    }
    for (const k of Object.keys(o)) if (k !== '_meta' && !(k in (tr as object))) out.push(`${path}.${k}: extra`);
    return;
  }
  if (tr !== other) out.push(`${path}: value changed (${String(tr)} → ${String(other)})`);
}

function contentFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? contentFiles(p) : f.endsWith('.tr.json') ? [p] : [];
  });
}

describe.each(OTHERS)('%s translation', (lang) => {
  it('UI strings: every Turkish key, same placeholders', () => {
    const out: string[] = [];
    compare(read(join(ROOT, 'src/i18n/tr.json')), read(join(ROOT, `src/i18n/${lang}.json`)), lang, out);
    expect(out).toEqual([]);
  });

  it.each(contentFiles(join(ROOT, 'src/content')).map((p) => relative(join(ROOT, 'src/content'), p)))('content %s', (rel) => {
    const target = join(ROOT, 'src/content', rel.replace(/\.tr\.json$/, `.${lang}.json`));
    expect([rel, existsSync(target)]).toEqual([rel, true]);
    const out: string[] = [];
    compare(read(join(ROOT, 'src/content', rel)), read(target), rel, out);
    expect(out).toEqual([]);
  });
});

describe('language choice', () => {
  it('uses the phone language when the app has it, otherwise English', () => {
    expect(languageForDevice('tr')).toBe('tr');
    expect(languageForDevice('en')).toBe('en');
    expect(languageForDevice('ja')).toBe('en');
    expect(languageForDevice(undefined)).toBe('en');
    expect(localeOf('tr')).toBe('tr-TR');
    expect(localeOf('xx')).toBe('en-US');
  });
});
