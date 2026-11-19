import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Header, Screen } from '@/components';
import { GuideStepView } from '@/features/campus/shared/guide';
import { goBack } from '@/lib/nav';

import { BODY } from './content';
import type { BodyId } from './logic';

/** Re-read a campus guide page by page. */
export function BodyGuideScreen({ id }: { id: BodyId }) {
  const { t: tr } = useTranslation();
  const steps = BODY[id].steps;
  const [idx, setIdx] = useState(0);
  const last = idx === steps.length - 1;
  return (
    <Screen
      key={idx}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {idx > 0 ? <Button label={tr('common.back')} variant="secondary" onPress={() => setIdx((i) => i - 1)} style={{ flex: 1 }} /> : null}
          <Button label={last ? tr('body.guide.finish') : tr('common.next')} variant="primary" onPress={() => (last ? goBack(`/campus/${id}`) : setIdx((i) => i + 1))} style={{ flex: 1 }} />
        </View>
      }
    >
      <Header title={tr('body.guide.title')} />
      <GuideStepView step={steps[idx]!} n={idx + 1} total={steps.length} />
    </Screen>
  );
}
