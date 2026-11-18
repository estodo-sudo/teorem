import { useTranslation } from 'react-i18next';

import { AppText, Header, Screen } from '@/components';
import { CAMPUSES, CampusCard } from '@/features/content/cards';

/** All campuses (Discover shows only the first few). */
export default function AllCampusesScreen() {
  const { t: tr } = useTranslation();
  return (
    <Screen>
      <Header title={tr('courses.allTitle')} />
      <AppText muted>{tr('courses.allSubtitle', { count: CAMPUSES.length })}</AppText>
      {CAMPUSES.map((c) => (
        <CampusCard key={c.id} entry={c} />
      ))}
    </Screen>
  );
}
