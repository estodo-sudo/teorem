import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, ProgressBar, Screen, useTheme } from '@/components';
import { CAMP_ONBOARDING as ONB, CAMP_PLANS } from '@/features/camps/smoking/content';
import {
  ALREADY_QUIT_MAX_DAYS,
  buildProfile,
  CUT_WEEKS,
  defaultAnswers,
  hasDailyProduct,
  hasHookah,
  HOOKAH_WEEK_MAX,
  parsePriceTRY,
  PER_DAY_MAX,
  PER_DAY_MIN,
  planTriggers,
  quitPlan,
  stepError,
  type Answers,
  type StepId,
} from '@/features/camps/smoking/onboarding';
import { deleteReasonPhoto, pickReasonPhoto, saveAlo171Contact, type SaveContactResult } from '@/features/camps/smoking/device';
import { MAX_PREP_DAYS, MIN_PREP_DAYS } from '@/features/camps/smoking/state';
import { Alo171Card, HsiCard, NumberStepper, PlanSummary, useCampDate, type DraftPlan } from '@/features/camps/smoking/ui';
import type { TriggerId } from '@/features/camps/smoking/types';
import { CommitmentView, useCommitGate } from '@/features/campus/shared/commit';
import { InfoToggle, tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampStore } from '@/stores/campStore';

/** One question per screen: the 10 assessment questions, the dependence result, first plans, summary and commitment. */
type Step = StepId | 'hsi' | 'plans' | 'summary' | 'commit';
const STEPS: Step[] = ['products', 'amount', 'firstCig', 'hsi', 'years', 'price', 'reasons', 'triggers', 'attempts', 'method', 'support', 'plans', 'summary', 'commit'];
/** Numbered assessment questions (1–10), for the "Soru n/10" label. */
const QUESTIONS: Step[] = ['products', 'amount', 'firstCig', 'years', 'price', 'reasons', 'triggers', 'attempts', 'method', 'support'];

type PlanChoice = { pick: number | 'custom'; text: string };

