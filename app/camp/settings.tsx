import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Dialog, Header, Screen, SwitchRow, useTheme } from '@/components';
import { deleteReasonPhoto } from '@/features/camp/device';
import { daysSinceQuit } from '@/features/camp/engine/phase';
import { priceAt } from '@/features/camp/engine/savings';
import { parsePriceTRY } from '@/features/camp/onboarding';
import { currentAttempt, MAX_PREP_DAYS, MIN_PREP_DAYS, quitDateIn } from '@/features/camp/state';
import { fmtTL, NumberStepper, useCampDate } from '@/features/camp/ui';
import { SectionTitle } from '@/features/campus/shared/ui';
import { hasNotificationPermission, requestNotificationPermission } from '@/features/reminders/permissions';
import { syncReminders } from '@/features/reminders/scheduler';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

/** Camp settings: quit day (while preparing), pack price, delete the camp data. */
export default function CampSettings() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const fmtDate = useCampDate();
  const s = useCampStore();
  const attempt = currentAttempt(s);
  const [now] = useState(() => new Date());
  const current = priceAt(s.prices, now);
  const preparing = attempt?.status === 'preparing';
  const [days, setDays] = useState(() => (attempt && preparing ? Math.min(MAX_PREP_DAYS, Math.max(MIN_PREP_DAYS, -daysSinceQuit(attempt, now))) : 7));
  const [priceText, setPriceText] = useState('');
  const [packSize, setPackSize] = useState(current?.packSize ?? 20);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | 'quitNow' | 'reset1' | 'reset2'>(null);
  const price = parsePriceTRY(priceText);
  const [permission, setPermission] = useState<boolean | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    void hasNotificationPermission().then(setPermission);
  }, []);

  const field = { minHeight: 52, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, paddingHorizontal: 14, color: t.colors.text, fontSize: 18 } as const;

  return (
    <Screen>
      <Header title={tr('camp.settings.title')} onBack={() => goBack('/camp')} />

      {attempt && preparing ? (
        <>
          <SectionTitle emoji="📅" title={tr('camp.settings.quitTitle')} hint={tr('camp.settings.quitHint', { date: fmtDate(attempt.plannedQuitDate) })} />
          <Card style={{ gap: 12 }}>
            <NumberStepper label={tr('camp.onb.method.inDays')} value={days} onChange={setDays} min={MIN_PREP_DAYS} max={MAX_PREP_DAYS} unit={tr('camp.onb.method.daysUnit')} quick={[3, 5, 7, 10, 14]} />
            <AppText variant="small" weight="700" center>
              {tr('camp.onb.method.quitOn', { date: fmtDate(quitDateIn(days, now)) })}
            </AppText>
            <Button
              label={tr('camp.settings.quitSave')}
              variant="primary"
              onPress={() => {
                useCampStore.getState().changeQuitDate(quitDateIn(days, new Date()));
                setNotice(tr('camp.settings.quitSaved'));
              }}
            />
            <Button label={tr('camp.settings.quitNow')} variant="secondary" onPress={() => setDialog('quitNow')} />
          </Card>
        </>
      ) : null}

      <SectionTitle emoji="💰" title={tr('camp.settings.priceTitle')} hint={current ? tr('camp.settings.priceNow', { price: current.packPriceTRY, size: current.packSize }) : undefined} />
      <Card style={{ gap: 12 }}>
        <AppText weight="800">{tr('camp.onb.price.priceLabel')}</AppText>
        <TextInput
          value={priceText}
          onChangeText={(v) => setPriceText(v.replace(/[^0-9.,]/g, ''))}
          keyboardType="decimal-pad"
          maxLength={9}
          placeholder={tr('camp.onb.price.placeholder')}
          placeholderTextColor={t.colors.textMuted}
          accessibilityLabel={tr('camp.onb.price.priceLabel')}
          style={field}
        />
        <AppText weight="800" center>
          {tr('camp.onb.price.packSize')}
        </AppText>
        <NumberStepper label={tr('camp.onb.price.packSize')} value={packSize} onChange={setPackSize} min={1} max={50} unit={tr('camp.onb.price.packUnit')} quick={[10, 20, 25]} />
        <Button
          label={tr('camp.settings.priceSave')}
          variant="primary"
          disabled={price === null}
          onPress={() => {
            if (price === null) return;
            useCampStore.getState().updatePrice({ packPriceTRY: price, packSize });
            setPriceText('');
            setNotice(tr('camp.settings.priceSaved'));
          }}
        />
        <AppText variant="tiny" muted>
          {tr('camp.settings.priceNote')}
        </AppText>
        {s.prices.length > 1 ? (
          <View style={{ gap: 4 }}>
            <AppText variant="small" weight="800" muted>
              {tr('camp.settings.priceHistory')}
            </AppText>
            {[...s.prices].reverse().map((p) => (
              <View key={p.from} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="small">{fmtDate(p.from)}</AppText>
                <AppText variant="small" weight="700">
                  {tr('camp.settings.priceRow', { price: fmtTL(p.packPriceTRY), size: p.packSize })}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      {notice ? (
        <AppText variant="small" weight="700" color={t.colors.success} accessibilityLiveRegion="polite">
          ✓ {notice}
        </AppText>
      ) : null}

      {attempt?.status === 'active' ? (
        <>
          <SectionTitle emoji="🔄" title={tr('camp.settings.relapseTitle')} hint={tr('camp.settings.relapseHint')} />
          <Button label={tr('camp.settings.relapseButton')} variant="secondary" onPress={() => router.push('/camp/relapse')} />
        </>
      ) : null}

      <SectionTitle emoji="🔔" title={tr('camp.settings.notifTitle')} hint={tr('camp.settings.notifHint')} />
      <Card padded={false}>
        <SwitchRow label={tr('camp.settings.notifSwitch')} description={tr('camp.settings.notifSwitchHint')} value={s.notifyEnabled} onChange={(v) => useCampStore.getState().setNotifyEnabled(v)} />
      </Card>
      {s.notifyEnabled && permission === false ? (
        <View style={{ gap: 6 }}>
          <AppText variant="small" muted>
            {tr('camp.settings.notifNoPermission')}
          </AppText>
          <Button
            label={tr('camp.settings.notifAllow')}
            icon="bell"
            variant="secondary"
            onPress={async () => {
              const ok = await requestNotificationPermission();
              setPermission(ok);
              if (ok) void syncReminders();
            }}
          />
        </View>
      ) : null}
      <AppText variant="tiny" muted>
        {tr('camp.settings.notifDiscreet')}
      </AppText>

      <SectionTitle emoji="📚" title={tr('camp.sources.title')} hint={tr('camp.settings.sourcesHint')} />
      <Button label={tr('camp.sources.title')} icon="book" variant="secondary" onPress={() => router.push('/camp/sources')} />

      <SectionTitle emoji="🗑️" title={tr('camp.settings.resetTitle')} />
      <Button label={tr('camp.home.reset')} variant="ghost" icon="trash" onPress={() => setDialog('reset1')} />

      <Dialog
        visible={dialog === 'quitNow'}
        title={tr('camp.settings.quitNowTitle')}
        message={tr('camp.settings.quitNowBody')}
        onDismiss={() => setDialog(null)}
        actions={[
          {
            label: tr('camp.settings.quitNowConfirm'),
            variant: 'accent',
            onPress: () => {
              setDialog(null);
              useCampStore.getState().quitEarly();
              router.replace('/camp');
            },
          },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setDialog(null) },
        ]}
      />
      <Dialog
        visible={dialog === 'reset1' || dialog === 'reset2'}
        title={dialog === 'reset1' ? tr('camp.home.resetTitle') : tr('camp.home.resetConfirmTitle')}
        message={dialog === 'reset1' ? tr('camp.home.resetBody') : tr('camp.home.resetConfirmBody')}
        onDismiss={() => setDialog(null)}
        actions={[
          {
            label: dialog === 'reset1' ? tr('common.continue') : tr('camp.home.resetConfirm'),
            variant: 'danger',
            onPress: () => {
              if (dialog === 'reset1') {
                setDialog('reset2');
                return;
              }
              setDialog(null);
              deleteReasonPhoto(useCampStore.getState().profile?.reasonPhotoUri);
              useCampStore.getState().reset();
              useCampEventsStore.getState().clearAll();
              router.replace('/discover');
            },
          },
          { label: tr('common.cancel'), variant: 'ghost', onPress: () => setDialog(null) },
        ]}
      />
    </Screen>
  );
}
