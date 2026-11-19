import coachJson from '@/content/camps/odak/coach.tr.json';
import sourcesJson from '@/content/camps/odak/sources.json';
import { ODAK_COACH, ODAK_LIBRARY, ODAK_SKILLS } from '@/features/camps/odak/content';
import { ACTION_ROUTES, odakNodeText, parseOdakAction, validateOdakScenario } from '@/features/camps/odak/engine/coach';

const ids = { skills: ODAK_SKILLS.map((l) => l.id), library: ODAK_LIBRARY.map((s) => s.id) };
const strings = (v: unknown): string[] => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);

describe('Odak coach (spec 5.10)', () => {
  it('has the 12 scenarios of the spec', () => {
    expect(ODAK_COACH.scenarios.map((s) => s.title)).toEqual([
      'Şu an güçlü bir dürtü var',
      'Gece uyuyamıyorum',
      'Kaydım, kendimi berbat hissediyorum',
      'Kendimi bağımlı hissediyorum, öyle miyim?',
      'Mastürbasyon zararlı mı?',
      'Filtreyi aştım',
      'Yalnız hissediyorum',
      'Stresliyim',
      'Partnerime söylemeli miyim?',
      'Motivasyonum yok',
      'Değerlerimle çelişiyorum',
      'Uzmana gitmeli miyim?',
    ]);
  });
  it('every scenario is a sound tree: reachable nodes, no dead ends, known actions, lessons and stories', () => {
    for (const s of ODAK_COACH.scenarios) expect(validateOdakScenario(s, ids)).toEqual([]);
  });
  it('parses actions and fills placeholders', () => {
    expect(parseOdakAction('sos')).toEqual({ kind: 'sos' });
    expect(parseOdakAction('skill:values')).toEqual({ kind: 'skill', id: 'values' });
    expect(parseOdakAction('call171')).toBeNull();
    expect(odakNodeText({ text: '{days} gün · {value} · {managed}', replies: [] }, { days: 4, value: 'Odak', managed: 2 })).toBe('4 gün · Odak · 2');
    for (const r of Object.values(ACTION_ROUTES)) expect(r.startsWith('/odak/')).toBe(true);
  });
  it('shows the "not a human or AI" note and never diagnoses or judges', () => {
    expect(ODAK_COACH.disclaimer).toMatch(/insan veya yapay zekâ değildir/);
    const all = strings(coachJson);
    const BANNED = [/günah/i, /haram/i, /kirli/i, /iğrenç/i, /sapık/i, /zayıf irade/i, /başarısız/i, /pes ettin/i, /sıfırdan başla/i, /temiz gün/i, /testosteron/i, /süper güç/i, /semen/i, /reboot/i, /iktidarsız/i, /bağımlısın/i];
    for (const t of all) {
      for (const b of BANNED) expect(t).not.toMatch(b);
      expect(t).not.toMatch(/%\s?\d|\d\s?%/);
      if (/mastürbasyon/i.test(t) && /zarar/i.test(t) && !t.endsWith('?')) expect(t).toMatch(/zararlı kabul edilmez|zararlı değil/);
    }
  });
  it('points to a specialist where it fits; self-harm thoughts go to 112', () => {
    const expert = ODAK_COACH.scenarios.find((s) => s.id === 'expert')!;
    expect(expert.nodes.urgent!.text).toMatch(/112/);
    const actions = ODAK_COACH.scenarios.flatMap((s) => Object.values(s.nodes).flatMap((n) => n.replies.map((r) => r.action))).filter(Boolean);
    expect(actions).toContain('call115');
    expect(expert.nodes.urgent!.replies.map((r) => r.action)).toContain('call112');
    expect(actions).toContain('library:when-expert');
    expect(coachJson.reviewed).toBe(false);
    const src = new Set(sourcesJson.map((s) => s.id));
    for (const id of coachJson.sourceIds) expect(src.has(id)).toBe(true);
  });
});
