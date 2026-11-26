import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, Screen, useTheme, type IconName } from '@/components';
import { Button, Card, EmptyState, IconTile, ScalePressable, uiHaptic } from '@/components/ui';
import { APP_NAME } from '@/config/app';
import { LIST_PREVIEW_PRICES, OFFER_PREVIEW_PRICES, PREVIEW_PRICES, SHOW_PREVIEW_PRICES, TRIAL_DAYS, type PlanKey } from '@/config/monetization';
import { PaywallPhoto, PW } from '@/features/purchases/PaywallArt';
import { isUserCancelled, loadOffers, purchase, restorePurchases, startPurchaseListener } from '@/features/purchases/iap';
import { previewOffers, trialEndDate, weeklyEquivalent, withCompareAt, yearlySavingPercent, type Offer } from '@/features/purchases/pricing';
import { goHome } from '@/lib/nav';
import { useProfileStore } from '@/stores/profileStore';
import { localeOf } from '@/i18n/languages';

/**
 * Paywall — v3 (2026-11-26, after "it looks AI-made"): a real photo with the title on it, the three
 * plans one under the other (14-day trial on each; a solid tag for "En iyi değer" or "%11 indirim"),
 * five plain benefits with brand checks, and a pinned flat button with the billing note and links.
 * One brand colour on a dark page; no glows, gradient pills or animated effects.
 */
