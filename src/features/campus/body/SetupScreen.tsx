import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, ProgressBar, Screen, useTheme } from '@/components';
import { CommitmentView, useCommitGate } from '@/features/campus/shared/commit';
import { InfoToggle, tint } from '@/features/campus/shared/ui';
import { GuideStepView } from '@/features/campus/smoking/ui';
import { goBack } from '@/lib/nav';
import { useCampusStore } from '@/stores/campusStore';

import { BODY } from './content';
import { routineMinutes, type BodyId } from './logic';
import { BodyChecklist, ExerciseRow, Footprint, LoadChart, MeasureHowTo, MeasureInput } from './ui';

type FormStep = 'flags' | 'test' | 'plan' | 'check' | 'measure' | 'commit';
type Step = FormStep | { guide: string };

/** Each campus has its own enrolment order (guide pages between the forms). */
const ENROL: Record<BodyId, Step[]> = {
  neck: [{ guide: 'what' }, 'flags', 'test', { guide: 'evidence' }, { guide: 'routine' }, 'plan', { guide: 'ergonomics' }, 'check', { guide: 'track' }, 'measure', 'commit'],
  feet: [{ guide: 'what' }, { guide: 'when' }, 'flags', 'test', { guide: 'evidence' }, { guide: 'routine' }, 'plan', 'check', { guide: 'track' }, 'measure', 'commit'],
};

