/**
 * Offline coach shared by every camp: a decision tree of pre-written messages and reply buttons
 * (no LLM, no server). A reply goes to another node (`next`) or opens a camp tool (`action`).
 */
export interface CoachReply {
  label: string;
  next?: string;
  action?: string;
}
export interface CoachNode<P extends string = string> {
  text: string;
  /** Phase-specific text overriding `text`. */
  byPhase?: Partial<Record<P, string>>;
  replies: CoachReply[];
}
export interface CoachScenario<P extends string = string> {
  id: string;
  emoji: string;
  title: string;
  start: string;
  nodes: Record<string, CoachNode<P>>;
}

export type ParsedAction = { kind: string; id?: string };

/**
 * Builds a camp's action parser: `simple` actions ("sos") and `withId` actions ("skill:values").
 * Unknown actions parse to null.
 */
export function actionParser<S extends string, I extends string>(simple: readonly S[], withId: readonly I[]) {
  const re = new RegExp(`^(${withId.join('|')}):([\\w-]+)$`);
  return (a: string): { kind: S } | { kind: I; id: string } | null => {
    if ((simple as readonly string[]).includes(a)) return { kind: a as S };
    const m = withId.length ? re.exec(a) : null;
    return m ? { kind: m[1] as I, id: m[2]! } : null;
  };
}

/** Fills {name} placeholders from `vars`; unknown placeholders are left as they are. */
export function fillVars(text: string, vars: Record<string, string | number>): string {
  const keys = Object.keys(vars);
  if (!keys.length) return text;
  return text.replace(new RegExp(`\\{(${keys.join('|')})\\}`, 'g'), (_, k: string) => String(vars[k]));
}

/** The text a node shows in a phase (phase override first). */
export const nodeBaseText = <P extends string>(node: CoachNode<P>, phase: P | null) => (phase && node.byPhase?.[phase]) || node.text;

/**
 * Checks a scenario: the start node exists, every reply leads to an existing node or a known action
 * (actions with an id must point at an existing item of that kind), every node can be left, and every
 * node is reachable. Returns a list of problems (empty when the scenario is sound).
 */
export function checkScenario(s: CoachScenario, parse: (a: string) => ParsedAction | null, ids: Record<string, { ids: string[]; label: string }>): string[] {
  const problems: string[] = [];
  if (!s.nodes[s.start]) problems.push(`${s.id}: start "${s.start}" missing`);
  for (const [key, node] of Object.entries(s.nodes)) {
    if (!node.replies.length) problems.push(`${s.id}.${key}: no replies`);
    for (const r of node.replies) {
      if (r.next !== undefined && !s.nodes[r.next]) problems.push(`${s.id}.${key}: next "${r.next}" missing`);
      if (r.action !== undefined) {
        const a = parse(r.action);
        const list = a && a.id !== undefined ? ids[a.kind] : undefined;
        if (!a) problems.push(`${s.id}.${key}: unknown action "${r.action}"`);
        else if (list && !list.ids.includes(a.id!)) problems.push(`${s.id}.${key}: unknown ${list.label} "${a.id}"`);
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
