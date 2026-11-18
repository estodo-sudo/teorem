import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Screen } from '@/components';
import { priceAt } from '@/features/camp/engine/savings';
import { currentAttempt, latestAttempt } from '@/features/camp/state';
import { PlanSummary } from '@/features/camp/ui';
import { goBack } from '@/lib/nav';
import { useCampStore } from '@/stores/campStore';

/** The personal plan made at the assessment (quit day, phases, dependence, plans, savings). */
export default function CampPlan() {
  const { t: tr } = useTranslation();
  const s = useCampStore();
  const attempt = currentAttempt(s) ?? latestAttempt(s);
  const [now] = useState(() => new Date());
  if (!s.profile || !attempt) {
    return (
      <Screen>
        <Header title={tr('camp.home.planTitle', { n: 1 })} onBack={() => goBack('/camp')} />
      </Screen>
    );
  }
  return (
    <Screen>
      <Header title={tr('camp.title')} onBack={() => goBack('/camp')} />
      <AppText variant="h2" accessibilityRole="header">
        {tr('camp.home.planTitle', { n: attempt.attemptNo })}
      </AppText>
      <PlanSummary profile={s.profile} price={priceAt(s.prices, now) ?? { packPriceTRY: 0, packSize: 20 }} attempt={attempt} plans={s.plans} now={now} />
    </Screen>
  );
}
