import { router } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Icon, useTheme } from '@/components';
import { InfoToggle, SectionTitle, tint } from '@/features/campus/shared/ui';
import { CAMP_CHECKIN, CAMP_ONBOARDING as ONB, CAMP_PLANS } from './content';
import { showMedicationCard } from './engine/hsi';
import { PHASE_ORDER } from './engine/phase';
import { cutDownPlan } from './engine/plans';
import { estimatedSavings } from './engine/savings';
import { calendarDaysBetween } from '@/features/camps/core/time';
import type { CampPhase, CampProfile, Mission, PriceEntry, QuitAttempt, TriggerId } from './types';

export { MiniBars, NumberStepper } from '@/features/camps/core/ui';

/** "17 Kasım Salı" from i18n month/weekday names (no Intl dependency). */
export function useCampDate() {
  const { t: tr } = useTranslation();
  const months = tr('camp.months', { returnObjects: true }) as string[];
  const days = tr('camp.weekdays', { returnObjects: true }) as string[];
  return (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()} ${months[d.getMonth()] ?? ''} ${days[d.getDay()] ?? ''}`.trim();
  };
}

/** Thousands with a dot: 36500 → "36.500". */
export const fmtTL = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** ALO 171 card with a call button. Always free, never behind the paywall. */
export function Alo171Card({ compact }: { compact?: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Card style={{ gap: 10, borderWidth: 2, borderColor: t.colors.success, backgroundColor: tint(t.colors.success, '10') }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <AppText variant="h2">📞</AppText>
        <AppText variant="h3" style={{ flex: 1 }}>
          {ONB.alo171.title}
        </AppText>
      </View>
      {compact ? null : <AppText variant="small">{ONB.alo171.text}</AppText>}
      <Button label={tr('camp.ui.call171')} icon="bell" variant="primary" onPress={() => void Linking.openURL('tel:171')} accessibilityHint={tr('camp.ui.call171Hint')} />
      {compact ? null : (
        <AppText variant="tiny" muted>
          {ONB.alo171.save} {tr('camp.ui.lastVerified', { date: ONB.alo171.lastVerified })}
        </AppText>
      )}
    </Card>
  );
}

/** Dependence (HSI) result with the medication / under-18 note. */
export function HsiCard({ profile }: { profile: Pick<CampProfile, 'hsiScore' | 'hsiLevel' | 'ageRange'> }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const band = ONB.hsiBands[profile.hsiLevel];
  const color = profile.hsiLevel === 'low' ? t.colors.success : profile.hsiLevel === 'mid' ? t.colors.warning : t.colors.danger;
  const under18 = profile.ageRange === 'under18';
  return (
    <View style={{ gap: 10 }}>
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="h2" weight="800">
              {profile.hsiScore}
            </AppText>
            <AppText variant="tiny" muted>
              /6
            </AppText>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="tiny" weight="800" muted>
              {tr('camp.ui.hsiLabel')}
            </AppText>
            <AppText variant="h3">{band.title}</AppText>
          </View>
        </View>
        <AppText variant="small">{band.text}</AppText>
        <InfoToggle title={tr('camp.ui.hsiInfo')} text={ONB.hsiInfo} />
      </Card>
      {under18 ? (
        <Card style={{ gap: 6, borderLeftWidth: 4, borderLeftColor: t.colors.primary }}>
          <AppText weight="800">{tr('camp.ui.under18Title')}</AppText>
          <AppText variant="small">{ONB.under18}</AppText>
        </Card>
      ) : showMedicationCard(profile.hsiLevel) ? (
        <Card style={{ gap: 6, borderWidth: 2, borderColor: t.colors.primary, backgroundColor: tint(t.colors.primary, '10') }}>
          <AppText weight="800">💊 {tr('camp.ui.medTitle')}</AppText>
          <AppText variant="small">{ONB.medication}</AppText>
        </Card>
      ) : null}
    </View>
  );
}

export interface DraftPlan {
  trigger: TriggerId;
  ifText: string;
  thenText: string;
}

/** Personal plan: quit day, phases, dependence, triggers, if–then plans and estimated savings. */
export function PlanSummary({ profile, price, attempt, plans, now }: { profile: CampProfile; price: Omit<PriceEntry, 'from'>; attempt: Pick<QuitAttempt, 'plannedQuitDate' | 'actualQuitDateTime'>; plans: DraftPlan[]; now: Date }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const fmtDate = useCampDate();
  const savings = estimatedSavings(profile.perDay, { ...price, from: '' });
  const already = profile.method === 'already_quit';
  const inDays = calendarDaysBetween(now, new Date(attempt.plannedQuitDate));
  const triggers = ONB.triggers.filter((x) => profile.triggers.includes(x.id));
  return (
    <View style={{ gap: 14 }}>
      <View style={{ borderRadius: t.radius.xl, padding: 18, gap: 6, backgroundColor: t.colors.primary }}>
        <AppText variant="tiny" weight="800" color={t.colors.primaryText} style={{ letterSpacing: 1, opacity: 0.9 }}>
          {already ? tr('camp.plan.lastCig') : tr('camp.plan.quitDay')}
        </AppText>
        <AppText variant="h1" color={t.colors.primaryText}>
          {fmtDate(attempt.actualQuitDateTime ?? attempt.plannedQuitDate)}
        </AppText>
        <AppText weight="700" color={t.colors.primaryText} style={{ opacity: 0.9 }}>
          {already ? tr('camp.plan.alreadyHint') : tr('camp.plan.inDays', { count: Math.max(0, inDays) })}
        </AppText>
      </View>

      {profile.method === 'cut_down' ? (
        <Card style={{ gap: 8 }}>
          <AppText weight="800">📉 {tr('camp.plan.cutTitle')}</AppText>
          {cutDownPlan(profile.perDay, Math.round(inDays / 7)).map((w) => (
            <View key={w.week} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="small">{tr('camp.plan.cutWeek', { n: w.week })}</AppText>
              <AppText variant="small" weight="800">
                {tr('camp.plan.cutPerDay', { count: w.perDay })}
              </AppText>
            </View>
          ))}
          <AppText variant="tiny" muted>
            {tr('camp.plan.cutNote')}
          </AppText>
        </Card>
      ) : null}

      <SectionTitle emoji="🗺️" title={tr('camp.plan.phasesTitle')} />
      <View style={{ gap: 0 }}>
        {ONB.phases.map((p, i) => (
          <View key={p.id} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center', width: 32 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: tint(t.colors.primary, '22'), alignItems: 'center', justifyContent: 'center' }}>
                <AppText>{p.emoji}</AppText>
              </View>
              {i < ONB.phases.length - 1 ? <View style={{ width: 2, flex: 1, minHeight: 14, backgroundColor: t.colors.border }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 12, gap: 2 }}>
              <AppText weight="800">{p.title}</AppText>
              <AppText variant="small" muted>
                {p.text}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      <SectionTitle emoji="🧪" title={tr('camp.plan.hsiTitle')} />
      <HsiCard profile={profile} />

      <SectionTitle emoji="⚡" title={tr('camp.plan.triggersTitle')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {triggers.map((x) => (
          <View key={x.id} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: t.radius.pill, backgroundColor: tint(t.colors.warning, '1F') }}>
            <AppText>{x.emoji}</AppText>
            <AppText variant="small" weight="700">
              {x.label}
            </AppText>
          </View>
        ))}
      </View>

      {plans.length ? (
        <>
          <SectionTitle emoji="🧩" title={tr('camp.plan.plansTitle')} />
          <View style={{ gap: 8 }}>
            {plans.map((p) => (
              <Card key={p.trigger} style={{ gap: 4, borderLeftWidth: 4, borderLeftColor: t.colors.accent }}>
                <AppText variant="small" weight="800" color={t.colors.accent}>
                  {tr('camp.plan.if')} {p.ifText}…
                </AppText>
                <AppText variant="small">
                  {tr('camp.plan.then')} {p.thenText}.
                </AppText>
              </Card>
            ))}
          </View>
          <InfoToggle title={tr('camp.plan.plansInfo')} text={CAMP_PLANS.info} />
        </>
      ) : null}

      <SectionTitle emoji="💰" title={tr('camp.plan.savingsTitle')} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          [tr('camp.plan.month'), savings.month],
          [tr('camp.plan.year'), savings.year],
        ].map(([label, v]) => (
          <Card key={String(label)} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <AppText variant="h2" color={t.colors.success} numberOfLines={1} adjustsFontSizeToFit>
              {tr('camp.plan.tl', { amount: fmtTL(Number(v)) })}
            </AppText>
            <AppText variant="tiny" muted>
              {label}
            </AppText>
          </Card>
        ))}
      </View>
      <AppText variant="tiny" muted>
        {tr('camp.plan.savingsNote')}
      </AppText>

      <Alo171Card />
    </View>
  );
}

/** Six-phase progress line; the current phase is highlighted, earlier ones checked. */
export function PhaseTrack({ phase }: { phase: CampPhase }) {
  const t = useTheme();
  const idx = PHASE_ORDER.indexOf(phase);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} accessible accessibilityLabel={ONB.phases.map((p, i) => `${p.title}${i === idx ? ' ✓' : ''}`).join(', ')}>
      {ONB.phases.map((p, i) => {
        const done = i < idx;
        const cur = i === idx;
        return (
          <View key={p.id} style={{ flex: i === 0 ? 0 : 1, flexDirection: 'row', alignItems: 'center' }}>
            {i > 0 ? <View style={{ flex: 1, height: 3, backgroundColor: i <= idx ? t.colors.success : t.colors.border }} /> : null}
            <View
              style={{
                width: cur ? 38 : 28,
                height: cur ? 38 : 28,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: done ? t.colors.success : cur ? t.colors.primary : t.colors.surfaceAlt,
                borderWidth: cur ? 3 : 0,
                borderColor: tint(t.colors.primary, '55'),
              }}
            >
              {done ? <Icon name="check" color="#FFFFFF" size={14} strokeWidth={3} /> : <AppText variant={cur ? 'body' : 'tiny'}>{p.emoji}</AppText>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** One of the three mini cards under the counter. */
export function StatTile({ emoji, value, label, onPress, color }: { emoji: string; value: string; label: string; onPress?: () => void; color?: string }) {
  const t = useTheme();
  const body = (
    <>
      <AppText>{emoji}</AppText>
      <AppText variant="h3" weight="800" color={color ?? t.colors.text} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="tiny" muted numberOfLines={2}>
        {label}
      </AppText>
    </>
  );
  const style = { flex: 1, gap: 2, padding: 12, borderRadius: t.radius.lg, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: onPress ? tint(t.colors.primary, '55') : t.colors.border };
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} style={style}>
      {body}
    </Pressable>
  ) : (
    <View style={style} accessible accessibilityLabel={`${label}: ${value}`}>
      {body}
    </View>
  );
}

/** 24 bars, one per hour of the day; the riskiest hours are highlighted. */
export function HourChart({ hours, top }: { hours: number[]; top: number[] }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const max = Math.max(1, ...hours);
  return (
    <View style={{ gap: 4 }} accessible accessibilityLabel={tr('camp.diary.chartA11y', { hours: top.map((h) => `${h}:00`).join(', ') })}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 2 }}>
        {hours.map((n, h) => (
          <View key={h} style={{ flex: 1, height: Math.max(n ? 6 : 2, (n / max) * 90), borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: top.includes(h) ? t.colors.accent : n ? tint(t.colors.primary, '88') : t.colors.surfaceAlt }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[0, 6, 12, 18, 23].map((h) => (
          <AppText key={h} variant="tiny" muted>
            {String(h).padStart(2, '0')}
          </AppText>
        ))}
      </View>
    </View>
  );
}

/** Gentle support card after 3 "very bad" mood days in a row: doctor / ALO 171, and 112 in an emergency. */
export function SafetyCard() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Card style={{ gap: 10, borderWidth: 2, borderColor: t.colors.primary, backgroundColor: tint(t.colors.primary, '10') }} accessibilityLiveRegion="polite">
      <AppText weight="800">💙 {CAMP_CHECKIN.safety.title}</AppText>
      <AppText variant="small">{CAMP_CHECKIN.safety.text}</AppText>
      <Button label={tr('camp.ui.call171')} icon="bell" variant="primary" onPress={() => void Linking.openURL('tel:171')} />
    </Card>
  );
}

/** Today's mission: kicker with minutes and type, title, text and a "done" button. */
export function MissionCard({ mission, done, onDone }: { mission: Mission; done: boolean; onDone: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Card style={{ gap: 8, borderWidth: 2, borderColor: done ? t.colors.success : t.colors.accent, backgroundColor: done ? tint(t.colors.success, '10') : t.colors.surface }}>
      <AppText variant="tiny" weight="800" color={done ? t.colors.success : t.colors.accent} style={{ letterSpacing: 0.5 }}>
        {tr('camp.mission.kicker', { min: mission.durationMin, type: tr(`camp.mission.type.${mission.type}`) })}
      </AppText>
      <AppText variant="h3">{mission.title}</AppText>
      <AppText variant="small">{mission.body}</AppText>
      {done ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="check" color={t.colors.success} size={18} strokeWidth={3} />
          <AppText weight="800" color={t.colors.success}>
            {tr('camp.mission.done')}
          </AppText>
        </View>
      ) : (
        <Button label={tr('camp.mission.complete')} icon="check" variant="accent" onPress={onDone} />
      )}
    </Card>
  );
}

/** A premium part of the camp: short explanation and a button to the paywall. */
export function PremiumLock({ title, text }: { title: string; text?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Card style={{ gap: 8, borderWidth: 1.5, borderColor: tint(t.colors.accent, '88'), backgroundColor: tint(t.colors.accent, '0D') }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="lock" color={t.colors.accent} size={18} />
        <AppText weight="800" style={{ flex: 1 }}>
          {title}
        </AppText>
      </View>
      <AppText variant="small" muted>
        {text ?? tr('camp.premium.text')}
      </AppText>
      <Button label={tr('camp.premium.unlock')} icon="star" variant="accent" onPress={() => router.push({ pathname: '/paywall', params: { source: 'camp' } })} />
    </Card>
  );
}
