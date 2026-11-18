import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Icon, Screen, useTheme } from '@/components';
import { APP_NAME } from '@/config/app';
import type { PlanKey } from '@/config/monetization';
import { isUserCancelled, loadOffers, purchase, restorePurchases, startPurchaseListener } from '@/features/purchases/iap';
import { monthlyEquivalent, trialEndDate, yearlySavingPercent, type Offer } from '@/features/purchases/pricing';
import { goHome } from '@/lib/nav';
import { useProfileStore } from '@/stores/profileStore';

const BENEFITS = ['plan', 'levels', 'fitness', 'courses', 'camp', 'mind', 'privacy'] as const;

export default function Paywall() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [selected, setSelected] = useState<PlanKey>('yearly');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [soft, setSoft] = useState(false);

  const leave = useCallback(() => {
    if (router.canGoBack()) router.back();
    else goHome();
  }, []);

  const applyOffers = useCallback((o: Offer[]) => {
    setOffers(o);
    if (o.length && !o.some((x) => x.key === 'yearly')) setSelected(o[0]!.key);
  }, []);

  const load = useCallback(() => {
    setOffers(null);
    void loadOffers().then(applyOffers);
  }, [applyOffers]);

  useEffect(() => {
    void loadOffers().then(applyOffers);
    return startPurchaseListener(() => {
      setBusy(false);
      leave();
    });
  }, [applyOffers, leave]);

  const close = () => {
    const p = useProfileStore.getState();
    // One-time, gentler second screen (no timers, no fake discounts).
    if (!p.profile.paywallSeen) {
      p.update({ paywallSeen: true });
      const yearly = offers?.find((o) => o.key === 'yearly');
      if (yearly?.trialDays) {
        setSelected('yearly');
        setSoft(true);
        return;
      }
    }
    leave();
  };

  const buy = async (o: Offer | undefined) => {
    if (!o) return;
    setBusy(true);
    setMessage(null);
    try {
      await purchase(o);
      // Unlock happens in the purchase listener.
    } catch (e) {
      setBusy(false);
      if (!isUserCancelled(e)) setMessage(tr('paywall.error'));
    }
  };

  const restore = async () => {
    setBusy(true);
    const ok = await restorePurchases();
    setBusy(false);
    if (ok) leave();
    else setMessage(tr('paywall.restoreNone'));
  };

  const current = offers?.find((o) => o.key === selected);
  const yearly = offers?.find((o) => o.key === 'yearly');
  const monthly = offers?.find((o) => o.key === 'monthly');
  const saving = yearlySavingPercent(yearly, monthly);
  const trialEnd = current?.trialDays ? trialEndDate(new Date(), current.trialDays) : null;
  const fmtDate = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  const legal = (
    <View style={{ gap: 6, alignItems: 'center' }}>
      <Pressable onPress={restore} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
        <AppText weight="700" color={t.colors.primary}>
          {tr('paywall.restore')}
        </AppText>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Pressable onPress={() => router.push('/legal/terms')} accessibilityRole="link">
          <AppText variant="small" muted style={{ textDecorationLine: 'underline' }}>
            {tr('paywall.terms')}
          </AppText>
        </Pressable>
        <Pressable onPress={() => router.push('/legal/privacy')} accessibilityRole="link">
          <AppText variant="small" muted style={{ textDecorationLine: 'underline' }}>
            {tr('paywall.privacy')}
          </AppText>
        </Pressable>
      </View>
    </View>
  );

  const billingNote = current ? (
    <AppText variant="small" muted center>
      {current.type === 'in-app'
        ? tr('paywall.noteLifetime', { price: current.displayPrice })
        : trialEnd
          ? tr('paywall.noteTrial', { days: current.trialDays, date: fmtDate(trialEnd), price: current.displayPrice, period: tr(`paywall.per.${current.key}`) })
          : tr('paywall.noteSub', { price: current.displayPrice, period: tr(`paywall.per.${current.key}`) })}
    </AppText>
  ) : null;

  if (soft && yearly) {
    const end = trialEndDate(new Date(), yearly.trialDays!);
    return (
      <Screen
        footer={
          <>
            <Button label={tr('paywall.soft.cta', { days: yearly.trialDays })} size="lg" variant="accent" loading={busy} onPress={() => void buy(yearly)} />
            <Button label={tr('paywall.soft.later')} variant="ghost" onPress={leave} />
            {legal}
          </>
        }
      >
        <View style={{ alignItems: 'center', gap: 12, marginTop: 40 }}>
          <AppText variant="display">🎁</AppText>
          <AppText variant="h1" center>
            {tr('paywall.soft.title', { days: yearly.trialDays })}
          </AppText>
          <AppText center muted>
            {tr('paywall.soft.body')}
          </AppText>
        </View>
        <Card style={{ gap: 8 }}>
          <AppText>✅ {tr('paywall.soft.step1')}</AppText>
          <AppText>🔔 {tr('paywall.soft.step2', { date: fmtDate(trialEndDate(new Date(), Math.max(1, yearly.trialDays! - 2))) })}</AppText>
          <AppText>💳 {tr('paywall.soft.step3', { date: fmtDate(end), price: yearly.displayPrice })}</AppText>
        </Card>
        {message ? <AppText color={t.colors.danger} center>{message}</AppText> : null}
      </Screen>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={styles.topBar}>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={tr('common.close')} hitSlop={12} style={styles.close}>
          <Icon name="close" color={t.colors.text} size={26} />
        </Pressable>
      </View>
      <Screen edges={[]} footer={
        <>
          <Button
            label={current?.trialDays ? tr('paywall.ctaTrial', { days: current.trialDays }) : tr('paywall.cta')}
            size="lg"
            variant="accent"
            loading={busy}
            disabled={!current}
            onPress={() => void buy(current)}
          />
          {billingNote}
          {legal}
        </>
      }>
        <AppText variant="h1" accessibilityRole="header">
          {source && source !== 'onboarding' ? tr('paywall.titleLocked') : tr('paywall.title', { app: APP_NAME })}
        </AppText>
        <View style={{ gap: 8 }}>
          {BENEFITS.map((b) => (
            <View key={b} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <Icon name="check" color={t.colors.success} size={22} strokeWidth={3} />
              <AppText style={{ flex: 1 }}>{tr(`paywall.benefits.${b}`)}</AppText>
            </View>
          ))}
        </View>

        {offers === null ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <ActivityIndicator color={t.colors.accent} />
          </View>
        ) : offers.length === 0 ? (
          <Card style={{ gap: 8 }}>
            <AppText weight="700">{tr('paywall.unavailableTitle')}</AppText>
            <AppText muted>{tr('paywall.unavailableBody')}</AppText>
            <Button label={tr('paywall.retry')} variant="secondary" onPress={load} />
          </Card>
        ) : (
          <View style={{ gap: 10 }} accessibilityRole="radiogroup">
            {offers.map((o) => {
              const active = o.key === selected;
              const eq = o.key === 'monthly' ? null : monthlyEquivalent(o, locale);
              return (
                <Pressable
                  key={o.key}
                  onPress={() => setSelected(o.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${tr(`paywall.plan.${o.key}`)}, ${o.displayPrice}`}
                  style={[styles.plan, { borderRadius: t.radius.lg, borderColor: active ? t.colors.accent : t.colors.border, backgroundColor: t.colors.surface }]}
                >
                  <View style={[styles.radio, { borderColor: active ? t.colors.accent : t.colors.border }]}>
                    {active ? <View style={[styles.dot, { backgroundColor: t.colors.accent }]} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <AppText weight="800">{tr(`paywall.plan.${o.key}`)}</AppText>
                      {o.trialDays ? (
                        <View style={[styles.tag, { backgroundColor: t.colors.accent }]}>
                          <AppText variant="tiny" weight="800" color={t.colors.accentText}>
                            {tr('paywall.trialTag', { days: o.trialDays })}
                          </AppText>
                        </View>
                      ) : null}
                      {o.key === 'yearly' && saving ? (
                        <AppText variant="tiny" weight="700" color={t.colors.success}>
                          {tr('paywall.saving', { pct: saving })}
                        </AppText>
                      ) : null}
                    </View>
                    {eq ? (
                      <AppText variant="small" muted>
                        {tr('paywall.perMonthEq', { price: eq })}
                      </AppText>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AppText weight="800">{o.displayPrice}</AppText>
                    <AppText variant="tiny" muted>
                      {tr(`paywall.per.${o.key}`)}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        {message ? (
          <AppText color={t.colors.danger} center>
            {message}
          </AppText>
        ) : null}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', paddingHorizontal: 12 },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 2, minHeight: 68 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  tag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
});
