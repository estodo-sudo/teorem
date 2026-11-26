import fs from 'fs';
import path from 'path';

/**
 * Premium after Tur 1 (user request 2026-11-26): Tur 1 stays free every day; Tur 2, Kasık Fitness, İlerleme
 * and Keşfet open the "fırsat" paywall (monthly 169,90, weekly 39,90) for someone without premium.
 */
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn(), back: jest.fn() } }));

// The paywall as a real user meets it: no development bypass (env read when the config loads).
process.env.EXPO_PUBLIC_PAYWALL_TEST = '1';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { canAccess, openGated, openOffer } = require('@/features/purchases/useGate') as typeof import('@/features/purchases/useGate');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useEntitlementStore } = require('@/stores/entitlementStore') as typeof import('@/stores/entitlementStore');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DEV_BYPASS_PAYWALL } = require('@/config/monetization') as typeof import('@/config/monetization');

const read = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const tr = JSON.parse(read('src/i18n/tr.json'));
const en = JSON.parse(read('src/i18n/en.json'));

describe('the "fırsat" paywall', () => {
  beforeEach(() => {
    mockPush.mockClear();
    useEntitlementStore.setState({ entitlement: { active: false } } as never);
  });
  afterAll(() => useEntitlementStore.setState({ entitlement: { active: false } } as never));

  it('runs without the development bypass', () => {
    expect(DEV_BYPASS_PAYWALL).toBe(false);
  });

  it('openOffer pushes the paywall with the offer flag', () => {
    openOffer('round2');
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/paywall', params: { source: 'round2', offer: '1' } });
  });

  it('without premium: Tur 1 opens, Tur 2 / fitness / İlerleme / Keşfet do not; Kasık Fitness opens the offer', () => {
    expect(canAccess('workout')).toBe(true);
    for (const f of ['round2', 'fitness', 'progress', 'discover'] as const) expect(canAccess(f)).toBe(false);
    openGated('fitness', '/fitness');
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/paywall', params: { source: 'fitness', offer: '1' } });
  });

  it('an offer subscription is premium: everything opens', () => {
    useEntitlementStore.setState({ entitlement: { active: true, productId: 'premium_monthly_offer', expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString() } } as never);
    for (const f of ['workout', 'round2', 'fitness', 'progress', 'discover'] as const) expect(canAccess(f)).toBe(true);
    openGated('fitness', '/fitness');
    expect(mockPush).toHaveBeenLastCalledWith('/fitness');
  });

  it('the paywall reads the offer flag, loads the offer plans and skips the soft second screen', () => {
    const s = read('app/paywall.tsx');
    expect(s).toMatch(/const isOffer = offerParam === '1'/);
    expect(s).toMatch(/loadOffers\('offer'\), loadOffers\('regular'\)/);
    expect(s).toMatch(/withCompareAt\(o, r\)/);
    expect(s).toMatch(/OFFER_PREVIEW_PRICES/);
    expect(s).toMatch(/!isOffer && !p\.profile\.paywallSeen/);
    expect(s).toMatch(/textDecorationLine: 'line-through'/);
    for (const l of [tr, en]) {
      expect(l.paywall.offerKicker).toBeTruthy();
      expect(l.paywall.offerBadge).toBeTruthy();
      expect(l.paywall.offerWas).toMatch(/\{\{price\}\}/);
    }
  });
});

describe('Tur 2 needs premium; the lesson still comes first', () => {
  it('every way into Tur 2 checks premium after the lesson', () => {
    const starter = read('src/features/training/useSessionStarter.tsx');
    expect(starter.indexOf("if (lesson) return openGated('workout', lesson);")).toBeLessThan(starter.indexOf("if (sessionId === 'round2' && !canAccess('round2')) return openOffer('round2');"));
    const next = read('app/workout/next.tsx');
    expect(next.indexOf('if (lesson) return router.replace(lesson);')).toBeLessThan(next.indexOf("if (!canAccess('round2')) return openOffer('round2');"));
    const player = read('app/workout/[sessionId].tsx');
    expect(player).toMatch(/sessionId === 'round2' && !canAccess\('round2'\)/);
    expect(player).toMatch(/if \(blocked \|\| needsPremium\) return null;/);
  });

  it('"Hazırım" asks for premium before the move is learned; "Bir kez daha dene" only with premium', () => {
    for (const [file, again, learn] of [
      ['app/workout/round2-intro.tsx', 'round.intro.again', 'round2IntroDone: true'],
      ['app/workout/move-intro.tsx', 'moveIntro.again', 'movesLearned: withLearned'],
    ] as const) {
      const s = read(file);
      const start = s.indexOf('const startRound2 = () => {');
      expect(s.indexOf("if (!canAccess('round2')) return openOffer('round2');", start)).toBeLessThan(s.indexOf(learn, start));
      expect(s).toMatch(/const premium = useAccess\(\)\('round2'\);/);
      const button = s.indexOf(`label={tr('${again}')}`);
      expect(s.lastIndexOf('{premium ? (', button)).toBeGreaterThan(s.lastIndexOf('</View>', button));
      // without the button the note does not tell them to try again
      expect(s).toMatch(/tr\(premium \? '[\w.]+\.checkNote' : '[\w.]+\.checkNoteReady'\)/);
    }
  });
});

describe('Kasık Fitness, İlerleme and Keşfet without premium', () => {
  it('Kasık Fitness opens through the gate, and a deep link goes to the offer', () => {
    expect(read('src/features/today/WeekSections.tsx')).toMatch(/openGated\('fitness', '\/fitness'\)/);
    expect(read('app/fitness.tsx')).toMatch(/if \(!access\) router\.replace\(\{ pathname: '\/paywall', params: \{ source: 'fitness', offer: '1' \} \}\)/);
  });

  it('İlerleme and Keşfet render locked: blurred, moving on their own, a tap opens the offer', () => {
    expect(read('app/(tabs)/progress.tsx')).toMatch(/locked=\{locked \? \(\) => openOffer\('progress'\) : undefined\}/);
    expect(read('app/(tabs)/discover.tsx')).toMatch(/locked=\{locked \? \(\) => openOffer\('discover'\) : undefined\}/);
    const screen = read('src/components/Screen.tsx');
    expect(screen).toMatch(/scrollEnabled=\{!locked\}/);
    expect(screen).toMatch(/pointerEvents=\{locked \? 'none' : 'auto'\}/);
    expect(screen).toMatch(/<PremiumOverlay onPress=\{locked\} \/>/);
    const strip = read('src/features/content/explore/HorizontalSection.tsx');
    expect(strip).toMatch(/useAutoScroll\(locked, /);
    expect(strip).toMatch(/scrollEnabled=\{!locked\}/);
    expect(read('src/components/PremiumLock.tsx')).toMatch(/<BlurView/);
    for (const l of [tr, en]) {
      expect(l.premiumLock.title).toBeTruthy();
      expect(l.premiumLock.hint).toBeTruthy();
    }
    expect(tr.premiumLock.title).toBe("Premium'a özel");
  });
});

describe('feedback options show their titles only', () => {
  it('no hint under the "Tamamlandı" / "Yarıda kaldı" choices', () => {
    const s = read('app/workout/feedback.tsx');
    expect(s).not.toMatch(/feedback\.option\.\$\{o\.value\}\.hint/);
  });
});
