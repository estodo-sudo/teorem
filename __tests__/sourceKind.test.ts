import { sourceKind } from '@/features/content/sourceKind';
import tr from '@/i18n/tr.json';

describe('source type badge (SPEC_UI_V3 §7.15)', () => {
  it('reads the kind from the org and title', () => {
    expect(sourceKind({ org: 'WHO', title: 'Tobacco fact sheet' })).toBe('who');
    expect(sourceKind({ org: 'Dünya Sağlık Örgütü (DSÖ)', title: 'Tütün' })).toBe('who');
    expect(sourceKind({ org: 'Whole Foods Journal', title: 'Diet' })).toBe('study');
    expect(sourceKind({ org: 'NEJM', title: 'A randomized trial of varenicline' })).toBe('rct');
    expect(sourceKind({ org: 'Cochrane', title: 'Nicotine replacement therapy' })).toBe('review');
    expect(sourceKind({ org: 'NICE', title: 'Tobacco: preventing uptake' })).toBe('guideline');
    expect(sourceKind({ org: 'T.C. Sağlık Bakanlığı', title: 'ALO 171' })).toBe('institution');
    expect(sourceKind({ org: 'Some Journal', title: 'Cohort of smokers' })).toBe('study');
  });
  it('every kind has a Turkish label', () => {
    const kinds = (tr as unknown as { sources: { kind: Record<string, string> } }).sources.kind;
    for (const k of ['who', 'rct', 'review', 'guideline', 'institution', 'study']) expect(kinds[k]).toBeTruthy();
  });
});
