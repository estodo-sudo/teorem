import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Header, Screen } from '@/components';
import { PC } from '@/features/campus/porn/content';
import { GuideStepView } from '@/features/campus/smoking/ui';
import { goBack } from '@/lib/nav';

/** Re-read the enrolment guide of Özgür Zihin page by page. */
export default function PcGuideScreen() {
  const { t: tr } = useTranslation();
  const steps = PC.steps;
  const [idx, setIdx] = useState(0);
  const last = idx === steps.length - 1;
  return (
    <Screen
      key={idx}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {idx > 0 ? <Button label={tr('common.back')} variant="secondary" onPress={() => setIdx((i) => i - 1)} style={{ flex: 1 }} /> : null}
          <Button label={last ? tr('pcampus.guide.finish') : tr('common.next')} variant="primary" onPress={() => (last ? goBack('/campus/porn') : setIdx((i) => i + 1))} style={{ flex: 1 }} />
        </View>
      }
    >
      <Header title={tr('pcampus.guide.title')} />
      <GuideStepView step={steps[idx]!} n={idx + 1} total={steps.length} />
    </Screen>
  );
}
