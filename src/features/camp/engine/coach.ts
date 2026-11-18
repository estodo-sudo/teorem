import type { CampPhase } from '../types';

/**
 * Offline coach: a decision tree of pre-written messages and reply buttons (no LLM, no server).
 * A reply goes to another node (`next`) or opens a camp tool (`action`).
 */
export interface CoachReply {
  label: string;
  next?: string;
  action?: string;
}
export interface CoachNode {
  text: string;
  /** Phase-specific text overriding `text`. */
  byPhase?: Partial<Record<CampPhase, string>>;
  replies: CoachReply[];
}
export interface CoachScenario {
  id: string;
  emoji: string;
  title: string;
  start: string;
  nodes: Record<string, CoachNode>;
}

export type CoachAction = { kind: 'sos' | 'call171' | 'slip' | 'triggers' | 'checkin' | 'reasons' | 'end' } | { kind: 'skill' | 'library'; id: string };
const SIMPLE = ['sos', 'call171', 'slip', 'triggers', 'checkin', 'reasons', 'end'] as const;

/** Parses "skill:values" / "sos" style actions; null when unknown. */
export function parseAction(a: string): CoachAction | null {
  if ((SIMPLE as readonly string[]).includes(a)) return { kind: a as (typeof SIMPLE)[number] };
  const m = /^(skill|library):([\w-]+)$/.exec(a);
  return m ? { kind: m[1] as 'skill' | 'library', id: m[2]! } : null;
}

export interface CoachVars {
  days: number;
  reason: string;
  phase: string;
  saved: string;
  supporter: string;
}

/** Fills {days} {reason} {phase} {saved} {supporter}; unknown placeholders are left as they are. */
export function fillTemplate(text: string, vars: CoachVars): string {
  return text.replace(/\{(days|reason|phase|saved|supporter)\}/g, (_, k: keyof CoachVars) => String(vars[k]));
}

/** The text a node shows in a phase, with the variables filled in. */
export const nodeText = (node: CoachNode, phase: CampPhase | null, vars: CoachVars) => fillTemplate((phase && node.byPhase?.[phase]) || node.text, vars);

/**
 * Checks a scenario: the start node exists, every reply leads to an existing node or a known
 * action (skills / library ids must exist), every node can be left, and every node is reachable.
 * Returns a list of problems (empty when the scenario is sound).
 */
export function validateScenario(s: CoachScenario, ids: { skills: string[]; library: string[] }): string[] {
  const problems: string[] = [];
  if (!s.nodes[s.start]) problems.push(`${s.id}: start "${s.start}" missing`);
  for (const [key, node] of Object.entries(s.nodes)) {
    if (!node.replies.length) problems.push(`${s.id}.${key}: no replies`);
    for (const r of node.replies) {
      if (r.next !== undefined && !s.nodes[r.next]) problems.push(`${s.id}.${key}: next "${r.next}" missing`);
      if (r.action !== undefined) {
        const a = parseAction(r.action);
        if (!a) problems.push(`${s.id}.${key}: unknown action "${r.action}"`);
        else if (a.kind === 'skill' && !ids.skills.includes(a.id)) problems.push(`${s.id}.${key}: unknown skill "${a.id}"`);
        else if (a.kind === 'library' && !ids.library.includes(a.id)) problems.push(`${s.id}.${key}: unknown story "${a.id}"`);
      }
      if (r.next === undefined && r.action === undefined) problems.push(`${s.id}.${key}: reply "${r.label}" goes nowhere`);
    }
  }
  // Reachability from the start node.
  const seen = new Set<string>();
  const stack = [s.start];
  while (stack.length) {
    const k = stack.pop()!;
    if (seen.has(k) || !s.nodes[k]) continue;
    seen.add(k);
    for (const r of s.nodes[k]!.replies) if (r.next) stack.push(r.next);
  }
  for (const k of Object.keys(s.nodes)) if (!seen.has(k)) problems.push(`${s.id}.${k}: unreachable`);
  return problems;
}
