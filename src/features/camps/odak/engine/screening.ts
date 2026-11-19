/**
 * Screening scores (pure). Never a diagnosis: a high score only makes the "talk to a specialist"
 * card prominent (SPEC_ODAK_KAMPI 0.3/4, 0.3/7).
 *   BPS (Kraus et al. 2020): 5 items, 0–2 each, total 0–10; 4+ = possible problematic use.
 *   PHQ-2 / GAD-2 (Kroenke et al.): 2 items, 0–3 each, total 0–6; 3+ = worth a closer look.
 */
export const BPS_ITEMS = 5;
export const BPS_MAX_ITEM = 2;
export const BPS_THRESHOLD = 4;
export const PHQ_GAD_MAX_ITEM = 3;
export const PHQ_GAD_THRESHOLD = 3;

const sumIf = (answers: (number | null)[], n: number, max: number): number | null => {
  if (answers.length !== n || answers.some((a) => a === null || !Number.isInteger(a) || a < 0 || a > max)) return null;
  return (answers as number[]).reduce((s, a) => s + a, 0);
};

/** BPS total, or null when not every item has a valid answer. */
export const bpsScore = (answers: (number | null)[]) => sumIf(answers, BPS_ITEMS, BPS_MAX_ITEM);
export const bpsHigh = (score: number | null) => score !== null && score >= BPS_THRESHOLD;

/** PHQ-2 / GAD-2 total (2 items, 0–3), or null when incomplete. */
export const twoItemScore = (answers: (number | null)[]) => sumIf(answers, 2, PHQ_GAD_MAX_ITEM);

export function phqGadFlags(phq2: number | null, gad2: number | null): { depression: boolean; anxiety: boolean; any: boolean } {
  const depression = phq2 !== null && phq2 >= PHQ_GAD_THRESHOLD;
  const anxiety = gad2 !== null && gad2 >= PHQ_GAD_THRESHOLD;
  return { depression, anxiety, any: depression || anxiety };
}

/** At enrolment: show the specialist card (prominent) when the BPS or the mood screen is high. */
export function onboardingReferral(bps: number | null, phq2: number | null, gad2: number | null): { expert: boolean; mood: boolean } {
  return { expert: bpsHigh(bps), mood: phqGadFlags(phq2, gad2).any };
}
