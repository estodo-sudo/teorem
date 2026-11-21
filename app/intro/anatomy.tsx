import { router, useLocalSearchParams } from 'expo-router';

import { introExitTarget, markIntroSeen, type IntroChoice } from '@/features/intro-anatomy/flow';
import { IntroAnatomyScreen } from '@/features/intro-anatomy/IntroAnatomyScreen';

/** "Pelvik taban kasın nerede?": during first-run setup, or again from Profil (`?replay=1`). */
export default function IntroAnatomyRoute() {
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const again = replay === '1';
  const exit = (choice: IntroChoice) => {
    markIntroSeen();
    const to = introExitTarget(choice, again);
    if (to.kind === 'back') {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } else if (to.href === '/tutorial') router.replace({ pathname: '/tutorial', params: { replay: '1' } });
    else router.replace(to.href);
  };
  return <IntroAnatomyScreen onExit={exit} onSkip={markIntroSeen} />;
}
