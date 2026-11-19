import { actionParser, checkScenario, fillVars, nodeBaseText, type CoachNode, type CoachScenario } from '@/features/camps/core/coachEngine';

/**
 * Odak Kampı coach on the shared coach engine (SPEC_ODAK_KAMPI 5.10): a decision tree of
 * pre-written messages. A reply goes to another node or opens a camp tool.
 */
export type OdakCoachAction = { kind: 'sos' | 'slip' | 'checkin' | 'diary' | 'boundaries' | 'rebuild' | 'call115' | 'call112' | 'end' } | { kind: 'skill' | 'library'; id: string };
const SIMPLE = ['sos', 'slip', 'checkin', 'diary', 'boundaries', 'rebuild', 'call115', 'call112', 'end'] as const;

export const parseOdakAction: (a: string) => OdakCoachAction | null = actionParser(SIMPLE, ['skill', 'library'] as const);

export interface OdakCoachVars {
  days: number;
  value: string;
  managed: number;
}

export const odakNodeText = (node: CoachNode, vars: OdakCoachVars) => fillVars(nodeBaseText(node, null), { days: vars.days, value: vars.value, managed: vars.managed });

/** Problems in a scenario (empty when sound): missing nodes, unknown actions / lessons / stories, dead ends. */
export const validateOdakScenario = (s: CoachScenario, ids: { skills: string[]; library: string[] }) => checkScenario(s, parseOdakAction, { skill: { ids: ids.skills, label: 'skill' }, library: { ids: ids.library, label: 'story' } });

/** Route a simple action opens (call115 / end handled by the screen). */
export const ACTION_ROUTES = { sos: '/odak/sos', slip: '/odak/slip', checkin: '/odak/checkin', diary: '/odak/log-urge', boundaries: '/odak/boundaries', rebuild: '/odak/rebuild' } as const;
