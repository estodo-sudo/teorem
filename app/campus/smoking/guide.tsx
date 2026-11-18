import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Header, Screen } from '@/components';
import { SMOKING } from '@/features/campus/smoking/content';
import { GuideStepView } from '@/features/campus/smoking/ui';
import { goBack } from '@/lib/nav';

/** Re-read the enrolment guide page by page; `?step=<id>` opens a given section. */
export default function SmokingGuideScreen() {
  const { t: tr } = useTranslation();
  const { step } = useLocalSearchParams<{ step?: string }>();
  const steps = SMOKING.steps;
  const [idx, setIdx] = useState(() => Math.max(0, steps.findIndex((x) => x.id === step)));
  const last = idx === steps.length - 1;

  return (
    <Screen
      key={idx}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {idx > 0 ? <Button label={tr('common.back')} variant="secondary" onPress={() => setIdx((i) => i - 1)} style={{ flex: 1 }} /> : null}
          <Button label={last ? tr('smoking.guide.finish') : tr('common.next')} variant="primary" onPress={() => (last ? goBack('/campus/smoking') : setIdx((i) => i + 1))} style={{ flex: 1 }} />
        </View>
      }
    >
      <Header title={tr('smoking.guide.title')} />
      <GuideStepView step={steps[idx]!} n={idx + 1} total={steps.length} />
    </Screen>
  );
}
