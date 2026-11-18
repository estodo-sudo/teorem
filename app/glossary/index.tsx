import { useTranslation } from 'react-i18next';

import { AppText, Header, Screen } from '@/components';
import { GlossaryCard } from '@/features/content/cards';
import { GLOSSARY } from '@/features/content/data';

/** All "Neden, Nedir ve Ne Demek?" entries. */
export default function GlossaryScreen() {
  const { t: tr } = useTranslation();
  return (
    <Screen>
      <Header title={tr('glossary.allTitle')} />
      <AppText muted>{tr('glossary.subtitle')}</AppText>
      {GLOSSARY.map((g) => (
        <GlossaryCard key={g.id} term={g} detail="full" />
      ))}
    </Screen>
  );
}
