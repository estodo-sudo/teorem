import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Header, Screen } from '@/components';
import { MC } from '@/features/campus/masturbation/content';
import { GuideStepView } from '@/features/campus/smoking/ui';
import { goBack } from '@/lib/nav';

/** Re-read the enrolment guide of the masturbation campus page by page. */
export default function McGuideScreen() {
  const { t: tr } = useTranslation();
  const steps = MC.steps;
  const [idx, setIdx] = useState(0);
  const last = idx === steps.length - 1;
  return (
    <Screen
      key={idx}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {idx > 0 ? <Button label={tr('common.back')} variant="secondary" onPress={() => setIdx((i) => i - 1)} style={{ flex: 1 }} /> : null}
          <Button label={last ? tr('mcampus.guide.finish') : tr('common.next')} variant="primary" onPress={() => (last ? goBack('/campus/masturbation') : setIdx((i) => i + 1))} style={{ flex: 1 }} />
        </View>
      }
    >
      <Header title={tr('mcampus.guide.title')} />
      <GuideStepView step={steps[idx]!} n={idx + 1} total={steps.length} />
    </Screen>
  );
}
