import { existsSync } from 'fs';
import { join } from 'path';

import { LEGAL_ENTITY } from '@/config/app';
import { LEGAL_DOCS, OTHER_DOCS, POLICY_DOCS } from '@/features/legal/docs';
import tr from '@/i18n/tr.json';

type Doc = { title: string; sections: { heading: string; paragraphs: string[] }[] };
const legal = (tr as unknown as { legal: Record<string, Doc> }).legal;
const text = (d: Doc) => d.sections.flatMap((s) => [s.heading, ...s.paragraphs]).join('\n');

describe('legal documents (user request 2026-11-22)', () => {
  it('has every required document, each with a page and a title', () => {
    expect([...LEGAL_DOCS].sort()).toEqual(['cookies', 'disclaimer', 'faq', 'kvkk', 'presale', 'privacy', 'refund', 'renewal', 'terms']);
    for (const id of LEGAL_DOCS) {
      expect([id, Boolean(legal[id]?.title && legal[id]!.sections.length)]).toEqual([id, true]);
      expect([id, existsSync(join(__dirname, '..', 'app', 'legal', `${id}.tsx`))]).toEqual([id, true]);
    }
  });

  it('uses only the known placeholders and unique headings', () => {
    for (const id of LEGAL_DOCS) {
      const tokens = text(legal[id]!).match(/{{\w+}}/g) ?? [];
      expect([id, tokens.filter((x) => !['{{app}}', '{{company}}', '{{address}}', '{{email}}'].includes(x))]).toEqual([id, []]);
      const headings = legal[id]!.sections.map((s) => s.heading);
      expect(new Set(headings).size).toBe(headings.length);
    }
  });

  it('names the seller with its address in the disclosure, privacy, terms and pre-sale form', () => {
    expect(LEGAL_ENTITY.name).toBe('EtikTic');
    expect(LEGAL_ENTITY.address).toContain('Haliliye / Şanlıurfa');
    for (const id of ['kvkk', 'privacy', 'terms', 'presale'] as const) {
      expect([id, text(legal[id]!).includes('{{company}}') && text(legal[id]!).includes('{{address}}')]).toEqual([id, true]);
    }
  });

  it('says what it really does: nothing collected, data on the phone, deletion in the profile', () => {
    const privacy = text(legal.privacy!);
    expect(privacy).toMatch(/Hiçbirini/);
    expect(privacy).toMatch(/Verilerimi ve hesabımı sil/);
    expect(privacy).not.toMatch(/konum izni istenir|reklam kimliği toplanır/);
    expect(text(legal.renewal!)).toMatch(/24 saat/);
    expect(text(legal.presale!)).toMatch(/cayma hakkı/i);
  });
});

describe('profile groups', () => {
  it('"Politikalar" and "Diğer" together list every document once', () => {
    expect([...POLICY_DOCS, ...OTHER_DOCS].sort()).toEqual([...LEGAL_DOCS].sort());
    expect((tr as unknown as { profile: { groups: Record<string, string> } }).profile.groups).toMatchObject({ policies: 'Politikalar', other: 'Diğer' });
  });
});
