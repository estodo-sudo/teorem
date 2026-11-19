/**
 * Phase engine shared by every camp. A camp describes its programme as ordered phases, each lasting
 * until a calendar day counted from the programme start (day 0 = start day, negative = before it).
 * The last phase has `untilDay: Infinity`.
 */
export interface PhaseSpec<P extends string = string> {
  id: P;
  /** Last day (inclusive) of this phase, counted from the start day. */
  untilDay: number;
}

export type PhaseModel<P extends string = string> = readonly PhaseSpec<P>[];

/** Phase ids in programme order. */
export const phaseOrder = <P extends string>(model: PhaseModel<P>): P[] => model.map((p) => p.id);

/** The phase a programme day falls in. */
export function phaseAt<P extends string>(model: PhaseModel<P>, day: number): P {
  return (model.find((p) => day <= p.untilDay) ?? model[model.length - 1]!).id;
}

/** First day of the phase after `phase` (null when it is the last phase). */
export function nextPhaseStart<P extends string>(model: PhaseModel<P>, phase: P): number | null {
  const p = model.find((x) => x.id === phase);
  return !p || p.untilDay === Infinity ? null : p.untilDay + 1;
}

/** Calendar days until the next phase starts (null in the last phase). */
export function daysToNext<P extends string>(model: PhaseModel<P>, phase: P, day: number): number | null {
  const next = nextPhaseStart(model, phase);
  return next === null ? null : next - day;
}

/**
 * Day number used to pick missions: before the start it counts DOWN to the start (1 = the eve), so the
 * essential missions land right before it whatever the preparation length; afterwards it is the number
 * of days since the start (0 = start day).
 */
export const missionDay = (day: number) => (day < 0 ? Math.max(1, -day) : Math.max(0, day));
