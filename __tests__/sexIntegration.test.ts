import fs from 'fs';
import path from 'path';

import en from '@/i18n/en.json';
import i18n from '@/i18n';
import tr from '@/i18n/tr.json';
import { overlay, sexOf } from '@/i18n/sex';
import { CAMP_SKILLS } from '@/features/camps/smoking/content';
import { ALC } from '@/features/campus/alcohol/content';
import { auditBand } from '@/features/campus/alcohol/logic';
import { CHALLENGES, STORIES } from '@/features/content/data';
import { sanitizeProfile } from '@/features/data/sanitize';
import { SCREENING } from '@/features/training/kegelProfile';
import { SELF_RATING } from '@/features/training/strengthV2';
import { KEGEL_TRACKS } from '@/features/training/tracks';
import { useProfileStore } from '@/stores/profileStore';
import type { Sex } from '@/types';

const as = (sex: Sex | null) => useProfileStore.getState().update({ sex });
const read = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
/** Words that only fit the male body; none may reach a woman's screen through the switched content. */
/** Shown text only: ids and source ids are internal. */
const shown = (o: unknown): string =>
  typeof o === 'string' ? o : typeof o === 'object' && o !== null ? Object.entries(o).filter(([k]) => k !== 'id' && k !== 'sourceIds').map(([, v]) => shown(v)).join(' | ') : '';
const MALE_ONLY = /penis|testis|prostat|sertleş|ereksiyon|boşalm|testosteron|erection|ejaculat|testicle|prostate/i;

afterEach(() => as(null));

