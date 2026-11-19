import { useTranslation } from 'react-i18next';

import { AppText, Header, Screen } from '@/components';
import { CAMPS } from '@/features/camps/registry';

/** "Kamplar": every camp; each opens its own panel. Several camps can be joined at once. */
export default function CampsScreen() {
  const { t: tr } = useTranslation();
  return (
    <Screen>
      <Header title={tr('camps.allTitle')} />
      <AppText muted>{tr('camps.subtitle')}</AppText>
      {CAMPS.map((c) => (
        <c.Card key={c.id} />
      ))}
    </Screen>
  );
}
