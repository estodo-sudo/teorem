import { useProfileStore } from '@/stores/profileStore';

/**
 * Where the anatomy animation sits in the app (SPEC_ANIMASYON_PELVIK §7):
 * - first-run setup: right after the welcome (consent) screen. "Geç", "Sonra" and "Kası bul" all save
 *   `introAnatomySeen` and the setup goes on with onboarding ("Kası bul" opens the tutorial at the end
 *   of onboarding, which is the setup's own next steps).
 * - Profil → "Eğitimi tekrar izle" (`replay`): "Kası bul" opens the "Kası bul" tutorial (replay mode),
 *   "Sonra" goes back.
 */
export type IntroChoice = 'tutorial' | 'later';

export type IntroTarget = { kind: 'replace'; href: '/onboarding' } | { kind: 'replace'; href: '/tutorial'; replay: true } | { kind: 'back' };

export function introExitTarget(choice: IntroChoice, replay: boolean): IntroTarget {
  if (!replay) return { kind: 'replace', href: '/onboarding' };
  return choice === 'tutorial' ? { kind: 'replace', href: '/tutorial', replay: true } : { kind: 'back' };
}

/** Saves that the animation was seen (stored on the device with the profile). */
export function markIntroSeen(): void {
  if (!useProfileStore.getState().profile.introAnatomySeen) useProfileStore.getState().update({ introAnatomySeen: true });
}
