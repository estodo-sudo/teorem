import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Screen, SwitchRow, useTheme } from '@/components';
import { deviceSecured, hasPin, savePin } from '@/features/camps/odak/privacy/device';
import { useOdakLockStore } from '@/features/camps/odak/privacy/lockStore';
import { PinPad } from '@/features/camps/odak/privacy/PinPad';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';

/** Odak Kampı privacy settings: camp lock, app PIN, how data is protected, delete everything. */
export default function OdakPrivacy() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const enabled = useOdakLockStore((s) => s.enabled);
  const notifEnabled = useOdakLockStore((s) => s.notifEnabled);
  const [secured, setSecured] = useState<boolean | null>(null);
  const [pinSet, setPinSet] = useState(false);
  const [changing, setChanging] = useState<null | 'first' | string>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dialog, setDialog] = useState<null | 'off' | 'wipe1' | 'wipe2'>(null);

  useEffect(() => {
    void (async () => {
      setSecured(await deviceSecured());
      setPinSet(await hasPin());
    })();
  }, []);

  const onPin = async (pin: string) => {
    if (changing === 'first') {
      setChanging(pin);
      setPinError(null);
      return;
    }
    if (pin !== changing) {
      setChanging('first');
      setPinError(tr('odak.lock.pinMismatch'));
      return;
    }
    await savePin(pin);
    setPinSet(true);
    setChanging(null);
    setSaved(true);
  };

  return (
    <Screen>
      <Header title={tr('odak.privacy.title')} right={<QuickExitButton />} />

      <SwitchRow label={tr('odak.privacy.lock')} description={secured ? tr('odak.privacy.lockDevice') : tr('odak.privacy.lockPin')} value={enabled} onChange={(v) => (v ? useOdakLockStore.getState().setEnabled(true) : setDialog('off'))} />

      <SwitchRow label={tr('odak.notif.switch')} description={tr('odak.notif.switchHint')} value={notifEnabled} onChange={(v) => useOdakLockStore.getState().setNotifEnabled(v)} />

      {secured === false && pinSet ? (
        changing === null ? (
          <View style={{ gap: 6 }}>
            <Button
              label={tr('odak.privacy.changePin')}
              variant="secondary"
              icon="lock"
              onPress={() => {
                setSaved(false);
                setChanging('first');
              }}
            />
            {saved ? (
              <AppText variant="small" weight="700" color={t.colors.success} accessibilityLiveRegion="polite">
                {tr('odak.privacy.pinSaved')}
              </AppText>
            ) : null}
          </View>
        ) : (
          <Card>
            <PinPad
              title={changing === 'first' ? tr('odak.lock.setupTitle') : tr('odak.lock.setupConfirm')}
              hint={changing === 'first' ? tr('odak.privacy.changePinHint') : tr('odak.lock.setupConfirmHint')}
              error={pinError}
              submitLabel={changing === 'first' ? tr('common.continue') : tr('odak.lock.setupSave')}
              onSubmit={(p) => void onPin(p)}
            />
            <Button label={tr('common.cancel')} variant="ghost" onPress={() => setChanging(null)} />
          </Card>
        )
      ) : null}

      <Card style={{ gap: t.space.sm }}>
        <AppText variant="h3">{tr('odak.privacy.howTitle')}</AppText>
        {(tr('odak.privacy.how', { returnObjects: true }) as string[]).map((line) => (
          <AppText key={line} variant="small">
            • {line}
          </AppText>
        ))}
      </Card>

      <Button label={tr('odak.panel.sources')} icon="book" variant="secondary" onPress={() => router.push('/odak/sources')} />

      <AppText variant="h3" style={{ marginTop: t.space.sm }}>
        {tr('odak.privacy.dataTitle')}
      </AppText>
      <Button label={tr('odak.privacy.wipe')} variant="ghost" icon="trash" onPress={() => setDialog('wipe1')} />

      <Dialog
        visible={dialog === 'off'}
        title={tr('odak.privacy.offTitle')}
        message={tr('odak.privacy.offBody')}
        onDismiss={() => setDialog(null)}
        actions={[
          {
            label: tr('odak.privacy.offConfirm'),
            variant: 'danger',
            onPress: () => {
              setDialog(null);
              useOdakLockStore.getState().setEnabled(false);
            },
          },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setDialog(null) },
        ]}
      />
      <Dialog
        visible={dialog === 'wipe1' || dialog === 'wipe2'}
        title={dialog === 'wipe1' ? tr('odak.privacy.wipeTitle') : tr('odak.privacy.wipeConfirmTitle')}
        message={dialog === 'wipe1' ? tr('odak.privacy.wipeBody') : tr('odak.privacy.wipeConfirmBody')}
        onDismiss={() => setDialog(null)}
        actions={[
          {
            label: dialog === 'wipe1' ? tr('common.continue') : tr('odak.privacy.wipeConfirm'),
            variant: 'danger',
            onPress: () => {
              if (dialog === 'wipe1') {
                setDialog('wipe2');
                return;
              }
              setDialog(null);
              void useOdakStore
                .getState()
                .wipe()
                .finally(() => router.replace('/'));
            },
          },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setDialog(null) },
        ]}
      />
    </Screen>
  );
}