export default function Paywall() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tr, i18n } = useTranslation();
  const { source, offer: offerParam } = useLocalSearchParams<{ source?: string; offer?: string }>();
  // The "fırsat" paywall (2026-11-26): lower monthly and weekly prices, opened from Tur 2 and the locked parts.
  const isOffer = offerParam === '1';
  const locale = localeOf(i18n.language);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [selected, setSelected] = useState<PlanKey>(isOffer ? 'monthly' : 'yearly');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [soft, setSoft] = useState(false);

  const leave = useCallback(() => {
    if (router.canGoBack()) router.back();
    else goHome();
  }, []);

  const applyOffers = useCallback((o: Offer[]) => {
    setOffers(o);
    if (o.length) setSelected((cur) => (o.some((x) => x.key === cur) ? cur : o[0]!.key));
  }, []);

  // Without a store (Expo Go, web) previews show the trial prices; store builds never do.
  // The offer shows the regular prices crossed out; the regular paywall the full price of a reduced plan.
  const fetchOffers = useCallback(
    () =>
      Promise.all(isOffer ? [loadOffers('offer'), loadOffers('regular')] : [loadOffers('regular'), loadOffers('list')])
        .then(([o, r]) => withCompareAt(o, r))
        .then((o) =>
          o.length || !SHOW_PREVIEW_PRICES ? o : previewOffers(PREVIEW_PRICES, TRIAL_DAYS, locale, isOffer ? OFFER_PREVIEW_PRICES : undefined, isOffer ? undefined : LIST_PREVIEW_PRICES),
        ),
    [locale, isOffer],
  );

  const load = useCallback(() => {
    setOffers(null);
    void fetchOffers().then(applyOffers);
  }, [applyOffers, fetchOffers]);

  useEffect(() => {
    void fetchOffers().then(applyOffers);
    return startPurchaseListener(() => {
      setBusy(false);
      leave();
    });
  }, [applyOffers, fetchOffers, leave]);

  const close = () => {
    const p = useProfileStore.getState();
    // One-time, gentler second screen after the first paywall (not after the offer).
    if (!isOffer && !p.profile.paywallSeen) {
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
    if (o.preview) return setMessage(tr('paywall.previewBuy'));
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

  /** Footnote links; `c` is their colour (light on the dark paywall, muted on the soft screen). */
  const legal = (c: string) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
      <LinkText color={c} label={tr('paywall.restoreShort')} onPress={restore} role="button" />
      <AppText variant="caption" style={{ color: c }} accessibilityElementsHidden importantForAccessibility="no">
        {' · '}
      </AppText>
      <LinkText color={c} label={tr('paywall.termsShort')} onPress={() => router.push('/legal/terms')} />
      <AppText variant="caption" style={{ color: c }} accessibilityElementsHidden importantForAccessibility="no">
        {' · '}
      </AppText>
      <LinkText color={c} label={tr('paywall.privacyShort')} onPress={() => router.push('/legal/privacy')} />
      <AppText variant="caption" style={{ color: c }} accessibilityElementsHidden importantForAccessibility="no">
        {' · '}
      </AppText>
      <LinkText color={c} label={tr('paywall.presaleShort')} onPress={() => router.push('/legal/presale')} />
    </View>
  );

  const billingNote = current ? (
    <AppText variant="caption" center style={{ fontWeight: '400', color: PW.faint }}>
      {current.type === 'in-app'
        ? tr('paywall.noteLifetime', { price: current.displayPrice })
        : trialEnd
          ? tr('paywall.noteTrial', { days: current.trialDays, date: fmtDate(trialEnd), price: current.displayPrice, period: tr(`paywall.per.${current.key}`) })
          : tr('paywall.noteSub', { price: current.displayPrice, period: tr(`paywall.per.${current.key}`) })}
    </AppText>
  ) : null;

  const errorText = message ? (
    <AppText accessibilityRole="alert" variant="footnote" center color={t.tokens.destructive}>
      {message}
    </AppText>
  ) : null;

  if (soft && yearly) {
    const end = trialEndDate(new Date(), yearly.trialDays!);
    const steps: { icon: IconName; title: string; text: string }[] = [
      { icon: 'success', title: tr('paywall.soft.step1Title'), text: tr('paywall.soft.step1') },
      { icon: 'card', title: tr('paywall.soft.step3Title'), text: tr('paywall.soft.step3', { date: fmtDate(end), price: yearly.displayPrice }) },
    ];
    return (
      <Screen
        footer={
          <>
            <Button label={tr('paywall.soft.cta', { days: yearly.trialDays })} size="lg" loading={busy} onPress={() => void buy(yearly)} fullWidth />
            <Button label={tr('paywall.soft.later')} variant="ghost" onPress={leave} fullWidth />
            {legal(t.tokens.mutedForeground)}
          </>
        }
      >
        <View style={{ alignItems: 'center', gap: t.space.md, marginTop: t.space.xxl }}>
          <IconTile icon="calendar" size={t.tile.lg + t.space.lg} round />
          <AppText variant="title1" center accessibilityRole="header">
            {tr('paywall.soft.title', { days: yearly.trialDays })}
          </AppText>
          <AppText variant="body" muted center>
            {tr('paywall.soft.body')}
          </AppText>
        </View>
        {/* Vertical timeline: today → reminder → first charge */}
        <Card style={{ padding: t.space.gutter }}>
          <View accessibilityRole="list">
            {steps.map((s, i) => (
              <TimelineStep key={s.icon} icon={s.icon} title={s.title} text={s.text} last={i === steps.length - 1} first={i === 0} />
            ))}
          </View>
        </Card>
        {errorText}
      </Screen>
    );
  }

  // Main paywall, v3 (2026-11-26): photo + title, the plans one under the other, the benefits under
  // them, the button pinned at the bottom. Flat and quiet — no glows or animated effects.
  const title = source && source !== 'onboarding' ? tr('paywall.titleLocked') : tr('paywall.title', { app: APP_NAME });
  return (
    <View style={{ flex: 1, backgroundColor: PW.bg }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: t.space.md }} showsVerticalScrollIndicator={false} bounces={false}>
          <PaywallPhoto height={insets.top + 200}>
            <View style={{ paddingHorizontal: t.space.gutter, paddingBottom: 2, gap: 6 }}>
              {isOffer ? (
                <AppText variant="caption" style={{ color: PW.amber, fontWeight: '800', letterSpacing: 1.4 }}>
                  {tr('paywall.offerKicker').toLocaleUpperCase(locale)}
                </AppText>
              ) : null}
              <AppText accessibilityRole="header" style={{ color: PW.text, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 }}>
                {title}
              </AppText>
            </View>
          </PaywallPhoto>

          <View style={{ paddingHorizontal: t.space.gutter }}>
            {/* Plans, one under the other */}
            <View style={{ marginTop: t.space.lg }}>
              {offers === null ? (
                <View style={{ padding: t.space.xl, alignItems: 'center' }}>
                  <ActivityIndicator color={PW.brand} />
                </View>
              ) : offers.length === 0 ? (
                <Card style={{ paddingHorizontal: t.space.gutter }}>
                  <EmptyState icon="info" tone="mind" title={tr('paywall.unavailableTitle')} description={tr('paywall.unavailableBody')} action={<Button label={tr('paywall.retry')} variant="secondary" size="sm" icon="rotate" onPress={load} />} />
                </Card>
              ) : (
                <View style={{ gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel={tr('paywall.choosePlan')}>
                  {offers.map((o) => (
                    <PlanRow key={o.key} offer={o} active={o.key === selected} saving={o.key === 'yearly' ? saving : null} locale={locale} onPress={() => setSelected(o.key)} />
                  ))}
                </View>
              )}
            </View>

            {/* What Premium brings */}
            <View style={{ marginTop: t.space.md, gap: 10 }} accessibilityRole="list">
              {BENEFITS.map((key) => (
                <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md }}>
                  <Icon name="check" size={18} color={PW.brand} strokeWidth={2.6} />
                  <AppText variant="callout" style={{ flex: 1, color: PW.text }}>
                    {tr(`paywall.list.${key}`)}
                  </AppText>
                </View>
              ))}
            </View>

            {offers?.some((o) => o.preview) ? (
              <AppText variant="caption" style={{ color: PW.faint, fontWeight: '400', marginTop: t.space.lg }}>
                {tr('paywall.previewNote')}
              </AppText>
            ) : null}
          </View>
        </ScrollView>

        {/* Pinned: the button, the billing note and the links */}
        <View style={{ paddingHorizontal: t.space.gutter, paddingTop: t.space.sm, gap: t.space.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: PW.border, backgroundColor: PW.bg }}>
          <ScalePressable
            onPress={() => {
              if (!current || busy) return;
              uiHaptic('light');
              void buy(current);
            }}
            accessibilityRole="button"
            accessibilityLabel={current?.trialDays ? tr('paywall.ctaTrial', { days: current.trialDays }) : tr('paywall.cta')}
            accessibilityState={{ disabled: !current, busy }}
            testID="paywall-cta"
            style={{ height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: PW.brand, opacity: current ? 1 : 0.5 }}
          >
            {busy ? (
              <ActivityIndicator color={PW.onBrand} />
            ) : (
              <AppText variant="bodyStrong" style={{ color: PW.onBrand, fontSize: 17, fontWeight: '700' }}>
                {current?.trialDays ? tr('paywall.ctaTrial', { days: current.trialDays }) : tr('paywall.cta')}
              </AppText>
            )}
          </ScalePressable>
          {errorText}
          {billingNote}
          {legal(PW.faint)}
        </View>

        {/* Close: always visible, top right, over the photo */}
        <ScalePressable onPress={close} accessibilityRole="button" accessibilityLabel={tr('common.close')} style={{ position: 'absolute', top: insets.top + t.space.xs, right: t.space.sm, width: t.touch, height: t.touch, alignItems: 'center', justifyContent: 'center' }} testID="paywall-close">
          <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.38)' }}>
            <Icon name="close" color="#FFFFFF" size="sm" strokeWidth={2.4} />
          </View>
        </ScalePressable>
      </SafeAreaView>
    </View>
  );
}