export default function CampOnboarding() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const fmtDate = useCampDate();
  const [now] = useState(() => new Date());
  const [idx, setIdx] = useState(0);
  const [a, setA] = useState<Answers>(defaultAnswers);
  const [choices, setChoices] = useState<Partial<Record<TriggerId, PlanChoice>>>({});
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<SaveContactResult | null>(null);
  const step = STEPS[idx]!;
  const commitLeft = useCommitGate(step === 'commit');
  const locked = step === 'commit' && commitLeft > 0;
  const isLast = idx === STEPS.length - 1;
  const set = (patch: Partial<Answers>) => {
    setError(null);
    setA((x) => ({ ...x, ...patch }));
  };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const profile = buildProfile(a, now);
  const plan = quitPlan(a, now);
  const price = { packPriceTRY: parsePriceTRY(a.priceText) ?? 0, packSize: a.packSize };
  const order = ONB.triggers.map((x) => x.id);
  const draftPlans: DraftPlan[] = planTriggers(a.triggers, order).map((trig) => {
    const tpl = CAMP_PLANS.templates[trig];
    const c = choices[trig] ?? { pick: 0, text: '' };
    const thenText = c.pick === 'custom' ? c.text.trim() : (tpl.then[c.pick] ?? tpl.then[0]!);
    return { trigger: trig, ifText: tpl.if, thenText };
  });

  const next = () => {
    const err = (QUESTIONS as string[]).includes(step) ? stepError(step as StepId, a) : null;
    if (err) {
      setError(tr(`camp.onb.err.${err}`));
      return;
    }
    if (step === 'plans' && draftPlans.some((p) => !p.thenText)) {
      setError(tr('camp.onb.err.plan'));
      return;
    }
    setError(null);
    if (isLast) {
      const st = useCampStore.getState();
      st.enrol(profile, price, plan);
      draftPlans.forEach((p) => useCampStore.getState().addPlan(p));
      router.replace('/camp');
      return;
    }
    setIdx((i) => i + 1);
  };
  const back = () => {
    setError(null);
    if (idx === 0) goBack('/discover');
    else setIdx((i) => i - 1);
  };

  const qNo = QUESTIONS.indexOf(step);
  const nextLabel = isLast ? tr('camp.onb.enrol') : step === 'summary' ? tr('camp.onb.toCommit') : tr('common.next');
  const title = (key: string) => (
    <View style={{ gap: 4 }}>
      {qNo >= 0 ? (
        <AppText variant="tiny" weight="800" color={t.colors.primary}>
          {tr('camp.onb.question', { n: qNo + 1, total: QUESTIONS.length })}
        </AppText>
      ) : null}
      <AppText variant="h2" accessibilityRole="header">
        {tr(`camp.onb.${key}.title`)}
      </AppText>
      {tr(`camp.onb.${key}.hint`, { defaultValue: '' }) ? <AppText muted>{tr(`camp.onb.${key}.hint`)}</AppText> : null}
    </View>
  );
  const input = (value: string, onChange: (v: string) => void, label: string, extra: object = {}) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      accessibilityLabel={label}
      placeholder={label}
      placeholderTextColor={t.colors.textMuted}
      style={{ minHeight: 52, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, paddingHorizontal: 14, color: t.colors.text, fontSize: 18 }}
      {...extra}
    />
  );

  return (
    <Screen footer={<Button label={locked ? tr('campusCommit.wait', { count: commitLeft }) : nextLabel} size="lg" variant={isLast ? 'accent' : 'primary'} disabled={locked} onPress={next} />}>
      <Header title={tr('camp.title')} onBack={back} />
      <ProgressBar value={(idx + 1) / STEPS.length} height={6} accessibilityLabel={tr('camp.onb.progress', { n: idx + 1, total: STEPS.length })} />

      {step === 'products' ? (
        <>
          {title('products')}
          <View style={{ gap: 10 }}>
            {ONB.products.map((p) => (
              <ChoiceCard key={p.id} multi emoji={p.emoji} label={p.label} selected={a.products.includes(p.id)} onPress={() => set({ products: toggle(a.products, p.id) })} />
            ))}
          </View>
          <AppText variant="small" muted>
            {tr('camp.onb.products.note')}
          </AppText>
        </>
      ) : null}

      {step === 'amount' ? (
        <>
          {title('amount')}
          {hasDailyProduct(a.products) || !hasHookah(a.products) ? (
            <Card style={{ gap: 10 }}>
              <AppText weight="800" center>
                {tr('camp.onb.amount.perDay')}
              </AppText>
              <NumberStepper label={tr('camp.onb.amount.perDay')} value={a.perDay} onChange={(v) => set({ perDay: v })} min={PER_DAY_MIN} max={PER_DAY_MAX} unit={tr('camp.onb.amount.unit')} quick={[5, 10, 15, 20, 30, 40]} />
            </Card>
          ) : null}
          {hasHookah(a.products) ? (
            <Card style={{ gap: 10 }}>
              <AppText weight="800" center>
                {tr('camp.onb.amount.hookah')}
              </AppText>
              <NumberStepper label={tr('camp.onb.amount.hookah')} value={a.hookahPerWeek} onChange={(v) => set({ hookahPerWeek: v })} min={1} max={HOOKAH_WEEK_MAX} unit={tr('camp.onb.amount.hookahUnit')} quick={[1, 2, 3, 5, 7, 14]} />
            </Card>
          ) : null}
        </>
      ) : null}

      {step === 'firstCig' ? (
        <>
          {title('firstCig')}
          <View style={{ gap: 10 }}>
            {ONB.firstCig.map((o) => (
              <ChoiceCard key={o.value} label={o.label} selected={a.firstCig === o.value} onPress={() => set({ firstCig: o.value })} />
            ))}
          </View>
        </>
      ) : null}

      {step === 'hsi' ? (
        <>
          {title('hsi')}
          <HsiCard profile={profile} />
          <AppText variant="small" muted>
            {tr('camp.onb.hsi.nonJudge')}
          </AppText>
        </>
      ) : null}

      {step === 'years' ? (
        <>
          {title('years')}
          <Card>
            <NumberStepper label={tr('camp.onb.years.title')} value={a.years} onChange={(v) => set({ years: v })} min={0} max={70} unit={tr('camp.onb.years.unit')} quick={[1, 3, 5, 10, 15, 20, 30]} />
          </Card>
          <AppText variant="small" muted>
            {tr('camp.onb.years.note')}
          </AppText>
        </>
      ) : null}

      {step === 'price' ? (
        <>
          {title('price')}
          <View style={{ gap: 6 }}>
            <AppText weight="800">{tr('camp.onb.price.priceLabel')}</AppText>
            {input(a.priceText, (v) => set({ priceText: v.replace(/[^0-9.,]/g, '') }), tr('camp.onb.price.placeholder'), { keyboardType: 'decimal-pad', maxLength: 9 })}
          </View>
          <Card style={{ gap: 10 }}>
            <AppText weight="800" center>
              {tr('camp.onb.price.packSize')}
            </AppText>
            <NumberStepper label={tr('camp.onb.price.packSize')} value={a.packSize} onChange={(v) => set({ packSize: v })} min={1} max={50} unit={tr('camp.onb.price.packUnit')} quick={[10, 20, 25]} />
          </Card>
          <AppText variant="small" muted>
            {tr('camp.onb.price.note')}
          </AppText>
        </>
      ) : null}

      {step === 'reasons' ? (
        <>
          {title('reasons')}
          <View style={{ gap: 10 }}>
            {ONB.reasons.map((r) => (
              <ChoiceCard key={r.id} multi emoji={r.emoji} label={r.label} selected={a.reasonIds.includes(r.id)} onPress={() => set({ reasonIds: toggle(a.reasonIds, r.id) })} />
            ))}
          </View>
          <View style={{ gap: 6 }}>
            <AppText weight="800">{tr('camp.onb.reasons.ownLabel')}</AppText>
            {input(a.customReason, (v) => set({ customReason: v }), tr('camp.onb.reasons.ownPlaceholder'), { maxLength: 200, multiline: true })}
            <AppText variant="tiny" muted>
              {tr('camp.onb.reasons.private')}
            </AppText>
          </View>
          <View style={{ gap: 8 }}>
            <AppText weight="800">{tr('camp.onb.reasons.photoLabel')}</AppText>
            {a.reasonPhotoUri ? <Image source={{ uri: a.reasonPhotoUri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: t.radius.lg }} accessibilityLabel={tr('camp.onb.reasons.photoAlt')} /> : null}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                label={a.reasonPhotoUri ? tr('camp.onb.reasons.photoChange') : tr('camp.onb.reasons.photoAdd')}
                icon="plus"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={async () => {
                  const uri = await pickReasonPhoto();
                  if (!uri) return;
                  deleteReasonPhoto(a.reasonPhotoUri);
                  set({ reasonPhotoUri: uri });
                }}
              />
              {a.reasonPhotoUri ? (
                <Button
                  label={tr('camp.onb.reasons.photoRemove')}
                  icon="trash"
                  variant="ghost"
                  onPress={() => {
                    deleteReasonPhoto(a.reasonPhotoUri);
                    set({ reasonPhotoUri: undefined });
                  }}
                />
              ) : null}
            </View>
            <AppText variant="tiny" muted>
              {tr('camp.onb.reasons.photoNote')}
            </AppText>
          </View>
        </>
      ) : null}

      {step === 'triggers' ? (
        <>
          {title('triggers')}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {ONB.triggers.map((x) => {
              const selected = a.triggers.includes(x.id);
              return (
                <Pressable
                  key={x.id}
                  onPress={() => set({ triggers: toggle(a.triggers, x.id) })}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={x.label}
                  style={{
                    width: '47%',
                    flexGrow: 1,
                    minHeight: 64,
                    padding: 12,
                    gap: 4,
                    borderRadius: t.radius.lg,
                    borderWidth: 2,
                    borderColor: selected ? t.colors.accent : t.colors.border,
                    backgroundColor: selected ? tint(t.colors.accent, '14') : t.colors.surface,
                  }}
                >
                  <AppText variant="h3">{x.emoji}</AppText>
                  <AppText variant="small" weight="700">
                    {x.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {step === 'attempts' ? (
        <>
          {title('attempts')}
          <View style={{ gap: 10 }}>
            {ONB.pastAttempts.map((o) => (
              <ChoiceCard key={o.value} label={o.label} selected={a.pastAttempts === o.value} onPress={() => set({ pastAttempts: o.value })} />
            ))}
          </View>
          {a.pastAttempts ? (
            <>
              <AppText weight="800">{tr('camp.onb.attempts.why')}</AppText>
              <View style={{ gap: 8 }}>
                {ONB.relapseCauses.map((r) => (
                  <ChoiceCard key={r.id} multi emoji={r.emoji} label={r.label} selected={a.relapseCauses.includes(r.id)} onPress={() => set({ relapseCauses: toggle(a.relapseCauses, r.id) })} />
                ))}
              </View>
              <AppText variant="small" muted>
                {ONB.relapseNote}
              </AppText>
            </>
          ) : null}
        </>
      ) : null}

      {step === 'method' ? (
        <>
          {title('method')}
          <View style={{ gap: 10 }}>
            {ONB.methods.map((m) => (
              <ChoiceCard key={m.id} emoji={m.emoji} label={m.recommended ? `${m.label} · ${tr('camp.onb.method.recommended')}` : m.label} description={m.desc} selected={a.method === m.id} onPress={() => set({ method: m.id })} />
            ))}
          </View>
          <Card style={{ gap: 10 }}>
            {a.method === 'quit_day' ? (
              <>
                <AppText weight="800" center>
                  {tr('camp.onb.method.inDays')}
                </AppText>
                <NumberStepper label={tr('camp.onb.method.inDays')} value={a.quitInDays} onChange={(v) => set({ quitInDays: v })} min={MIN_PREP_DAYS} max={MAX_PREP_DAYS} unit={tr('camp.onb.method.daysUnit')} quick={[3, 5, 7, 10, 14]} />
              </>
            ) : a.method === 'cut_down' ? (
              <>
                <AppText weight="800" center>
                  {tr('camp.onb.method.weeks')}
                </AppText>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CUT_WEEKS.map((w) => (
                    <View key={w} style={{ flex: 1 }}>
                      <ChoiceCard label={tr('camp.onb.method.weeksN', { count: w })} selected={a.cutWeeks === w} onPress={() => set({ cutWeeks: w })} />
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <>
                <AppText weight="800" center>
                  {tr('camp.onb.method.daysAgo')}
                </AppText>
                <NumberStepper label={tr('camp.onb.method.daysAgo')} value={a.quitDaysAgo} onChange={(v) => set({ quitDaysAgo: v })} min={0} max={ALREADY_QUIT_MAX_DAYS} unit={tr('camp.onb.method.daysAgoUnit')} quick={[0, 1, 2, 3, 7, 14, 30]} />
              </>
            )}
            <View style={{ padding: 12, borderRadius: t.radius.md, backgroundColor: tint(t.colors.primary, '14') }}>
              <AppText variant="small" weight="700" center>
                {a.method === 'already_quit' ? tr('camp.onb.method.lastCigOn', { date: fmtDate(plan.plannedQuitDate) }) : tr('camp.onb.method.quitOn', { date: fmtDate(plan.plannedQuitDate) })}
              </AppText>
            </View>
          </Card>
        </>
      ) : null}

      {step === 'support' ? (
        <>
          {title('support')}
          <View style={{ gap: 6 }}>
            <AppText weight="800">{tr('camp.onb.support.supporter')}</AppText>
            {input(a.supporterName, (v) => set({ supporterName: v }), tr('camp.onb.support.supporterPlaceholder'), { maxLength: 40 })}
            <AppText variant="tiny" muted>
              {tr('camp.onb.support.supporterNote')}
            </AppText>
          </View>
          <Alo171Card />
          <Button
            label={contact === 'saved' ? tr('camp.onb.support.contactSaved') : tr('camp.onb.support.saveContact')}
            icon={contact === 'saved' ? 'check' : 'user'}
            variant="secondary"
            disabled={contact === 'saved'}
            onPress={async () => setContact(await saveAlo171Contact(tr('camp.onb.support.contactName')))}
          />
          {contact === 'unavailable' ? (
            <AppText variant="small" muted accessibilityLiveRegion="polite">
              {tr('camp.onb.support.contactUnavailable')}
            </AppText>
          ) : null}
          <AppText weight="800">{tr('camp.onb.support.age')}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ONB.ageRanges.map((r) => {
              const selected = a.ageRange === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => set({ ageRange: r.id })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={{
                    minHeight: 48,
                    paddingHorizontal: 16,
                    borderRadius: t.radius.pill,
                    borderWidth: 2,
                    borderColor: selected ? t.colors.primary : t.colors.border,
                    backgroundColor: selected ? t.colors.primary : t.colors.surface,
                    justifyContent: 'center',
                  }}
                >
                  <AppText weight="700" color={selected ? t.colors.primaryText : t.colors.text}>
                    {r.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {a.ageRange === 'under18' ? (
            <Card style={{ gap: 4, borderLeftWidth: 4, borderLeftColor: t.colors.primary }}>
              <AppText variant="small">{ONB.under18}</AppText>
            </Card>
          ) : null}
        </>
      ) : null}

      {step === 'plans' ? (
        <>
          {title('plans')}
          <InfoToggle title={tr('camp.plan.plansInfo')} text={CAMP_PLANS.info} />
          {draftPlans.map((p) => {
            const tpl = CAMP_PLANS.templates[p.trigger];
            const c = choices[p.trigger] ?? { pick: 0, text: '' };
            const trig = ONB.triggers.find((x) => x.id === p.trigger)!;
            const choose = (pick: PlanChoice['pick']) => {
              setError(null);
              setChoices((x) => ({ ...x, [p.trigger]: { ...c, pick } }));
            };
            return (
              <Card key={p.trigger} style={{ gap: 10 }}>
                <AppText weight="800" color={t.colors.accent}>
                  {trig.emoji} {tr('camp.plan.if')} {tpl.if}…
                </AppText>
                <AppText variant="small" weight="700" muted>
                  {tr('camp.plan.then')}
                </AppText>
                <View style={{ gap: 8 }}>
                  {tpl.then.map((th, i) => (
                    <ChoiceCard key={th} label={th} selected={c.pick === i} onPress={() => choose(i)} />
                  ))}
                  <ChoiceCard label={tr('camp.onb.plans.own')} selected={c.pick === 'custom'} onPress={() => choose('custom')} />
                </View>
                {c.pick === 'custom'
                  ? input(
                      c.text,
                      (v) => {
                        setError(null);
                        setChoices((x) => ({ ...x, [p.trigger]: { pick: 'custom', text: v } }));
                      },
                      tr('camp.onb.plans.ownPlaceholder'),
                      { maxLength: 120 },
                    )
                  : null}
              </Card>
            );
          })}
        </>
      ) : null}

      {step === 'summary' ? (
        <>
          {title('summary')}
          <PlanSummary profile={profile} price={price} attempt={{ plannedQuitDate: plan.plannedQuitDate, actualQuitDateTime: plan.quitAt }} plans={draftPlans} now={now} />
        </>
      ) : null}

      {step === 'commit' ? <CommitmentView /> : null}

      {error ? (
        <AppText variant="small" color={t.colors.danger} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </Screen>
  );
}
