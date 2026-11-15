import { isAllowedDuringFirstRun, requiredFirstRunRoute } from '@/features/app/gate';

describe('first-run gate', () => {
  it('requires consent, then onboarding, then tutorial', () => {
    expect(requiredFirstRunRoute({ disclaimerAcceptedAt: null, onboardingDone: false, tutorialDone: false })).toBe('/consent');
    expect(requiredFirstRunRoute({ disclaimerAcceptedAt: 'x', onboardingDone: false, tutorialDone: false })).toBe('/onboarding');
    expect(requiredFirstRunRoute({ disclaimerAcceptedAt: 'x', onboardingDone: true, tutorialDone: false })).toBe('/tutorial');
    expect(requiredFirstRunRoute({ disclaimerAcceptedAt: 'x', onboardingDone: true, tutorialDone: true })).toBeNull();
  });
  it('blocks every other route (deep links included) until setup is complete', () => {
    expect(isAllowedDuringFirstRun('/consent', 'consent')).toBe(true);
    expect(isAllowedDuringFirstRun('/consent', 'legal')).toBe(true);
    for (const seg of ['(tabs)', 'mind', 'workout', 'paywall', 'onboarding', undefined]) {
      expect(isAllowedDuringFirstRun('/consent', seg)).toBe(false);
    }
    expect(isAllowedDuringFirstRun('/tutorial', 'tutorial')).toBe(true);
    expect(isAllowedDuringFirstRun('/tutorial', 'mind')).toBe(false);
  });
});