/** What Premium brings (user's list 2026-11-26). */
const BENEFITS = ['plan', 'unlimited', 'progress', 'discover', 'noAds'] as const;

function LinkText({ label, onPress, color, role = 'link' }: { label: string; onPress: () => void; color: string; role?: 'link' | 'button' }) {
  const t = useTheme();
  return (
    <ScalePressable onPress={onPress} accessibilityRole={role} accessibilityLabel={label} style={{ minHeight: t.touch, justifyContent: 'center' }}>
      <AppText variant="caption" style={{ color, textDecorationLine: 'underline', fontWeight: '400' }}>
        {label}
      </AppText>
    </ScalePressable>
  );
}

/** One plan as a row. Selected: brand border and a tinted surface; a small solid tag for value or discount. */
function PlanRow({ offer: o, active, saving, locale, onPress }: { offer: Offer; active: boolean; saving: number | null; locale: string; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const name = tr(`paywall.plan.${o.key}`);
  const eq = weeklyEquivalent(o, locale);
  const off = o.compareAtPrice && o.price ? Math.round((1 - o.price / o.compareAtPrice) * 100) : 0;
  const tag = o.compareAt ? { label: off > 0 ? tr('paywall.offPct', { pct: off }) : tr('paywall.offerBadge'), bg: PW.amber, fg: PW.onAmber } : o.key === 'yearly' ? { label: tr('paywall.bestValue'), bg: PW.brand, fg: PW.onBrand } : null;
  return (
    <ScalePressable
      onPress={() => {
        if (!active) uiHaptic('selection');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${name}, ${o.displayPrice} ${tr(`paywall.per.${o.key}`)}${o.trialDays ? `, ${tr('paywall.trialTag', { days: o.trialDays })}` : ''}${o.compareAt ? `, ${tr('paywall.offerWas', { price: o.compareAt })}` : ''}${o.key === 'yearly' ? `, ${tr('paywall.bestValue')}` : ''}${saving ? `, ${tr('paywall.saving', { pct: saving })}` : ''}${eq ? `, ${tr('paywall.perWeekEq', { price: eq })}` : ''}`}
      testID={`plan-${o.key}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.space.md,
        minHeight: 64,
        paddingHorizontal: t.space.md,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: active ? 2 : 1,
        borderColor: active ? PW.brand : PW.border,
        backgroundColor: active ? PW.surfaceSelected : PW.surface,
      }}
    >
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: active ? PW.brand : '#4A5357', alignItems: 'center', justifyContent: 'center' }}>
        {active ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PW.brand }} /> : null}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.sm, flexWrap: 'wrap' }}>
          {/* bigger plan names; the trial line under them was removed (user request 2026-11-26) */}
          <AppText style={{ color: PW.text, fontSize: 21, lineHeight: 26, fontWeight: '800', letterSpacing: -0.2 }}>
            {name}
          </AppText>
          {tag ? (
            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: tag.bg }}>
              <AppText variant="caption" style={{ color: tag.fg, fontWeight: '800', fontSize: 11 }}>
                {tag.label}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {o.compareAt ? (
          <AppText variant="caption" tabular style={{ color: PW.faint, textDecorationLine: 'line-through', fontWeight: '500' }}>
            {o.compareAt}
          </AppText>
        ) : null}
        <AppText tabular style={{ color: PW.text, fontSize: 18, lineHeight: 24, fontWeight: '700' }}>
          {o.displayPrice}
        </AppText>
        <AppText variant="caption" style={{ color: PW.muted, fontWeight: '400' }}>
          {tr(`paywall.per.${o.key}`)}
        </AppText>
      </View>
    </ScalePressable>
  );
}

function TimelineStep({ icon, title, text, first, last }: { icon: IconName; title: string; text: string; first: boolean; last: boolean }) {
  const t = useTheme();
  const node = t.tile.sm;
  return (
    <View style={{ flexDirection: 'row', gap: t.space.lg }} accessible accessibilityLabel={`${title}. ${text}`}>
      <View style={{ alignItems: 'center', width: node }}>
        <View style={{ width: node, height: node, borderRadius: t.radius.pill, backgroundColor: first ? t.tokens.primary : t.tokens.muted, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size="md" color={first ? t.tokens.primaryForeground : t.tokens.mutedForeground} />
        </View>
        {!last ? <View style={{ flex: 1, width: t.border.thin, backgroundColor: t.tokens.border, marginVertical: t.space.xs }} /> : null}
      </View>
      <View style={{ flex: 1, gap: t.space.xs, paddingBottom: last ? 0 : t.space.xl, paddingTop: t.space.sm }}>
        <AppText variant="title3">{title}</AppText>
        <AppText variant="callout" muted>
          {text}
        </AppText>
      </View>
    </View>
  );
}
