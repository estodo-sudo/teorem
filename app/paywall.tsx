import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText, Icon, Screen, useTheme, type IconName } from '@/components';
import { Badge, Button, Card, EmptyState, IconTile, ScalePressable, uiHaptic } from '@/components/ui';
import { APP_NAME } from '@/config/app';
import type { PlanKey } from '@/config/monetization';
import { isUserCancelled, loadOffers, purchase, restorePurchases, startPurchaseListener } from '@/features/purchases/iap';
import { trialEndDate, weeklyEquivalent, yearlySavingPercent, type Offer } from '@/features/purchases/pricing';
import { goHome } from '@/lib/nav';
import { useProfileStore } from '@/stores/profileStore';

/** At most five benefits, one line each (SPEC_UI_V3 §7.10). */
const BENEFITS = ['plan', 'levels', 'tools', 'content', 'noAds'] as const;

/**
 * Paywall — ui-v3 (SPEC_UI_V3 §7.10): visible close on the right, a calm mark and a two-line title,
 * five one-line benefits, vertical plan cards (selected = primary border + soft fill, "En iyi değer"
 * on yearly, small weekly equivalent), a trust row, one primary button and footnote links.
 * Behaviour unchanged: store prices only, no timers, no fake discounts; the one-time gentle trial screen stays.
 */
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
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
      <LinkText label={tr('paywall.restoreShort')} onPress={restore} role="button" />
      <AppText variant="footnote" muted accessibilityElementsHidden importantForAccessibility="no">
        {' · '}
      </AppText>
      <LinkText label={tr('paywall.termsShort')} onPress={() => router.push('/legal/terms')} />
      <AppText variant="footnote" muted accessibilityElementsHidden importantForAccessibility="no">
        {' · '}
      </AppText>
      <LinkText label={tr('paywall.privacyShort')} onPress={() => router.push('/legal/privacy')} />
    </View>
  );

  const billingNote = current ? (
    <AppText variant="caption" muted center style={{ fontWeight: '400' }}>
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
      { icon: 'bell', title: tr('paywall.soft.step2Title'), text: tr('paywall.soft.step2', { date: fmtDate(trialEndDate(new Date(), Math.max(1, yearly.trialDays! - 2))) }) },
      { icon: 'card', title: tr('paywall.soft.step3Title'), text: tr('paywall.soft.step3', { date: fmtDate(end), price: yearly.displayPrice }) },
    ];
    return (
      <Screen
        footer={
          <>
            <Button label={tr('paywall.soft.cta', { days: yearly.trialDays })} size="lg" loading={busy} onPress={() => void buy(yearly)} fullWidth />
            <Button label={tr('paywall.soft.later')} variant="ghost" onPress={leave} fullWidth />
            {legal}
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.tokens.background }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: t.space.sm }}>
        <ScalePressable onPress={close} accessibilityRole="button" accessibilityLabel={tr('common.close')} style={{ width: t.touch, height: t.touch, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" color={t.tokens.mutedForeground} size="lg" />
        </ScalePressable>
      </View>
      <Screen
        edges={[]}
        footer={
          <>
            <Button label={current?.trialDays ? tr('paywall.ctaTrial', { days: current.trialDays }) : tr('paywall.cta')} size="lg" loading={busy} disabled={!current} onPress={() => void buy(current)} fullWidth />
            {billingNote}
            {legal}
          </>
        }
      >
        {/* Hero: calm mark + two-line title */}
        <View style={{ alignItems: 'center', gap: t.space.lg }}>
          <BrandMark size={88} />
          <AppText variant="title1" center accessibilityRole="header">
            {source && source !== 'onboarding' ? tr('paywall.titleLocked') : tr('paywall.title', { app: APP_NAME })}
          </AppText>
        </View>

        {/* Benefits: at most five, one line each, primary checks */}
        <View style={{ gap: t.space.md }}>
          {BENEFITS.map((b) => (
            <View key={b} style={{ flexDirection: 'row', gap: t.space.md, alignItems: 'center' }}>
              <Icon name="check" size="md" color={t.tokens.primary} strokeWidth={2.25} />
              <AppText variant="body" style={{ flex: 1 }}>
                {tr(`paywall.benefitsV3.${b}`)}
              </AppText>
            </View>
          ))}
        </View>

        {/* Plans: vertical radio cards */}
        {offers === null ? (
          <View style={{ padding: t.space.xl, alignItems: 'center' }}>
            <ActivityIndicator color={t.tokens.primary} />
          </View>
        ) : offers.length === 0 ? (
          <Card style={{ paddingHorizontal: t.space.gutter }}>
            <EmptyState icon="info" tone="mind" title={tr('paywall.unavailableTitle')} description={tr('paywall.unavailableBody')} action={<Button label={tr('paywall.retry')} variant="secondary" size="sm" icon="rotate" onPress={load} />} />
          </Card>
        ) : (
          <View style={{ gap: t.space.md }} accessibilityRole="radiogroup" accessibilityLabel={tr('paywall.choosePlan')}>
            {offers.map((o) => (
              <PlanCard key={o.key} offer={o} active={o.key === selected} saving={o.key === 'yearly' ? saving : null} locale={locale} onPress={() => setSelected(o.key)} />
            ))}
          </View>
        )}

        {/* Trust row */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', columnGap: t.space.xl, rowGap: t.space.sm }}>
          <Trust icon="lock" label={tr('paywall.trustLocal')} />
          <Trust icon="shieldCheck" label={tr('paywall.trustCancel')} />
        </View>
        {errorText}
      </Screen>
    </SafeAreaView>
  );
}

/** Calm geometric placeholder mark (no orange star): a soft disc, a thin ring and a leaf. */
function BrandMark({ size }: { size: number }) {
  const t = useTheme();
  const ring = size - 2 * t.space.md;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.tokens.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: ring, height: ring, borderRadius: ring / 2, borderWidth: t.border.thick, borderColor: t.tokens.border, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="leaf" size="xl" color={t.tokens.primary} />
      </View>
    </View>
  );
}

