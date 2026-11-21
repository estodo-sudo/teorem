import { isAllowedDuringFirstRun, requiredFirstRunRoute } from '@/features/app/gate';
import { useProfileStore } from '@/stores/profileStore';

import { introExitTarget, markIntroSeen } from '../flow';
import { poseAt, sceneIndexAt, SCENES, TOTAL_MS } from '../timeline';

/** SPEC_ANIMASYON_PELVIK §7 (place in the flow) and §9 (tests). */
describe('anatomy animation in the first-run flow', () => {
  beforeEach(() => useProfileStore.getState().reset());

  it('comes right after the welcome (consent) screen, before onboarding', () => {
    const p = useProfileStore.getState().profile;
    expect(p.introAnatomySeen).toBe(false);
    expect(requiredFirstRunRoute({ ...p, disclaimerAcceptedAt: 'x' })).toBe('/intro/anatomy');
  });

  it('"Geç" jumps to the last state of scene 8 (buttons shown) and saves introAnatomySeen', () => {
    // Skip sets the clock to the end: that moment is scene 8 with its buttons fully in.
    expect(sceneIndexAt(TOTAL_MS)).toBe(SCENES.length - 1);
    expect(poseAt(TOTAL_MS).buttons).toBe(1);
    markIntroSeen();
    const p = useProfileStore.getState().profile;
    expect(p.introAnatomySeen).toBe(true);
    // Setup then moves on to onboarding, but the user can stay on the animation until a button.
    expect(requiredFirstRunRoute({ ...p, disclaimerAcceptedAt: 'x' })).toBe('/onboarding');
    expect(isAllowedDuringFirstRun('/onboarding', 'intro')).toBe(true);
  });

  it('during setup, "Sonra" and "Kası bul" both go on with onboarding', () => {
    expect(introExitTarget('later', false)).toEqual({ kind: 'replace', href: '/onboarding' });
    expect(introExitTarget('tutorial', false)).toEqual({ kind: 'replace', href: '/onboarding' });
  });

  it('watched again from Profil: "Kası bul" opens the tutorial, "Sonra" goes back', () => {
    expect(introExitTarget('tutorial', true)).toEqual({ kind: 'replace', href: '/tutorial', replay: true });
    expect(introExitTarget('later', true)).toEqual({ kind: 'back' });
  });
});
