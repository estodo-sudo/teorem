import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, Icon, ProgressBar, Screen, SwitchRow, useTheme } from '@/components';
import { NumberStepper } from '@/features/camps/core/ui';
import { ODAK_ONBOARDING as ONB, ODAK_PLANS } from '@/features/camps/odak/content';
import { bpsScore, onboardingReferral, twoItemScore } from '@/features/camps/odak/engine/screening';
import {
  buildGoal,
  buildPlans,
  buildProfile,
  buildScreenings,
  defaultAnswers,
  FREQ_MAX,
  MAST_WEEKLY,
  PAUSE_DAYS,
  PAUSE_PRESETS,
  planTriggers,
  PORN_WEEKLY,
  QUESTIONS,
  REASON_OTHER_MAX,
  SKIPPABLE,
  STEPS,
  stepError,
  toggleRange,
  VALUES_TEXT_MAX,
  type Answers,
} from '@/features/camps/odak/onboarding';
import { deviceSecured, hasPin, savePin } from '@/features/camps/odak/privacy/device';
import { useOdakLockStore } from '@/features/camps/odak/privacy/lockStore';
import { PinPad } from '@/features/camps/odak/privacy/PinPad';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import type { OdakTriggerId, Score5 } from '@/features/camps/odak/types';
import { ExpertCard, PillGroup, ScaleRow } from '@/features/camps/odak/ui';
import { CommitmentView, useCommitGate } from '@/features/campus/shared/commit';
import { goBack } from '@/lib/nav';
import { IconTile } from '@/components/ui';
import i18n from '@/i18n';
import { localeOf } from '@/i18n/languages';

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const setAt = <T,>(arr: T[], i: number, v: T) => arr.map((x, j) => (j === i ? v : x));

