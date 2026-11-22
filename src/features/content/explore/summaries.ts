import { useTranslation } from 'react-i18next';

import type { CampSummary } from '@/features/camps/core/definition';
import { ALC } from '@/features/campus/alcohol/content';
import { alcPhase, dryDays, thisWeek as alcWeek } from '@/features/campus/alcohol/logic';
import { useCampusStore } from '@/stores/campusStore';

/**
 * Alkolsüz Kamp (route and data stay /campus/alcohol, SPEC_KESFET_V2 §3): shown in the Kamplar strip.
 * Same status line as before; "joined" once the plan is set up.
 */
export function useAlcSummary(): CampSummary {
  const { t: tr } = useTranslation();
  const s = useCampusStore((x) => x.alcohol);
  const now = new Date();
  const active = alcPhase(s) === 'active';
  const week = alcWeek(s, now);
  const status = !active
    ? tr('acampus.card.setup')
    : s.mode === 'cut'
      ? tr('acampus.card.cut', { total: String(week.total).replace('.', ','), limit: week.limit })
      : tr('acampus.card.quit', { count: dryDays(s, now) + 1 });
  const progress = !active ? 0 : s.mode === 'cut' ? Math.min(1, week.total / week.limit) : Math.min(1, dryDays(s, now) / s.quitGoalDays);
  return { joined: active, day: active && s.mode === 'quit' ? Math.min(s.quitGoalDays, dryDays(s, now) + 1) : undefined, total: s.quitGoalDays, progress, status };
}

export { ALC };