function Trust({ icon, label }: { icon: IconName; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.xs }}>
      <Icon name={icon} size="sm" color={t.tokens.mutedForeground} />
      <AppText variant="footnote" muted>
        {label}
      </AppText>
    </View>
  );
}

function LinkText({ label, onPress, role = 'link' }: { label: string; onPress: () => void; role?: 'link' | 'button' }) {
  const t = useTheme();
  return (
    <ScalePressable onPress={onPress} accessibilityRole={role} accessibilityLabel={label} style={{ minHeight: t.touch, justifyContent: 'center' }}>
      <AppText variant="footnote" muted style={{ textDecorationLine: 'underline' }}>
        {label}
      </AppText>
    </ScalePressable>
  );
}

function PlanCard({ offer: o, active, saving, locale, onPress }: { offer: Offer; active: boolean; saving: number | null; locale: string; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const k = t.tokens;
  const eq = weeklyEquivalent(o, locale);
  const name = tr(`paywall.plan.${o.key}`);
  return (
    <ScalePressable
      onPress={() => {
        if (!active) uiHaptic('selection');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${name}, ${o.displayPrice} ${tr(`paywall.per.${o.key}`)}${o.key === 'yearly' ? `, ${tr('paywall.bestValue')}` : ''}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, padding: t.space.lg, minHeight: 72, borderRadius: t.radius.lg, borderWidth: t.border.thick, borderColor: active ? k.primary : k.border, backgroundColor: active ? k.primarySoft : k.card }}
    >
      <View style={{ width: 22, height: 22, borderRadius: t.radius.pill, borderWidth: t.border.thick, borderColor: active ? k.primary : k.subtle, alignItems: 'center', justifyContent: 'center' }}>
        {active ? <View style={{ width: 10, height: 10, borderRadius: t.radius.pill, backgroundColor: k.primary }} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', gap: t.space.sm, alignItems: 'center', flexWrap: 'wrap' }}>
          <AppText variant="title3">{name}</AppText>
          {o.key === 'yearly' ? <Badge variant="highlight" label={tr('paywall.bestValue')} /> : null}
        </View>
        {o.trialDays ? (
          <AppText variant="footnote" muted>
            {tr('paywall.trialTag', { days: o.trialDays })}
          </AppText>
        ) : null}
        {eq || saving ? (
          <AppText variant="footnote" muted>
            {[eq ? tr('paywall.perWeekEq', { price: eq }) : null, saving ? tr('paywall.saving', { pct: saving }) : null].filter(Boolean).join(' · ')}
          </AppText>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <AppText variant="title3" tabular>
          {o.displayPrice}
        </AppText>
        <AppText variant="caption" muted style={{ fontWeight: '400' }}>
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
