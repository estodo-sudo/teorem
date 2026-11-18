import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, ProgressBar, Screen, useTheme } from '@/components';
import { MC } from '@/features/campus/masturbation/content';
import { BASELINE_LIMITS, CHECK_QUESTION_COUNT, checkBand, checkScore, isBaselineId, QUIT_GOALS, type BaselineId, type McMode, type McState } from '@/features/campus/masturbation/logic';
import { tint } from '@/features/campus/shared/ui';
import { EnvChecklist } from '@/features/campus/masturbation/ui';
import { Chip, GuideStepView } from '@/features/campus/smoking/ui';
import { CommitmentView, useCommitGate } from '@/features/campus/shared/commit';
import { useCampusStore } from '@/stores/campusStore';
import { goBack } from '@/lib/nav';

type GuideId = McState['stepDoneIds'][number];
type FormStep = 'check' | 'reasons' | 'triggers' | 'path' | 'pathDetail' | 'summary' | 'env' | 'commit';
type Step = FormStep | { guide: GuideId };

/** Enrolment: the six guide sections woven between the plan questions (incl. the path: control or quit), ending with the environment checklist. */
const ENROL_STEPS: Step[] = [
  { guide: 'what' },
  'check',
  'reasons',
  { guide: 'cycle' },
  'triggers',
  { guide: 'environment' },
  'path',
  'pathDetail',
  { guide: 'urges' },
  { guide: 'lapse' },
  { guide: 'support' },
  'summary',
  'env',
  'commit',
];
const EDIT_STEPS: Step[] = ['reasons', 'triggers', 'path', 'pathDetail', 'summary'];