/** Odak Kampı enrolment: 18+ gate, "Bilmen gerekenler", camp lock, 11 questions, first plans, summary, commitment. */
export default function OdakOnboarding() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [now] = useState(() => new Date());
  const [idx, setIdx] = useState(0);
  const [minor, setMinor] = useState(false);
  const [a, setA] = useState<Answers>(defaultAnswers);
  const [picks, setPicks] = useState<Partial<Record<OdakTriggerId, number>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Camp lock step.
  const lockEnabled = useOdakLockStore((s) => s.enabled);
  const [secured, setSecured] = useState<boolean | null>(null);
  const [pinReady, setPinReady] = useState(false);
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setSecured(await deviceSecured());
      setPinReady(await hasPin());
    })();
  }, []);

  const step = STEPS[idx]!;
  const commitLeft = useCommitGate(step === 'commit');
  const locked = step === 'commit' && commitLeft > 0;
  const isLast = idx === STEPS.length - 1;
  const set = (patch: Partial<Answers>) => {
    setError(null);
    setA((x) => ({ ...x, ...patch }));
  };

  const order = ONB.triggers.options.map((o) => o.id);
  const drafts = planTriggers(a.triggers, order).map((trigger) => {
    const tpl = ODAK_PLANS.templates[trigger];
    return { trigger, ifText: tpl.if, thenText: tpl.then[picks[trigger] ?? 0] ?? tpl.then[0]! };
  });
  const bps = bpsScore(a.bps);
  const phq = twoItemScore(a.phq);
  const gad = twoItemScore(a.gad);
  const referral = onboardingReferral(bps, phq, gad);

  const next = async () => {
    const err = step === 'lock' ? (lockEnabled && secured === false && !pinReady ? 'lockPin' : null) : stepError(step, a, { bpsPlaceholder: ONB.bps.placeholder });
    if (err) {
      setError(tr(`odak.onb.err.${err}`));
      return;
    }
    setError(null);
    if (step === 'age' && a.adult === false) {
      setMinor(true);
      return;
    }
    if (isLast) {
      if (saving) return;
      setSaving(true);
      await useOdakStore.getState().enrol({ profile: buildProfile(a, now), goal: buildGoal(a, now), plans: buildPlans(drafts, now), screenings: buildScreenings(a, now) });
      // The lock was just set up: the camp opens unlocked this time.
      useOdakLockStore.getState().unlock();
      router.replace('/odak');
      return;
    }
    setIdx((i) => i + 1);
  };
  const back = () => {
    setError(null);
    if (minor) setMinor(false);
    else if (idx === 0) goBack('/discover');
    else setIdx((i) => i - 1);
  };
  const skip = () => {
    setError(null);
    setIdx((i) => i + 1);
  };

  const onPin = async (pin: string) => {
    if (firstPin === null) {
      setFirstPin(pin);
      setPinError(null);
      return;
    }
    if (pin !== firstPin) {
      setFirstPin(null);
      setPinError(tr('odak.lock.pinMismatch'));
      return;
    }
    await savePin(pin);
    setPinReady(true);
    setError(null);
  };

  if (minor) {
    const u = ONB.under18;
    return (
      <Screen footer={<Button label={tr('odak.onb.home')} size="lg" onPress={() => router.replace('/')} />}>
        <Header title={tr('odak.title')} onBack={back} />
        <AppText variant="h2" accessibilityRole="header">
          {u.title}
        </AppText>
        {u.body.map((p) => (
          <AppText key={p}>{p}</AppText>
        ))}
        {u.help.map((h) => (
          <Card key={h.id} style={{ gap: 6 }}>
            <AppText variant="h3">
              {h.title}
            </AppText>
            <AppText variant="small">{h.text}</AppText>
            {h.phone ? <Button label={tr('odak.onb.call', { phone: h.phone })} variant="secondary" icon="bell" onPress={() => void Linking.openURL(`tel:${h.phone}`)} /> : null}
            {h.lastVerified ? (
              <AppText variant="tiny" muted>
                {tr('camp.ui.lastVerified', { date: h.lastVerified })}
              </AppText>
            ) : null}
          </Card>
        ))}
        <AppText variant="small" weight="700">
          {u.emergency}
        </AppText>
      </Screen>
    );
  }

  const qNo = QUESTIONS.indexOf(step);
  const optional = SKIPPABLE.includes(step);
  const nextLabel = isLast ? tr('odak.onb.enrol') : step === 'summary' ? tr('odak.onb.toCommit') : tr('odak.onb.next');
  const title = (text: string, hint?: string) => (
    <View style={{ gap: t.space.xs }}>
      {qNo >= 0 ? (
        <AppText variant="tiny" weight="800" color={t.colors.primary}>
          {tr('odak.onb.question', { n: qNo + 1, total: QUESTIONS.length })}
          {optional ? ` · ${tr('odak.onb.optional')}` : ''}
        </AppText>
      ) : null}
      <AppText variant="h2" accessibilityRole="header">
        {text}
      </AppText>
      {hint ? <AppText muted>{hint}</AppText> : null}
    </View>
  );
  const input = (value: string, onChange: (v: string) => void, placeholder: string, maxLength: number) => (
    <TextInput maxFontSizeMultiplier={1.3}
      value={value}
      onChangeText={onChange}
      accessibilityLabel={placeholder}
      placeholder={placeholder}
      placeholderTextColor={t.colors.textMuted}
      maxLength={maxLength}
      multiline
      style={{ minHeight: 64, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, padding: 14, color: t.colors.text, fontSize: t.type.body.fontSize, textAlignVertical: 'top' }}
    />
  );
  const goalLabel = (kind: 'porn' | 'mast', id: string, n?: number) => (ONB.summary.goalLabels[kind][id] ?? '').replace('{n}', String(n ?? ''));

  return (
    <Screen
      footer={
        <View style={{ gap: 6 }}>
          <Button label={locked ? tr('campusCommit.wait', { count: commitLeft }) : nextLabel} size="lg" variant={isLast ? 'accent' : 'primary'} disabled={locked || saving} loading={saving} onPress={() => void next()} />
          {optional ? <Button label={tr('odak.onb.skip')} variant="ghost" onPress={skip} /> : null}
        </View>
      }
    >
      <Header title={tr('odak.title')} onBack={back} right={<QuickExitButton />} />
      <ProgressBar value={(idx + 1) / STEPS.length} height={6} accessibilityLabel={tr('odak.onb.progress', { n: idx + 1, total: STEPS.length })} />

      {step === 'age' ? (
        <>
          {title(ONB.age.title, ONB.age.hint)}
          <View style={{ gap: 10 }}>
            <ChoiceCard label={ONB.age.adult} selected={a.adult === true} onPress={() => set({ adult: true })} />
            <ChoiceCard label={ONB.age.minor} selected={a.adult === false} onPress={() => set({ adult: false })} />
          </View>
        </>
      ) : null}

      {step === 'facts' ? (
        <>
          {title(ONB.facts.title)}
          {ONB.facts.items.map((f) => (
            <Card key={f.text} style={{ flexDirection: 'row', gap: t.space.md, alignItems: 'flex-start' }}>
              <IconTile icon={f.icon} tone="focus" />
              <AppText style={{ flex: 1 }}>{f.text}</AppText>
            </Card>
          ))}
        </>
      ) : null}

      {step === 'lock' ? (
        <>
          {title(ONB.lock.title, ONB.lock.body)}
          <SwitchRow label={tr('odak.privacy.lock')} value={lockEnabled} onChange={(v) => useOdakLockStore.getState().setEnabled(v)} />
          {!lockEnabled ? (
            <AppText variant="small" muted>
              {tr('odak.onb.lockOff')}
            </AppText>
          ) : secured === null ? null : secured ? (
            <Card>
              <AppText variant="small">{tr('odak.onb.lockDevice')}</AppText>
            </Card>
          ) : pinReady ? (
            <Card>
              <AppText variant="small" weight="700" color={t.colors.success}>
                ✓ {tr('odak.onb.lockPinReady')}
              </AppText>
            </Card>
          ) : (
            <Card>
              <PinPad
                title={firstPin === null ? tr('odak.lock.setupTitle') : tr('odak.lock.setupConfirm')}
                hint={firstPin === null ? tr('odak.onb.pinSetup') : tr('odak.lock.setupConfirmHint')}
                error={pinError}
                submitLabel={firstPin === null ? tr('common.continue') : tr('odak.lock.setupSave')}
                onSubmit={(p) => void onPin(p)}
              />
            </Card>
          )}
        </>
      ) : null}

      {step === 'reasons' ? (
        <>
          {title(ONB.reasons.title, ONB.reasons.hint)}
          <View style={{ gap: 10 }}>
            {ONB.reasons.options.map((o) => (
              <ChoiceCard key={o.id} multi icon={o.icon} label={o.label} selected={a.reasons.includes(o.id as Answers['reasons'][number])} onPress={() => set({ reasons: toggle(a.reasons, o.id as Answers['reasons'][number]) })} />
            ))}
          </View>
          {a.reasons.includes('other') ? input(a.reasonOther, (v) => set({ reasonOther: v }), ONB.reasons.otherPlaceholder, REASON_OTHER_MAX) : null}
        </>
      ) : null}

      {step === 'bps' ? (
        <>
          {title(ONB.bps.title, ONB.bps.hint)}
          {ONB.bps.placeholder ? (
            <Card style={{ backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
              <AppText variant="small">{ONB.bps.placeholderNote}</AppText>
            </Card>
          ) : null}
          {ONB.bps.items.map((item, i) => (
            <ScaleRow key={item} label={`${i + 1}. ${item}`} options={ONB.bps.options} value={a.bps[i] ?? null} onChange={(v) => set({ bps: setAt(a.bps, i, v) })} />
          ))}
          {bps !== null ? (
            <Card style={{ gap: 6 }}>
              <AppText weight="800">{tr('odak.onb.bpsYour', { score: bps })}</AppText>
              <AppText variant="small">{referral.expert ? ONB.bps.resultHigh : ONB.bps.resultLow}</AppText>
              <AppText variant="tiny" muted>
                {ONB.bps.nonJudge}
              </AppText>
            </Card>
          ) : null}
          {referral.expert ? <ExpertCard /> : null}
        </>
      ) : null}

      {step === 'freq' ? (
        <>
          {title(ONB.freq.title, ONB.freq.hint)}
          <Card style={{ gap: 10 }}>
            <AppText weight="800" center>
              {ONB.freq.porn}
            </AppText>
            <NumberStepper label={ONB.freq.porn} value={a.freqPorn} onChange={(v) => set({ freqPorn: v })} min={0} max={FREQ_MAX} unit={ONB.freq.unit} quick={[0, 2, 4, 7, 10, 14]} />
          </Card>
          <Card style={{ gap: 10 }}>
            <AppText weight="800" center>
              {ONB.freq.mast}
            </AppText>
            <NumberStepper label={ONB.freq.mast} value={a.freqMast} onChange={(v) => set({ freqMast: v })} min={0} max={FREQ_MAX} unit={ONB.freq.unit} quick={[0, 2, 4, 7, 10, 14]} />
          </Card>
        </>
      ) : null}

      {step === 'triggers' ? (
        <>
          {title(ONB.triggers.title, ONB.triggers.hint)}
          <View style={{ gap: 10 }}>
            {ONB.triggers.options.map((o) => (
              <ChoiceCard key={o.id} multi icon={o.icon} label={o.label} selected={a.triggers.includes(o.id)} onPress={() => set({ triggers: toggle(a.triggers, o.id) })} />
            ))}
          </View>
        </>
      ) : null}

      {step === 'emotions' ? (
        <>
          {title(ONB.emotions.title, ONB.emotions.hint)}
          <AppText variant="h3">{ONB.emotions.beforeTitle}</AppText>
          <PillGroup items={ONB.emotions.before} selected={a.emotionsBefore} onToggle={(id) => set({ emotionsBefore: toggle(a.emotionsBefore, id) })} />
          <AppText variant="h3" style={{ marginTop: 6 }}>
            {ONB.emotions.afterTitle}
          </AppText>
          <PillGroup items={ONB.emotions.after} selected={a.emotionsAfter} onToggle={(id) => set({ emotionsAfter: toggle(a.emotionsAfter, id) })} />
        </>
      ) : null}

      {step === 'values' ? (
        <>
          {title(ONB.values.title, ONB.values.hint)}
          <PillGroup items={ONB.values.cards} selected={a.values} onToggle={(id) => set({ values: toggle(a.values, id) })} />
          {input(a.valuesText, (v) => set({ valuesText: v }), ONB.values.textPlaceholder, VALUES_TEXT_MAX)}
        </>
      ) : null}

      {step === 'moral' ? (
        <>
          {title(ONB.moral.title)}
          <Card style={{ gap: 10 }}>
            <AppText weight="800">“{ONB.moral.statement}”</AppText>
            <View style={{ gap: t.space.sm }}>
              {ONB.moral.scale.map((label, i) => (
                <ChoiceCard key={label} label={`${i + 1} · ${label}`} selected={a.moral === i + 1} onPress={() => set({ moral: (i + 1) as Score5 })} />
              ))}
            </View>
          </Card>
          <AppText variant="small" muted>
            {ONB.moral.note}
          </AppText>
        </>
      ) : null}

      {step === 'mood' ? (
        <>
          {title(ONB.mood.title, ONB.mood.hint)}
          {ONB.mood.phq.map((item, i) => (
            <ScaleRow key={item} label={item} options={ONB.mood.options} value={a.phq[i] ?? null} onChange={(v) => set({ phq: setAt(a.phq, i, v) })} />
          ))}
          {ONB.mood.gad.map((item, i) => (
            <ScaleRow key={item} label={item} options={ONB.mood.options} value={a.gad[i] ?? null} onChange={(v) => set({ gad: setAt(a.gad, i, v) })} />
          ))}
          {phq !== null && gad !== null ? (
            referral.mood ? (
              <ExpertCard lead={ONB.mood.resultHigh} />
            ) : (
              <Card>
                <AppText variant="small">{ONB.mood.resultLow}</AppText>
              </Card>
            )
          ) : null}
        </>
      ) : null}

      {step === 'attempts' ? (
        <>
          {title(ONB.attempts.title, ONB.attempts.hint)}
          <View style={{ gap: 10 }}>
            {ONB.attempts.options.map((o) => (
              <ChoiceCard key={o.id} multi icon={o.icon} label={o.label} selected={a.attempts.includes(o.id as Answers['attempts'][number])} onPress={() => set({ attempts: toggle(a.attempts, o.id as Answers['attempts'][number]) })} />
            ))}
          </View>
          <AppText variant="small" muted>
            {ONB.attempts.note}
          </AppText>
        </>
      ) : null}

      {step === 'goal' ? (
        <>
          {title(ONB.goal.title, ONB.goal.hint)}
          <Card style={{ gap: 10 }}>
            <AppText variant="h3">{ONB.goal.porn.title}</AppText>
            {ONB.goal.porn.options.map((o) => (
              <ChoiceCard key={o.id} icon={o.icon} label={o.label} selected={a.porn === o.id} onPress={() => set({ porn: o.id as Answers['porn'] })} />
            ))}
            {a.porn === 'reduce' ? <NumberStepper label={ONB.goal.weeklyMax} value={a.pornWeeklyMax} onChange={(v) => set({ pornWeeklyMax: v })} min={PORN_WEEKLY.min} max={PORN_WEEKLY.max} unit={ONB.goal.weeklyUnit} /> : null}
          </Card>
          <Card style={{ gap: 10 }}>
            <AppText variant="h3">{ONB.goal.mast.title}</AppText>
            {ONB.goal.mast.options.map((o) => (
              <ChoiceCard key={o.id} icon={o.icon} label={o.label} selected={a.mast === o.id} onPress={() => set({ mast: o.id as Answers['mast'] })} />
            ))}
            {a.mast === 'reduce' ? <NumberStepper label={ONB.goal.weeklyMax} value={a.mastWeeklyMax} onChange={(v) => set({ mastWeeklyMax: v })} min={MAST_WEEKLY.min} max={MAST_WEEKLY.max} unit={ONB.goal.weeklyUnit} /> : null}
            {a.mast === 'pause' ? (
              <>
                <AppText weight="700">{ONB.goal.pauseTitle}</AppText>
                <NumberStepper label={ONB.goal.pauseTitle} value={a.mastPauseDays} onChange={(v) => set({ mastPauseDays: v })} min={PAUSE_DAYS.min} max={PAUSE_DAYS.max} unit={ONB.goal.pauseUnit} quick={[...PAUSE_PRESETS]} />
              </>
            ) : null}
          </Card>
          <Card style={{ backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
            <AppText variant="small">{ONB.goal.note}</AppText>
          </Card>
          {a.porn === 'undecided' || a.mast === 'undecided' ? (
            <AppText variant="small" muted>
              {ONB.goal.undecidedNote}
            </AppText>
          ) : null}
        </>
      ) : null}

      {step === 'risky' ? (
        <>
          {title(ONB.risky.title, ONB.risky.hint)}
          <PillGroup
            items={ONB.risky.ranges}
            selected={ONB.risky.ranges.filter((r) => a.risky.some((x) => x.from === r.from && x.to === r.to)).map((r) => r.id)}
            onToggle={(id) => {
              const r = ONB.risky.ranges.find((x) => x.id === id)!;
              set({ risky: toggleRange(a.risky, { from: r.from, to: r.to }) });
            }}
          />
        </>
      ) : null}

      {step === 'plans' ? (
        <>
          {title(ONB.plans.title, ONB.plans.hint)}
          {drafts.length === 0 ? (
            <Card>
              <AppText variant="small">{ONB.plans.empty}</AppText>
            </Card>
          ) : (
            drafts.map((d) => {
              const tpl = ODAK_PLANS.templates[d.trigger];
              return (
                <Card key={d.trigger} style={{ gap: 10 }}>
                  <AppText weight="800" color={t.colors.accent}>
                    {ONB.plans.if} {tpl.if}…
                  </AppText>
                  <AppText variant="small" weight="700" muted>
                    {ONB.plans.then}
                  </AppText>
                  {tpl.then.map((th, i) => (
                    <ChoiceCard key={th} label={th} selected={(picks[d.trigger] ?? 0) === i} onPress={() => setPicks((x) => ({ ...x, [d.trigger]: i }))} />
                  ))}
                </Card>
              );
            })
          )}
        </>
      ) : null}

      {step === 'summary' ? (
        <>
          {title(ONB.summary.title)}
          <Card style={{ gap: 6 }}>
            <AppText variant="h3">{ONB.summary.goalsTitle}</AppText>
            <AppText>{goalLabel('porn', a.porn ?? 'undecided', a.pornWeeklyMax)}</AppText>
            <AppText>{goalLabel('mast', a.mast ?? 'undecided', a.mast === 'pause' ? a.mastPauseDays : a.mastWeeklyMax)}</AppText>
          </Card>
          <Card style={{ gap: t.space.sm }}>
            <AppText variant="h3">{ONB.summary.valuesTitle}</AppText>
            <PillGroup items={ONB.values.cards.filter((c) => a.values.includes(c.id))} selected={a.values} onToggle={() => undefined} />
            {a.valuesText.trim() ? <AppText style={{ fontStyle: 'italic' }}>“{a.valuesText.trim()}”</AppText> : null}
          </Card>
          <Card style={{ gap: 6 }}>
            <AppText variant="h3">{ONB.summary.plansTitle}</AppText>
            {drafts.length ? (
              drafts.map((d) => (
                <AppText key={d.trigger} variant="small">
                  • {ONB.plans.if} {d.ifText}, {d.thenText.charAt(0).toLocaleLowerCase(localeOf(i18n.language)) + d.thenText.slice(1)}
                </AppText>
              ))
            ) : (
              <AppText variant="small" muted>
                {ONB.plans.empty}
              </AppText>
            )}
          </Card>
          <Card style={{ gap: 6 }}>
            <AppText variant="h3">{ONB.summary.boundariesTitle}</AppText>
            {ONB.summary.boundaries.map((b) => (
              <AppText key={b} variant="small">
                • {b}
              </AppText>
            ))}
            <AppText variant="tiny" muted>
              {ONB.summary.boundariesNote}
            </AppText>
          </Card>
          <Card style={{ gap: t.space.sm }}>
            <AppText variant="h3">{ONB.summary.programTitle}</AppText>
            <AppText variant="small" muted>
              {ONB.summary.programIntro}
            </AppText>
            {ONB.summary.phases.map((p) => (
              <View key={p.name} style={{ flexDirection: 'row', gap: 10 }}>
                <Icon name={p.icon} size="md" />
                <View style={{ flex: 1 }}>
                  <AppText weight="800">
                    {p.name} · {p.days}
                  </AppText>
                  <AppText variant="small" muted>
                    {p.focus}
                  </AppText>
                </View>
              </View>
            ))}
            <AppText variant="tiny" muted>
              {ONB.summary.bpsAgain}
            </AppText>
          </Card>
          {referral.expert || referral.mood ? <ExpertCard /> : null}
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
