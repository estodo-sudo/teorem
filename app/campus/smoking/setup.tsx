import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, Icon, ProgressBar, Screen, useTheme } from '@/components';
import { SMOKING } from '@/features/campus/smoking/content';
import {
  clampCigsPerDay,
  CIGS_PER_DAY_MAX,
  CIGS_PER_DAY_MIN,
  formatThousands,
  monthlyCost,
  parsePrice,
  PACK_SIZE_DEFAULT,
  QUIT_DAY_CHOICES,
  quitAtFromChoice,
  type GuideStepId,
  type QuitDayChoice,
} from '@/features/campus/smoking/logic';
import { Chip, GuideStepView, PrepChecklist } from '@/features/campus/smoking/ui';
import { CommitmentView, useCommitGate } from '@/features/campus/shared/commit';
import { useCampusStore } from '@/stores/campusStore';
import { goBack } from '@/lib/nav';

type FormStep = 'reasons' | 'habit' | 'triggers' | 'day' | 'summary' | 'prep' | 'commit';
type Step = FormStep | { guide: GuideStepId };
type DayChoice = QuitDayChoice | 'keep';

/**
 * Enrolment: plan questions with the six guide sections woven in, in reading order,
 * ending with the preparation checklist.
 * Editing an existing plan shows only the questions.
 */
const ENROL_STEPS: Step[] = [
  { guide: 'why' },
  'reasons',
  'habit',
  'triggers',
  { guide: 'prepare' },
  'day',
  { guide: 'quitday' },
  { guide: 'week1' },
  { guide: 'cravings' },
  { guide: 'day28' },
  'summary',
  'prep',
  'commit',
];
const EDIT_STEPS: Step[] = ['reasons', 'habit', 'triggers', 'day', 'summary'];

