import fs from 'fs';
import path from 'path';

import en from '@/i18n/en.json';
import i18n from '@/i18n';
import tr from '@/i18n/tr.json';
import { overlay, sexOf } from '@/i18n/sex';
import { CAMP_SKILLS } from '@/features/camps/smoking/content';
import { ALC } from '@/features/campus/alcohol/content';
import { auditBand } from '@/features/campus/alcohol/logic';
import { CHALLENGES } from '@/features/content/data';
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
    expect(overlay({ s: ['a', 'b'] }, { s: ['c'] })).toEqual({ s: ['c'] });
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
