import { router, type Href } from 'expo-router';

/** Returns to the Today tab without stacking a second copy of the tabs. */
export function goHome() {
  if (router.canDismiss()) router.dismissTo('/');
  else router.replace('/');
}

/**
 * Go back when there is a screen to go back to; otherwise (e.g. the app was
 * reloaded on this screen) replace it with a fallback so the user is never stuck.
 */
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
