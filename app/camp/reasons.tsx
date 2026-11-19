import { useTranslation } from 'react-i18next';

import { AppText, Header, Screen } from '@/components';
import { CAMP_SOS as SOS } from '@/features/camps/smoking/content';
import { ReasonsView } from '@/features/camps/smoking/sosTools';
import { goBack } from '@/lib/nav';
import { useCampStore } from '@/stores/campStore';

/** "Bırakma nedenlerim": the user's own reasons and photo (motivation cards). */
export default function CampReasons() {
  const { t: tr } = useTranslation();
  const profile = useCampStore((s) => s.profile);
  return (
    <Screen>
      <Header title={tr('camp.reasons.title')} onBack={() => goBack('/camp')} />
      {profile ? <ReasonsView profile={profile} /> : <AppText muted>{SOS.reasons.empty}</AppText>}
    </Screen>
  );
}