describe('women and men (2026-11-25)', () => {
  it('overlay merges objects, arrays by id, arrays by position, and keeps base items for null', () => {
    const base = { a: 1, list: [{ id: 'x', t: 'x', n: 1 }, { id: 'y', t: 'y', n: 2 }], pos: ['p', 'q', 'r'] };
    const out = overlay(base, { a: 2, list: [{ id: 'y', t: 'Y' }], pos: [null, 'Q'] });
    expect(overlay({ s: ['a', 'b'] }, { s: { $replace: ['c'] } })).toEqual({ s: ['c'] });
    expect(overlay({ s: ['a', 'b', 'c'] }, { s: [null, 'B'] })).toEqual({ s: ['a', 'B', 'c'] });
    expect(out).toEqual({ a: 2, list: [{ id: 'x', t: 'x', n: 1 }, { id: 'y', t: 'Y', n: 2 }], pos: ['p', 'Q', 'r'] });
    expect(base.list[1]!.t).toBe('y');
  });

  it('older installs without an answer read as male; the profile keeps only valid answers', () => {
    expect(sexOf(null)).toBe('male');
    expect(sexOf(undefined)).toBe('male');
    expect(sanitizeProfile({ sex: 'female' }).sex).toBe('female');
    expect(sanitizeProfile({ sex: 'other' }).sex).toBeNull();
    expect(sanitizeProfile({}).sex).toBeNull();
  });

  it('tracks keep their ids and engine; only the words change', () => {
    as('male');
    const male = KEGEL_TRACKS.map((t) => ({ ...t }));
    as('female');
    const female = KEGEL_TRACKS.map((t) => ({ ...t }));
    expect(female.map((t) => t.id)).toEqual(male.map((t) => t.id));
    expect(female.find((t) => t.id === 'surgery')!.title).toBe('Doğum Sonrası Toparlanma');
    expect(male.find((t) => t.id === 'surgery')!.title).toMatch(/Prostat/);
    expect(female.find((t) => t.id === 'surgery')!.requiresClearance).toBe(true);
    expect(shown(female)).not.toMatch(MALE_ONLY);
    expect(female.find((t) => t.id === 'erection')!.sourceIds).toEqual(['nice_ng210']);
    expect(female.flatMap((t) => t.sourceIds)).not.toContain('mkuh_nhs');
  });

  it('screening and self-rating: same questions and ids, female wording', () => {
    as('male');
    const mIds = SCREENING.questions.map((q) => q.id);
    expect(SCREENING.questions[0]!.text).toMatch(/testis/);
    as('female');
    expect(SCREENING.questions.map((q) => q.id)).toEqual(mIds);
    expect(SCREENING.questions[0]!.text).toMatch(/vajina/);
    expect(SCREENING.questions.find((q) => q.id === 'ejaculation_pain')!.pain).toBe(true);
    expect(shown(SCREENING.questions)).not.toMatch(MALE_ONLY);
    expect(shown(SCREENING.result)).not.toMatch(MALE_ONLY);
    expect(SELF_RATING.tracks.erection.map((q) => q.id)).toEqual(['hardness', 'maintain', 'confidence']);
    expect(shown(SELF_RATING)).not.toMatch(MALE_ONLY);
  });

  it('alcohol: the AUDIT-C cut-off is 3 for women and 4 for men', () => {
    as('male');
    expect(auditBand(3, ALC.audit.bands)!.id).toBe('low');
    expect(auditBand(4, ALC.audit.bands)!.id).toBe('risky');
    as('female');
    expect(auditBand(2, ALC.audit.bands)!.id).toBe('low');
    expect(auditBand(3, ALC.audit.bands)!.id).toBe('risky');
    expect(auditBand(8, ALC.audit.bands)!.id).toBe('high');
    expect(ALC.info.audit.text).toMatch(/Kadınlarda 3/);
    expect(JSON.stringify(ALC)).not.toMatch(/Erkeklerde|sertleş|testosteron/);
  });

  it('nutrition reasons and the smoking lesson have female versions', () => {
    as('female');
    expect(JSON.stringify(CHALLENGES)).not.toMatch(/ereksiyon/);
    expect(CHALLENGES.length).toBeGreaterThan(10);
    expect(shown(CAMP_SKILLS.lessons.find((l) => l.id === 'sexual-health'))).not.toMatch(MALE_ONLY);
    as('male');
    expect(JSON.stringify(CHALLENGES)).toMatch(/ereksiyon/);
  });

  it('every female text key exists in both languages and i18next picks it by context', () => {
    const keys = (o: unknown, p = ''): string[] =>
      typeof o === 'object' && o !== null ? Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k)) : [p];
    const fTr = keys(tr).filter((k) => k.endsWith('_female'));
    expect(fTr.length).toBeGreaterThanOrEqual(8);
    expect(keys(en).filter((k) => k.endsWith('_female')).sort()).toEqual(fTr.sort());
    void i18n.changeLanguage('tr');
    expect(i18n.t('goal.postSurgery', { context: 'female' })).toBe('Doğum sonrası toparlanma');
    expect(i18n.t('goal.postSurgery')).toBe('Ameliyat sonrası toparlanma');
    expect(i18n.t('goal.general', { context: 'female' })).toBe(i18n.t('goal.general'));
  });

  it('onboarding asks who the programme is for and saves it; settings can change it', () => {
    const onb = read('app/onboarding/index.tsx');
    expect(onb).toMatch(/const STEPS = 8;/);
    expect(onb).toMatch(/update\(\{ sex, goals/);
    expect(onb).toMatch(/canContinue = \[true, !!sex,/);
    expect(read('app/settings/training.tsx')).toMatch(/update\(\{ sex: v \}\)/);
    expect(read('app/kegel/tracks.tsx')).toMatch(/tr\('kegel\.tracks\.surgeryText', ctx\)/);
  });
});

describe('women\'s stories and glossary (round 2, 2026-11-25)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const data = require('@/features/content/data') as typeof import('@/features/content/data');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { appImage } = require('@/content/images') as typeof import('@/content/images');
  const text = (o: unknown): string =>
    typeof o === 'string' ? o : typeof o === 'object' && o !== null ? Object.entries(o).filter(([k]) => !['id', 'image', 'cover', 'url', 'sources', 'route', 'after'].includes(k)).map(([, v]) => text(v)).join(' | ') : '';
  // Body-specific male wording (a plain comparison such as "men 95 %, women 65 %" may stay).
  const MALE = /penis|testis|prostat|sertleş|ereksiyon|erken boşal|testosteron/i;

  it('men see every original item; women see the same number with male-only ones swapped for women\'s', () => {
    as('male');
    const mS = data.STORIES.map((s) => s.id);
    const mG = data.GLOSSARY.map((g) => g.id);
    expect(mS).toContain('erection-blood');
    expect(mS).not.toContain('postpartum-floor');
    as('female');
    const fS = data.STORIES.map((s) => s.id);
    const fG = data.GLOSSARY.map((g) => g.id);
    expect(fS).toHaveLength(mS.length);
    expect(fG).toHaveLength(mG.length);
    expect(fS).not.toContain('erection-blood');
    expect(fS).toContain('postpartum-floor');
    for (const id of ['premature-ejaculation', 'erectile-dysfunction', 'morning-erection', 'after-prostate-surgery', 'lasting-longer']) expect(fG).not.toContain(id);
    for (const id of ['postpartum-pelvic-floor', 'pregnancy-pelvic-floor', 'menopause-pelvic-floor', 'prolapse', 'orgasm-difficulty']) expect(fG).toContain(id);
  });

  it('no male-only wording reaches a woman, and none of her photos show a man', () => {
    as('female');
    for (const s of data.STORIES) {
      expect([s.id, MALE.test(text(s))]).toEqual([s.id, false]);
      const cover = appImage(data.storyCoverId(s));
      expect([s.id, !!cover && /\badam\b/.test(cover.alt)]).toEqual([s.id, false]);
      for (const p of s.slides) if (p.image) expect([s.id, p.image, /\badam\b/.test(appImage(p.image)?.alt ?? '')]).toEqual([s.id, p.image, false]);
    }
    for (const g of data.GLOSSARY) {
      expect([g.id, MALE.test(text(g))]).toEqual([g.id, false]);
      expect([g.id, /\badam\b/.test(appImage(data.glossaryImageId(g))?.alt ?? '')]).toEqual([g.id, false]);
    }
    expect(data.STORIES.find((s) => s.id === 'pf-basics')!.title).toBe('Kadınlarda pelvik taban');
  });

  it('Turkish and English women\'s files hide and add the same items', () => {
    for (const n of ['stories', 'glossary']) {
      const t = JSON.parse(read(`src/content/${n}.female.tr.json`)) as { hide: string[]; add: { id: string; after: string }[]; patch: { id: string }[] };
      const e = JSON.parse(read(`src/content/${n}.female.en.json`)) as typeof t;
      expect(e.hide).toEqual(t.hide);
      expect(e.add.map((a) => [a.id, a.after])).toEqual(t.add.map((a) => [a.id, a.after]));
      expect(e.patch.map((p) => p.id)).toEqual(t.patch.map((p) => p.id));
    }
  });
});

