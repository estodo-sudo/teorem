import * as ScreenCapture from 'expo-screen-capture';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Icon, useTheme } from '@/components';
import { useNow } from '@/lib/useNow';

import { checkPin, deviceSecured, deviceUnlock, hasPin, savePin } from './device';
import { coversOn, locksOn, unlockMethod, waitLeft, type UnlockMethod } from './lock';
import { isLocked, useOdakLockStore } from './lockStore';
import { useOdakStore } from '../store';

import { PinPad } from './PinPad';
import { quickExit, QuickExitArea } from './quickExit';

/**
 * Privacy layer around every Odak Kampı screen (spec 2):
 *  - camp lock (device lock, or an app PIN on phones without one), on by default;
 *  - locks again when the app goes to the background or the camp is left;
 *  - covers the content in the app switcher (iOS blur, Android FLAG_SECURE = blank preview, which
 *    also blocks screenshots of the camp) and while the app is inactive;
 *  - two-finger swipe down = quick exit to the app's home screen.
 */
export function PrivacyGate({ children }: { children: ReactNode }) {
  const locked = useOdakLockStore(isLocked);
  const enrolled = useOdakLockStore((s) => s.enrolled);
  const [covered, setCovered] = useState(false);

  // Decrypt the camp data only once the camp is open.
  useEffect(() => {
    if (!locked && enrolled)
      void useOdakStore
        .getState()
        .hydrate()
        .catch(() => undefined);
  }, [locked, enrolled]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      setCovered(coversOn(next));
      if (locksOn(next)) useOdakLockStore.getState().lock();
    });
    if (Platform.OS === 'ios') void ScreenCapture.enableAppSwitcherProtectionAsync(1).catch(() => undefined);
    if (Platform.OS === 'android') void ScreenCapture.preventScreenCaptureAsync('odak').catch(() => undefined);
    return () => {
      sub.remove();
      // Leaving the camp locks it: coming back asks again.
      useOdakLockStore.getState().lock();
      if (Platform.OS === 'ios') void ScreenCapture.disableAppSwitcherProtectionAsync().catch(() => undefined);
      if (Platform.OS === 'android') void ScreenCapture.allowScreenCaptureAsync('odak').catch(() => undefined);
    };
  }, []);

  return (
    <QuickExitArea>
      {locked ? <LockScreen /> : children}
      {covered ? <PrivacyCover /> : null}
    </QuickExitArea>
  );
}

/** Plain cover shown while the app is not active (no camp content, neutral). */
function PrivacyCover() {
  const t = useTheme();
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.colors.background, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Icon name="lock" color={t.colors.textMuted} size={40} />
    </View>
  );
}

function LockScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const now = useNow(1000);
  const { failures, lastFailAt } = useOdakLockStore();
  const [method, setMethod] = useState<UnlockMethod | null>(null);
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unlock = () => useOdakLockStore.getState().unlock();

  const askDevice = async () => {
    setError(null);
    if (await deviceUnlock(tr('odak.lock.prompt'), tr('common.cancel'))) unlock();
    else setError(tr('odak.lock.deviceFailed'));
  };

  useEffect(() => {
    let alive = true;
    void (async () => {
      const m = unlockMethod(await deviceSecured(), await hasPin());
      if (!alive) return;
      setMethod(m);
      if (m === 'device') void askDevice();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wait = waitLeft(failures, lastFailAt, now.getTime());

  const onPin = async (pin: string) => {
    if (await checkPin(pin)) unlock();
    else {
      useOdakLockStore.getState().pinFailed();
      setError(tr('odak.lock.pinWrong'));
    }
  };
  const onSetup = async (pin: string) => {
    if (firstPin === null) {
      setFirstPin(pin);
      setError(null);
      return;
    }
    if (pin !== firstPin) {
      setFirstPin(null);
      setError(tr('odak.lock.pinMismatch'));
      return;
    }
    await savePin(pin);
    unlock();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: t.space.md }}>
        <Button label={tr('odak.exit.button')} icon="home" variant="ghost" onPress={quickExit} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', padding: t.space.xl, gap: t.space.gutter }}>
        {method === null ? null : method === 'device' ? (
          <View style={{ alignItems: 'center', gap: t.space.lg }}>
            <Icon name="lock" color={t.colors.primary} size={48} />
            <AppText variant="h2" center accessibilityRole="header">
              {tr('odak.lock.title')}
            </AppText>
            <AppText muted center>
              {tr('odak.lock.deviceHint')}
            </AppText>
            {error ? (
              <AppText variant="small" weight="700" color={t.colors.danger} center>
                {error}
              </AppText>
            ) : null}
            <Button label={tr('odak.lock.unlock')} icon="lock" onPress={() => void askDevice()} />
          </View>
        ) : method === 'pin' ? (
          <PinPad
            title={tr('odak.lock.title')}
            hint={wait > 0 ? tr('odak.lock.wait', { count: Math.ceil(wait / 1000) }) : tr('odak.lock.pinHint')}
            error={wait > 0 ? null : error}
            disabled={wait > 0}
            submitLabel={tr('odak.lock.unlock')}
            onSubmit={(p) => void onPin(p)}
          />
        ) : (
          <PinPad
            title={firstPin === null ? tr('odak.lock.setupTitle') : tr('odak.lock.setupConfirm')}
            hint={firstPin === null ? tr('odak.lock.setupHint') : tr('odak.lock.setupConfirmHint')}
            error={error}
            submitLabel={firstPin === null ? tr('common.continue') : tr('odak.lock.setupSave')}
            onSubmit={(p) => void onSetup(p)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