export function BodySetupScreen({ id }: { id: BodyId }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const c = BODY[id];
  const steps = ENROL[id];
  const existing = useCampusStore((x) => x[id]);

  const [stepIdx, setStepIdx] = useState(0);
  const [flags, setFlags] = useState<string[]>(existing.redFlagIds);
  const [flagsAnswered, setFlagsAnswered] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(existing.answers);
  const [checkIds, setCheckIds] = useState<string[]>(existing.checkDoneIds);
  const [measure, setMeasure] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const step = steps[stepIdx]!;
  const commitLeft = useCommitGate(step === 'commit');
  const locked = step === 'commit' && commitLeft > 0;
  const guide = typeof step === 'object' ? c.steps.findIndex((x) => x.id === step.guide) : -1;
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const isLast = stepIdx === steps.length - 1;

  const next = () => {
    if (step === 'flags' && !flagsAnswered && flags.length === 0) {
      setError(tr('body.setup.flagsError'));
      return;
    }
    if (step === 'test' && c.selfTest.questions.some((q) => !answers[q.id])) {
      setError(tr('body.setup.testError'));
      return;
    }
    setError(null);
    if (isLast) {
      useCampusStore.getState().saveBodySetup(id, {
        redFlagIds: flags,
        answers,
        checkDoneIds: checkIds,
        guideReadIds: c.steps.map((x) => x.id),
        measure,
      });
      router.replace(`/campus/${id}`);
      return;
    }
    setStepIdx((i) => i + 1);
  };
  const back = () => {
    if (stepIdx === 0) goBack('/discover');
    else {
      setError(null);
      setStepIdx((i) => i - 1);
    }
  };
  const nextLabel = stepIdx === 0 ? tr('body.setup.start') : isLast ? tr('body.setup.enrol') : step === 'measure' && measure === null ? tr('body.setup.measureSkip') : tr('common.next');

  const errorText = error ? (
    <AppText variant="small" color={t.colors.danger} accessibilityLiveRegion="polite">
      {error}
    </AppText>
  ) : null;

  return (
    <Screen footer={<Button label={locked ? tr('campusCommit.wait', { count: commitLeft }) : nextLabel} size="lg" variant={isLast ? 'accent' : 'primary'} disabled={locked} onPress={next} />}>
      <Header title={c.title} onBack={back} />
      <View style={{ gap: 6 }}>
        <ProgressBar
          value={(stepIdx + 1) / steps.length}
          height={6}
          accessibilityLabel={tr('body.setup.stepOf', {
            n: stepIdx + 1,
            total: steps.length,
          })}
        />
        <AppText variant="tiny" muted>
          {tr('body.setup.stepOf', { n: stepIdx + 1, total: steps.length })}
        </AppText>
      </View>

      {guide >= 0 ? <GuideStepView step={c.steps[guide]!} n={guide + 1} total={c.steps.length} /> : null}

      {step === 'flags' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('body.setup.flagsTitle')}
          </AppText>
          <AppText muted>{c.redFlags.intro}</AppText>
          <View style={{ gap: 10 }}>
            {c.redFlags.questions.map((q) => (
              <ChoiceCard
                key={q.id}
                multi
                label={q.text}
                selected={flags.includes(q.id)}
                onPress={() => {
                  setError(null);
                  setFlagsAnswered(true);
                  setFlags((a) => toggle(a, q.id));
                }}
              />
            ))}
            <ChoiceCard
              multi
              emoji="✅"
              label={tr('body.setup.flagsNone')}
              selected={flagsAnswered && flags.length === 0}
              onPress={() => {
                setError(null);
                setFlagsAnswered(true);
                setFlags([]);
              }}
            />
          </View>
          {flags.length ? (
            <Card
              style={{
                gap: 6,
                borderWidth: 2,
                borderColor: t.colors.danger,
                backgroundColor: tint(t.colors.danger, '10'),
              }}
            >
              <AppText variant="h3" color={t.colors.danger}>
                ⚠️ {c.redFlags.title}
              </AppText>
              <AppText variant="small">{c.redFlags.text}</AppText>
              <AppText variant="small" muted>
                {tr('body.setup.flagsContinue')}
              </AppText>
            </Card>
          ) : flagsAnswered ? (
            <Card
              style={{
                gap: 4,
                borderWidth: 2,
                borderColor: t.colors.success,
                backgroundColor: tint(t.colors.success, '10'),
              }}
            >
              <AppText variant="small">{c.redFlags.ok}</AppText>
            </Card>
          ) : null}
          {errorText}
        </>
      ) : null}

      {step === 'test' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr(`body.setup.testTitle.${id}`)}
          </AppText>
          <AppText muted>{tr(`body.setup.testHint.${id}`)}</AppText>
          {c.selfTest.questions.map((q) => (
            <View key={q.id} style={{ gap: 10 }}>
              <AppText weight="800">{q.text}</AppText>
              {q.options.some((o) => o.mid !== undefined) ? (
                <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
                  {q.options.map((o) => {
                    const selected = answers[q.id] === o.id;
                    return (
                      <Pressable
                        key={o.id}
                        onPress={() => {
                          setError(null);
                          setAnswers((a) => ({ ...a, [q.id]: o.id }));
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${o.label}. ${o.desc ?? ''}`}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          gap: 8,
                          paddingVertical: 14,
                          paddingHorizontal: 6,
                          borderRadius: t.radius.lg,
                          borderWidth: 2,
                          borderColor: selected ? t.colors.accent : t.colors.border,
                          backgroundColor: selected ? tint(t.colors.accent, '14') : t.colors.surface,
                        }}
                      >
                        <Footprint mid={o.mid ?? 0.5} size={72} color={selected ? t.colors.accent : t.colors.textMuted} />
                        <AppText variant="small" weight="800" center>
                          {o.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {q.options.map((o) => (
                    <ChoiceCard
                      key={o.id}
                      label={o.label}
                      selected={answers[q.id] === o.id}
                      onPress={() => {
                        setError(null);
                        setAnswers((a) => ({ ...a, [q.id]: o.id }));
                      }}
                    />
                  ))}
                </View>
              )}
              {q.options.find((o) => o.id === answers[q.id])?.desc ? (
                <AppText variant="small" muted>
                  {q.options.find((o) => o.id === answers[q.id])!.desc}
                </AppText>
              ) : null}
            </View>
          ))}
          <TestResult id={id} answers={answers} />
          {errorText}
        </>
      ) : null}

      {step === 'plan' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('body.setup.planTitle')}
          </AppText>
          <AppText muted>
            {tr('body.setup.planHint', {
              weeks: c.weeks,
              target: c.weeklyTarget,
              minutes: routineMinutes(c.exercises),
            })}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <PlanStat value={String(c.weeks)} label={tr('body.setup.planWeeks')} />
            <PlanStat value={String(c.weeklyTarget)} label={tr('body.setup.planPerWeek')} />
            <PlanStat value={tr('body.minutes', { count: routineMinutes(c.exercises) })} label={tr('body.setup.planDaily')} />
          </View>
          <View style={{ gap: 8 }}>
            {c.exercises.map((e, i) => (
              <ExerciseRow key={e.id} ex={e} n={i + 1} />
            ))}
          </View>
          <InfoToggle title={tr('body.setup.painRuleTitle')} text={tr('body.setup.painRule')} />
        </>
      ) : null}

      {step === 'check' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr(`body.setup.checkTitle.${id}`)}
          </AppText>
          <AppText muted>{tr('body.setup.checkHint')}</AppText>
          <BodyChecklist items={c.checklist} doneIds={checkIds} onToggle={(v) => setCheckIds((a) => toggle(a, v))} />
        </>
      ) : null}

      {step === 'measure' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('body.setup.measureTitle', { title: c.measure.title })}
          </AppText>
          <AppText muted>{tr('body.setup.measureHint')}</AppText>
          <Card style={{ gap: 16 }}>
            <MeasureHowTo m={c.measure} />
            <MeasureInput m={c.measure} value={measure ?? (c.measure.better === 'lower' ? 5 : 0)} onChange={setMeasure} />
          </Card>
        </>
      ) : null}

      {step === 'commit' ? <CommitmentView /> : null}
    </Screen>
  );
}

function PlanStat({ value, label }: { value: string; label: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        gap: 2,
        paddingVertical: 12,
        borderRadius: t.radius.md,
        backgroundColor: tint(t.colors.primary, '14'),
      }}
    >
      <AppText variant="h2" color={t.colors.primary} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="tiny" muted center>
        {label}
      </AppText>
    </View>
  );
}

/** What the self-test answers mean, per campus. Shown in setup and on the home page. */
export function TestResult({ id, answers }: { id: BodyId; answers: Record<string, string> }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const c = BODY[id];
  if (id === 'neck') {
    if (!answers.screen) return null;
    const heavy = answers.screen === '4to6' || answers.screen === 'gt6';
    return (
      <Card style={{ gap: 12 }}>
        <AppText variant="h3">{tr('body.neck.loadTitle')}</AppText>
        {c.selfTest.loads ? <LoadChart loads={c.selfTest.loads} /> : null}
        <AppText variant="small" muted>
          {c.selfTest.loadNote}
        </AppText>
        <View
          style={{
            padding: 12,
            borderRadius: t.radius.md,
            backgroundColor: tint(heavy ? t.colors.warning : t.colors.success, '1A'),
          }}
        >
          <AppText variant="small" weight="700">
            {heavy ? tr('body.neck.screenHeavy') : tr('body.neck.screenOk')}
          </AppText>
        </View>
        {answers.pain === 'often' ? (
          <AppText variant="small" muted>
            {tr('body.neck.painOften')}
          </AppText>
        ) : null}
      </Card>
    );
  }
  if (!answers.tiptoe) return null;
  const rigid = answers.tiptoe === 'no';
  const flatPrint = answers.footprint === 'flat';
  return (
    <Card
      style={{
        gap: 8,
        borderWidth: 2,
        borderColor: rigid ? t.colors.warning : t.colors.success,
      }}
    >
      <AppText variant="h3">{rigid ? tr('body.feet.rigidTitle') : answers.tiptoe === 'yes' ? (flatPrint ? tr('body.feet.flexibleTitle') : tr('body.feet.archTitle')) : tr('body.feet.unsureTitle')}</AppText>
      <AppText variant="small">{rigid ? c.selfTest.rigid : answers.tiptoe === 'yes' ? (flatPrint ? c.selfTest.flexible : tr('body.feet.archText')) : tr('body.feet.unsureText')}</AppText>
    </Card>
  );
}
