import { router } from 'expo-router';

/** Returns to the Today tab without stacking a second copy of the tabs. */
export function goHome() {
  if (router.canDismiss()) router.dismissTo('/');
  else router.replace('/');
}
