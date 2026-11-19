import { actionParser, checkScenario, fillVars, nodeBaseText, type CoachNode as CoreNode, type CoachScenario as CoreScenario } from '@/features/camps/core/coachEngine';

import type { CampPhase } from '../types';

/**
 * Offline coach of the Sigarasız Kamp on the shared coach engine: a decision tree of pre-written
 * messages and reply buttons. A reply goes to another node (`next`) or opens a camp tool (`action`).
 */
export type { CoachReply } from '@/features/camps/core/coachEngine';
export type CoachNode = CoreNode<CampPhase>;
export type CoachScenario = CoreScenario<CampPhase>;

export type CoachAction = { kind: 'sos' | 'call171' | 'slip' | 'triggers' | 'checkin' | 'reasons' | 'end' } | { kind: 'skill' | 'library'; id: string };
const SIMPLE = ['sos', 'call171', 'slip', 'triggers', 'checkin', 'reasons', 'end'] as const;

/** Parses "skill:values" / "sos" style actions; null when unknown. */
export const parseAction: (a: string) => CoachAction | null = actionParser(SIMPLE, ['skill', 'library'] as const);

export interface CoachVars {
  days: number;
  reason: string;
  phase: string;
  saved: string;
  supporter: string;
}

/** Fills {days} {reason} {phase} {saved} {supporter}; unknown placeholders are left as they are. */
export function fillTemplate(text: string, vars: CoachVars): string {
  const { days, reason, phase, saved, supporter } = vars;
  return fillVars(text, { days, reason, phase, saved, supporter });
}

/** The text a node shows in a phase, with the variables filled in. */
export const nodeText = (node: CoachNode, phase: CampPhase | null, vars: CoachVars) => fillTemplate(nodeBaseText(node, phase), vars);

/**
 * Checks a scenario: the start node exists, every reply leads to an existing node or a known
 * action (skills / library ids must exist), every node can be left, and every node is reachable.
 * Returns a list of problems (empty when the scenario is sound).
 */
export const validateScenario = (s: CoachScenario, ids: { skills: string[]; library: string[] }): string[] => checkScenario(s, parseAction, { skill: { ids: ids.skills, label: 'skill' }, library: { ids: ids.library, label: 'story' } });