describe('reminders and the app name (round 4, 2026-11-25)', () => {
  it('every reminder has its own title and body in both languages; the neutral ones never name the exercise', () => {
    for (const lang of [tr, en] as Record<string, unknown>[]) {
      const r = lang.reminders as Record<string, Record<string, string>>;
      for (const style of ['discreet', 'explicit']) for (let i = 0; i < 10; i++) expect([style, i, !!r[style]![`title${i}`], !!r[style]![`body${i}`]]).toEqual([style, i, true, true]);
    }
    const neutral = JSON.stringify((tr as unknown as { reminders: { discreet: unknown } }).reminders.discreet);
    expect(neutral).not.toMatch(/kegel|pelvik|cinsel|sertleş|boşal/i);
  });

  it('the app is called Phelvik, with the full store name in each language', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const app = require('@/config/app') as typeof import('@/config/app');
    expect(app.APP_NAME).toBe('Phelvik');
    expect(app.APP_FULL_NAME.tr).toBe('Phelvik: Kegel & Pelvik Taban');
    expect((tr as unknown as { consent: { title: string } }).consent.title).toBe("{{app}}'e hoş geldin");
  });
});

describe('penis control line, men only (2026-11-25)', () => {
  it('the anatomy animation and the tutorial say it to men; women keep the original lines', async () => {
    for (const lng of ['tr', 'en'] as const) {
      await i18n.changeLanguage(lng);
      const s4 = (sex: Sex) => i18n.t('introAnatomy.captions.s4', sex === 'female' ? { context: 'female' } : {});
      const what = (sex: Sex) => (i18n.t('tutorial.what.body', { returnObjects: true, ...(sex === 'female' ? { context: 'female' } : {}) }) as string[]).join(' ');
      expect(s4('male')).toMatch(/penis/i);
      expect(what('male')).toMatch(/penis/i);
      expect(s4('female')).not.toMatch(MALE_ONLY);
      expect(what('female')).not.toMatch(MALE_ONLY);
      expect(s4('female')).toMatch(/idrar|urine/);
    }
    await i18n.changeLanguage('tr');
    expect(read('src/features/intro-anatomy/IntroAnatomyScreen.tsx')).toMatch(/t\(SCENES\[scene\]!\.caption, ctx\)/);
    expect(read('app/tutorial.tsx')).toMatch(/returnObjects: true, \.\.\.ctx/);
  });
});

describe('the 180-day story for women and men (2026-11-26)', () => {
  it('comes first for both; men read the men’s studies, women the Cochrane review and women’s benefits', () => {
    as('male');
    const m = STORIES[0]!;
    expect(m.id).toBe('journey-180');
    expect(shown(m.slides)).toMatch(/%82,5|82\.5%/);
    expect(m.sources.map((s) => s.url).join(' ')).toMatch(/24883105/);
    as('female');
    const f = STORIES[0]!;
    expect(f.id).toBe('journey-180');
    expect(shown(f.slides)).toMatch(/Cochrane/);
    expect(shown(f.slides)).not.toMatch(MALE_ONLY);
    expect(f.sources.map((s) => s.url).join(' ')).toMatch(/30288727/);
    expect(f.sources.map((s) => s.url).join(' ')).not.toMatch(/24883105|16104916/);
  });
});