export default function McSetup() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const existing = useCampusStore((x) => x.masturbation);
  const editing = edit === '1' && existing.setupDone;
  const steps = editing ? EDIT_STEPS : ENROL_STEPS;

  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => existing.checkAnswers ?? Array<boolean | null>(CHECK_QUESTION_COUNT).fill(null));
  const [values, setValues] = useState<boolean | null>(existing.checkValues);
  const [reasonIds, setReasonIds] = useState<string[]>(editing ? existing.reasonIds : []);
  const [triggerIds, setTriggerIds] = useState<string[]>(editing ? existing.triggerIds : []);
  const [mode, setMode] = useState<McMode>(editing ? existing.mode : 'control');
  const [baselineId, setBaselineId] = useState<BaselineId | null>(editing ? existing.baselineId : null);
  const [goal, setGoal] = useState<number>(editing ? existing.goalDays : 15);
  const [envIds, setEnvIds] = useState<string[]>(existing.envDoneIds);
  const [showError, setShowError] = useState(false);

  const step = steps[stepIdx]!;
  // The commitment page holds the enrol button for a few seconds.
  const commitLeft = useCommitGate(step === 'commit');
  const locked = step === 'commit' && commitLeft > 0;
  const guide = typeof step === 'object' ? MC.steps.findIndex((x) => x.id === step.guide) : -1;
  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  const allAnswered = answers.every((a) => a !== null);
  const score = checkScore(allAnswered ? (answers as boolean[]) : null);
  const band = allAnswered ? checkBand(score, MC.check.bands) : undefined;

  const next = () => {
    if ((step === 'reasons' && reasonIds.length === 0) || (step === 'pathDetail' && mode === 'control' && !baselineId)) {
      setShowError(true);
      return;
    }
    setShowError(false);
    if (stepIdx === steps.length - 1) {
      useCampusStore.getState().saveMcSetup({
        mode,
        ...(mode === 'quit' ? { goalDays: goal } : baselineId ? { baselineId } : {}),
        reasonIds,
        triggerIds,
        ...(editing ? {} : { checkAnswers: allAnswered ? (answers as boolean[]) : null, checkValues: values, envDoneIds: envIds, guideReadIds: MC.steps.map((x) => x.id) }),
      });
      router.replace('/campus/masturbation');
      return;
    }
    setStepIdx((i) => i + 1);
  };
  const back = () => {
    if (stepIdx === 0) goBack('/discover');
    else {
      setShowError(false);
      setStepIdx((i) => i - 1);
    }
  };

  const isLast = stepIdx === steps.length - 1;
  const nextLabel = stepIdx === 0 && !editing ? tr('mcampus.setup.start') : isLast ? (editing ? tr('mcampus.setup.save') : tr('mcampus.setup.enrol')) : tr('common.next');

  return (
    <Screen footer={<Button label={locked ? tr('campusCommit.wait', { count: commitLeft }) : nextLabel} size="lg" variant={isLast ? 'accent' : 'primary'} disabled={locked} onPress={next} />}>
      <Header title={tr('mcampus.setup.header')} onBack={back} />
      <View style={{ gap: 6 }}>
        <ProgressBar value={(stepIdx + 1) / steps.length} height={6} accessibilityLabel={tr('mcampus.setup.stepOf', { n: stepIdx + 1, total: steps.length })} />
        <AppText variant="tiny" muted>
          {tr('mcampus.setup.stepOf', { n: stepIdx + 1, total: steps.length })}
        </AppText>
      </View>

      {guide >= 0 ? (
        <>
          <GuideStepView step={MC.steps[guide]!} n={guide + 1} total={MC.steps.length} />
          {stepIdx === 0 ? (
            <AppText variant="small" muted center>
              {tr('mcampus.setup.privacy')}
            </AppText>
          ) : null}
        </>
      ) : null}

      {step === 'check' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('mcampus.setup.checkTitle')}
          </AppText>
          <AppText muted>{tr('mcampus.setup.checkHint')}</AppText>
          {MC.check.questions.map((q, i) => (
            <YesNo key={q.id} n={i + 1} text={q.text} value={answers[i] ?? null} onChange={(v) => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))} />
          ))}
          <YesNo n={null} text={MC.check.values.text} value={values} onChange={setValues} />
          {band ? (
            <Card style={{ gap: 6, borderColor: band.id === 'high' ? t.colors.warning : band.id === 'some' ? t.colors.primary : t.colors.success, borderWidth: 2 }}>
              <AppText variant="tiny" weight="800" muted>
                {tr('mcampus.setup.checkResult', { score, total: CHECK_QUESTION_COUNT })}
              </AppText>
              <AppText variant="h3">{band.title}</AppText>
              <AppText variant="small">{band.text}</AppText>
              {values ? (
                <AppText variant="small" muted>
                  {MC.check.valuesNote}
                </AppText>
              ) : null}
            </Card>
          ) : null}
          <AppText variant="tiny" muted>
            {MC.check.disclaimer}
          </AppText>
        </>
      ) : null}

      {step === 'reasons' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('mcampus.setup.reasonsTitle')}
          </AppText>
          <AppText muted>{tr('mcampus.setup.reasonsHint')}</AppText>
          <View style={{ gap: 10 }}>
            {MC.reasons.map((r) => (
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
              {tr('mcampus.setup.reasonsError')}
            </AppText>
          ) : null}
        </>
      ) : null}

      {step === 'triggers' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('mcampus.setup.triggersTitle')}
          </AppText>
          <AppText muted>{tr('mcampus.setup.triggersHint')}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MC.triggers.map((x) => (
              <Chip key={x.id} emoji={x.emoji} label={x.label} selected={triggerIds.includes(x.id)} onPress={() => setTriggerIds((a) => toggle(a, x.id))} />
            ))}
          </View>
        </>
      ) : null}

      {step === 'path' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('mcampus.setup.pathTitle')}
          </AppText>
          <AppText muted>{tr('mcampus.setup.pathHint')}</AppText>
          {(['control', 'quit'] as const).map((id) => {
            const p = MC.paths[id];
            const selected = mode === id;
            return (
              <Pressable
                key={id}
                onPress={() => setMode(id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${p.title}. ${p.text}`}
                style={{
                  gap: 10,
                  padding: 18,
                  borderRadius: t.radius.xl,
                  borderWidth: 2,
                  borderColor: selected ? t.colors.primary : t.colors.border,
                  backgroundColor: selected ? tint(t.colors.primary, '1A') : t.colors.surface,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: selected ? t.colors.primary : t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText variant="h2">{p.emoji}</AppText>
                  </View>
                  <AppText variant="h2" style={{ flex: 1 }}>
                    {p.title}
                  </AppText>
                  <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: selected ? t.colors.primary : t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
                    {selected ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: t.colors.primary }} /> : null}
                  </View>
                </View>
                <AppText>{p.text}</AppText>
                {p.points.map((pt) => (
                  <View key={pt} style={{ flexDirection: 'row', gap: 8 }}>
                    <AppText weight="800" color={t.colors.primary}>
                      ✓
                    </AppText>
                    <AppText variant="small" style={{ flex: 1 }}>
                      {pt}
                    </AppText>
                  </View>
                ))}
              </Pressable>
            );
          })}
        </>
      ) : null}

      {step === 'pathDetail' && mode === 'control' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('mcampus.setup.baselineTitle')}
          </AppText>
          <AppText muted>{tr('mcampus.setup.baselineHint')}</AppText>
          <View style={{ gap: 10 }}>
            {MC.baselines.filter((b) => isBaselineId(b.id)).map((b) => (
              <ChoiceCard
                key={b.id}
                label={b.label}
                description={tr('mcampus.setup.baselineLimit', { hint: b.hint, count: BASELINE_LIMITS[b.id as BaselineId] })}
                selected={baselineId === b.id}
                onPress={() => {
                  setShowError(false);
                  setBaselineId(b.id as BaselineId);
                }}
              />
            ))}
          </View>
          {showError ? (
            <AppText variant="small" color={t.colors.danger} accessibilityLiveRegion="polite">
              {tr('mcampus.setup.baselineError')}
            </AppText>
          ) : null}
        </>
      ) : null}

      {step === 'pathDetail' && mode === 'quit' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('mcampus.setup.quitGoalTitle')}
          </AppText>
          <AppText muted>{tr('mcampus.setup.quitGoalHint')}</AppText>
          <View style={{ gap: 10 }}>
            {QUIT_GOALS.map((g) => (
              <ChoiceCard key={g} label={tr(`mcampus.setup.quitGoal.${g}`)} description={tr(`mcampus.setup.quitGoal.${g}Desc`)} selected={goal === g} onPress={() => setGoal(g)} />
            ))}
          </View>
        </>
      ) : null}

      {step === 'summary' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('mcampus.setup.summaryTitle')}
          </AppText>
          <Card style={{ gap: 12 }}>
            <SummaryRow
              label={tr('mcampus.setup.summaryPath')}
              value={mode === 'quit' ? tr('mcampus.setup.summaryQuit', { count: goal }) : tr('mcampus.setup.summaryControl', { count: baselineId ? BASELINE_LIMITS[baselineId] : 0 })}
            />
            <SummaryRow label={tr('mcampus.setup.summaryReasons')} value={MC.reasons.filter((r) => reasonIds.includes(r.id)).map((r) => `${r.emoji} ${r.label}`).join('\n') || tr('mcampus.setup.none')} />
            <SummaryRow label={tr('mcampus.setup.summaryTriggers')} value={MC.triggers.filter((x) => triggerIds.includes(x.id)).map((x) => `${x.emoji} ${x.label}`).join('\n') || tr('mcampus.setup.none')} />
          </Card>
        </>
      ) : null}

      {step === 'env' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('mcampus.setup.envTitle')}
          </AppText>
          <AppText muted>{tr('mcampus.setup.envHint')}</AppText>
          <EnvChecklist doneIds={envIds} onToggle={(id) => setEnvIds((a) => toggle(a, id))} title={tr('mcampus.home.envTitle')} />
        </>
      ) : null}

      {step === 'commit' ? <CommitmentView /> : null}
    </Screen>
  );
}

function YesNo({ n, text, value, onChange }: { n: number | null; text: string; value: boolean | null; onChange: (v: boolean) => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {n !== null ? (
          <AppText weight="800" color={t.colors.primary}>
            {n}.
          </AppText>
        ) : null}
        <AppText style={{ flex: 1 }}>{text}</AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
        {[true, false].map((v) => {
          const selected = value === v;
          return (
            <Pressable
              key={String(v)}
              onPress={() => onChange(v)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${text} ${v ? tr('mcampus.setup.yes') : tr('mcampus.setup.no')}`}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: t.radius.md,
                borderWidth: 2,
                borderColor: selected ? t.colors.primary : t.colors.border,
                backgroundColor: selected ? t.colors.primary : t.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText weight="700" color={selected ? t.colors.primaryText : t.colors.text}>
                {v ? tr('mcampus.setup.yes') : tr('mcampus.setup.no')}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Card>
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