export default function SmokingSetup() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const existing = useCampusStore((x) => x.smoking);
  const editing = edit === '1' && existing.setupDone;

  const steps = editing ? EDIT_STEPS : ENROL_STEPS;
  const [stepIdx, setStepIdx] = useState(0);
  const [reasonIds, setReasonIds] = useState<string[]>(editing ? existing.reasonIds : []);
  const [cigsPerDay, setCigsPerDay] = useState(editing ? existing.cigsPerDay : 10);
  const [priceText, setPriceText] = useState(editing && existing.packPrice > 0 ? String(existing.packPrice).replace('.', ',') : '');
  const [triggerIds, setTriggerIds] = useState<string[]>(editing ? existing.triggerIds : []);
  const [day, setDay] = useState<DayChoice>(editing ? 'keep' : 'tomorrow');
  // The quit day is chosen in this wizard, so its prep item starts checked.
  const [prepIds, setPrepIds] = useState<string[]>(() => Array.from(new Set([...existing.prepDoneIds, 'date'])));
  const [showError, setShowError] = useState(false);
  // Fixed once per wizard visit so the shown dates do not drift while it is open.
  const [openedAt] = useState(() => new Date());

  const step = steps[stepIdx]!;
  // The commitment page holds the enrol button for a few seconds.
  const commitLeft = useCommitGate(step === 'commit');
  const locked = step === 'commit' && commitLeft > 0;
  const guide = typeof step === 'object' ? SMOKING.steps.findIndex((x) => x.id === step.guide) : -1;
  const price = parsePrice(priceText);
  const fmtDate = (d: Date) => d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const quitDate = useMemo(() => (day === 'keep' ? new Date(existing.quitAt!) : quitAtFromChoice(day, openedAt)), [day, existing.quitAt, openedAt]);
  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const next = () => {
    if (step === 'reasons' && reasonIds.length === 0) {
      setShowError(true);
      return;
    }
    setShowError(false);
    if (stepIdx === steps.length - 1) {
      // "now" means the moment the plan is saved, not when the wizard opened.
      const quitAt = day === 'now' ? new Date() : quitDate;
      useCampusStore.getState().saveSmokingSetup({
        quitAt: quitAt.toISOString(),
        cigsPerDay: clampCigsPerDay(cigsPerDay),
        packPrice: price,
        reasonIds,
        triggerIds,
        guideReadIds: editing ? [] : SMOKING.steps.map((x) => x.id),
        prepDoneIds: editing ? undefined : prepIds,
      });
      router.replace('/campus/smoking');
      return;
    }
    setStepIdx((i) => Math.min(steps.length - 1, i + 1));
  };
  const back = () => {
    if (stepIdx === 0) goBack('/discover');
    else {
      setShowError(false);
      setStepIdx((i) => i - 1);
    }
  };

  const isLast = stepIdx === steps.length - 1;
  const nextLabel = stepIdx === 0 && !editing ? tr('smoking.setup.start') : isLast ? (editing ? tr('smoking.setup.save') : tr('smoking.setup.enrol')) : tr('common.next');
  const dayChoices: DayChoice[] = editing && existing.quitAt ? ['keep', ...QUIT_DAY_CHOICES] : QUIT_DAY_CHOICES;

  return (
    <Screen footer={<Button label={locked ? tr('campusCommit.wait', { count: commitLeft }) : nextLabel} size="lg" variant={isLast ? 'accent' : 'primary'} disabled={locked} onPress={next} />}>
      <Header title={tr('smoking.setup.header')} onBack={back} />
      <View style={{ gap: 6 }}>
        <ProgressBar value={(stepIdx + 1) / steps.length} height={6} accessibilityLabel={tr('smoking.setup.stepOf', { n: stepIdx + 1, total: steps.length })} />
        <AppText variant="tiny" muted>
          {tr('smoking.setup.stepOf', { n: stepIdx + 1, total: steps.length })}
        </AppText>
      </View>

      {guide >= 0 ? (
        <>
          <GuideStepView step={SMOKING.steps[guide]!} n={guide + 1} total={SMOKING.steps.length} />
          {stepIdx === 0 ? (
            <AppText variant="small" muted center>
              {tr('smoking.setup.privacy')}
            </AppText>
          ) : null}
        </>
      ) : null}

      {step === 'reasons' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('smoking.setup.reasonsTitle')}
          </AppText>
          <AppText muted>{tr('smoking.setup.reasonsHint')}</AppText>
          <View style={{ gap: 10 }}>
            {SMOKING.reasons.map((r) => (
              <ChoiceCard
                key={r.id}
                multi
                emoji={r.emoji}
                label={r.label}
                selected={reasonIds.includes(r.id)}
                onPress={() => {
                  setShowError(false);
                  setReasonIds((a) => toggle(a, r.id));
                }}
              />
            ))}
          </View>
          {showError ? (
            <AppText variant="small" color={t.colors.danger} accessibilityLiveRegion="polite">
              {tr('smoking.setup.reasonsError')}
            </AppText>
          ) : null}
        </>
      ) : null}

      {step === 'habit' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('smoking.setup.habitTitle')}
          </AppText>
          <Card style={{ gap: 12 }}>
            <AppText weight="700">{tr('smoking.setup.perDay')}</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <StepButton icon="minus" label={tr('smoking.setup.decrease')} disabled={cigsPerDay <= CIGS_PER_DAY_MIN} onPress={() => setCigsPerDay((n) => clampCigsPerDay(n - 1))} />
              <AppText variant="h1" accessibilityLiveRegion="polite">
                {tr('smoking.setup.perDayValue', { count: cigsPerDay })}
              </AppText>
              <StepButton icon="plus" label={tr('smoking.setup.increase')} disabled={cigsPerDay >= CIGS_PER_DAY_MAX} onPress={() => setCigsPerDay((n) => clampCigsPerDay(n + 1))} />
            </View>
          </Card>
          <Card style={{ gap: 8 }}>
            <AppText weight="700">{tr('smoking.setup.price')}</AppText>
            <TextInput
              value={priceText}
              onChangeText={(v) => setPriceText(v.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              maxLength={8}
              placeholder={tr('smoking.setup.pricePlaceholder')}
              placeholderTextColor={t.colors.textMuted}
              accessibilityLabel={tr('smoking.setup.price')}
              style={{
                minHeight: t.touch,
                borderRadius: t.radius.md,
                borderWidth: 1,
                borderColor: t.colors.border,
                backgroundColor: t.colors.surfaceAlt,
                paddingHorizontal: 14,
                fontSize: t.font.h3,
                color: t.colors.text,
              }}
            />
            <AppText variant="small" muted>
              {price > 0 ? tr('smoking.setup.monthly', { amount: formatThousands(monthlyCost({ cigsPerDay, packPrice: price, cigsPerPack: PACK_SIZE_DEFAULT })) }) : tr('smoking.setup.priceHint')}
            </AppText>
          </Card>
        </>
      ) : null}

      {step === 'triggers' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('smoking.setup.triggersTitle')}
          </AppText>
          <AppText muted>{tr('smoking.setup.triggersHint')}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SMOKING.triggers.map((x) => (
              <Chip key={x.id} emoji={x.emoji} label={x.label} selected={triggerIds.includes(x.id)} onPress={() => setTriggerIds((a) => toggle(a, x.id))} />
            ))}
          </View>
        </>
      ) : null}

      {step === 'day' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('smoking.setup.dayTitle')}
          </AppText>
          <AppText muted>{tr('smoking.setup.dayHint')}</AppText>
          <View style={{ gap: 10 }}>
            {dayChoices.map((c) => (
              <ChoiceCard
                key={c}
                label={c === 'keep' ? tr('smoking.setup.keepDate') : tr(`smoking.setup.choice.${c}`)}
                description={c === 'keep' ? fmtDate(new Date(existing.quitAt!)) : c === 'now' ? tr('smoking.setup.choice.nowDesc') : fmtDate(quitAtFromChoice(c, openedAt))}
                selected={day === c}
                onPress={() => setDay(c)}
              />
            ))}
          </View>
        </>
      ) : null}

      {step === 'summary' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('smoking.setup.summaryTitle')}
          </AppText>
          <Card style={{ gap: 12 }}>
            <SummaryRow label={tr('smoking.setup.summaryDay')} value={day === 'now' ? tr('smoking.setup.summaryNow') : fmtDate(quitDate)} />
            <SummaryRow
              label={tr('smoking.setup.summaryHabit')}
              value={`${tr('smoking.setup.summaryHabitValue', { count: cigsPerDay })}${price > 0 ? ` · ${tr('smoking.setup.monthly', { amount: formatThousands(monthlyCost({ cigsPerDay, packPrice: price, cigsPerPack: PACK_SIZE_DEFAULT })) })}` : ''}`}
            />
            <SummaryRow label={tr('smoking.setup.summaryReasons')} value={SMOKING.reasons.filter((r) => reasonIds.includes(r.id)).map((r) => `${r.emoji} ${r.label}`).join('\n') || tr('smoking.setup.none')} />
            <SummaryRow label={tr('smoking.setup.summaryTriggers')} value={SMOKING.triggers.filter((x) => triggerIds.includes(x.id)).map((x) => `${x.emoji} ${x.label}`).join('\n') || tr('smoking.setup.none')} />
          </Card>
        </>
      ) : null}

      {step === 'prep' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('smoking.setup.prepTitle')}
          </AppText>
          <AppText muted>{tr('smoking.setup.prepHint')}</AppText>
          <PrepChecklist doneIds={prepIds} onToggle={(id) => setPrepIds((a) => toggle(a, id))} title={tr('smoking.prep.title')} />
        </>
      ) : null}

      {step === 'commit' ? <CommitmentView /> : null}
    </Screen>
  );
}

function StepButton({ icon, label, disabled, onPress }: { icon: 'plus' | 'minus'; label: string; disabled: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surfaceAlt, opacity: disabled ? 0.4 : 1 }}
    >
      {icon === 'plus' ? <Icon name="plus" color={t.colors.text} size={26} /> : <View style={{ width: 18, height: 3, borderRadius: 2, backgroundColor: t.colors.text }} />}
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <AppText variant="small" muted weight="700">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}
