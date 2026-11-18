import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, ProgressBar, Screen, useTheme } from '@/components';
import { PC } from '@/features/campus/porn/content';
import { BPS_QUESTIONS, bpsBand, bpsScore, MAX_VALUES, MIN_ACTIVITIES, PC_GOALS } from '@/features/campus/porn/logic';
import { PcEnvChecklist } from '@/features/campus/porn/ui';
import { InfoToggle, tint } from '@/features/campus/shared/ui';
import { Chip, GuideStepView } from '@/features/campus/smoking/ui';
import { goBack } from '@/lib/nav';
import { CommitmentView, useCommitGate } from '@/features/campus/shared/commit';
import { useCampusStore } from '@/stores/campusStore';

type FormStep = 'bps' | 'values' | 'activities' | 'goal' | 'summary' | 'env' | 'commit';
type Step = FormStep | { guide: string };

/** Enrolment: screen → values compass → digital environment → goal → urges and lapses, ending with the checklist. */
const ENROL_STEPS: Step[] = [
  { guide: 'what' },
  'bps',
  { guide: 'values' },
  'values',
  'activities',
  { guide: 'digital' },
  'goal',
  { guide: 'urges' },
  { guide: 'lapse' },
  { guide: 'support' },
  'summary',
  'env',
  'commit',
];
const EDIT_STEPS: Step[] = ['values', 'activities', 'goal', 'summary'];

export default function PcSetup() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const existing = useCampusStore((x) => x.porn);
  const editing = edit === '1' && existing.setupDone;
  const steps = editing ? EDIT_STEPS : ENROL_STEPS;

  const [stepIdx, setStepIdx] = useState(0);
  const [bps, setBps] = useState<(number | null)[]>(() => existing.bps ?? Array<number | null>(BPS_QUESTIONS).fill(null));
  const [conflict, setConflict] = useState<boolean | null>(existing.valuesConflict);
  const [valueIds, setValueIds] = useState<string[]>(editing ? existing.valueIds : []);
  const [activityIds, setActivityIds] = useState<string[]>(editing ? existing.activityIds : []);
  const [goal, setGoal] = useState<number>(editing ? existing.goalDays : 30);
  const [envIds, setEnvIds] = useState<string[]>(existing.envDoneIds);
  const [error, setError] = useState<string | null>(null);

  const step = steps[stepIdx]!;
  // The commitment page holds the enrol button for a few seconds.
  const commitLeft = useCommitGate(step === 'commit');
  const locked = step === 'commit' && commitLeft > 0;
  const guide = typeof step === 'object' ? PC.steps.findIndex((x) => x.id === step.guide) : -1;
  const bpsDone = bps.every((a) => a !== null);
  const score = bpsScore(bpsDone ? (bps as number[]) : null);
  const band = bpsDone ? bpsBand(score, PC.bps.bands) : undefined;
  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const next = () => {
    if (step === 'values' && valueIds.length === 0) {
      setError(tr('pcampus.setup.valuesError'));
      return;
    }
    if (step === 'activities' && activityIds.length < MIN_ACTIVITIES) {
      setError(tr('pcampus.setup.activitiesError'));
      return;
    }
    setError(null);
    if (stepIdx === steps.length - 1) {
      useCampusStore.getState().savePcSetup({
        goalDays: goal,
        valueIds,
        activityIds,
        ...(editing ? {} : { bps: bpsDone ? (bps as number[]) : null, valuesConflict: conflict, envDoneIds: envIds, guideReadIds: PC.steps.map((x) => x.id) }),
      });
      router.replace('/campus/porn');
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

  const isLast = stepIdx === steps.length - 1;
  const nextLabel = stepIdx === 0 && !editing ? tr('pcampus.setup.start') : isLast ? (editing ? tr('pcampus.setup.save') : tr('pcampus.setup.enrol')) : tr('common.next');

  return (
    <Screen footer={<Button label={locked ? tr('campusCommit.wait', { count: commitLeft }) : nextLabel} size="lg" variant={isLast ? 'accent' : 'primary'} disabled={locked} onPress={next} />}>
      <Header title={tr('pcampus.setup.header')} onBack={back} />
      <View style={{ gap: 6 }}>
        <ProgressBar value={(stepIdx + 1) / steps.length} height={6} accessibilityLabel={tr('pcampus.setup.stepOf', { n: stepIdx + 1, total: steps.length })} />
        <AppText variant="tiny" muted>
          {tr('pcampus.setup.stepOf', { n: stepIdx + 1, total: steps.length })}
        </AppText>
      </View>

      {guide >= 0 ? (
        <>
          <GuideStepView step={PC.steps[guide]!} n={guide + 1} total={PC.steps.length} />
          {stepIdx === 0 ? (
            <AppText variant="small" muted center>
              {tr('pcampus.setup.privacy')}
            </AppText>
          ) : null}
        </>
      ) : null}

      {step === 'bps' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('pcampus.setup.bpsTitle')}
          </AppText>
          <AppText muted>{PC.bps.intro}</AppText>
          <InfoToggle title={PC.bps.info.title} text={PC.bps.info.text} />
          {PC.bps.questions.map((q, qi) => (
            <Card key={q.id} style={{ gap: 10 }}>
              <AppText weight="700">
                {qi + 1}. {q.text}
              </AppText>
              <View style={{ flexDirection: 'row', gap: 6 }} accessibilityRole="radiogroup">
                {PC.bps.options.map((o) => {
                  const selected = bps[qi] === o.score;
                  return (
                    <Pressable
                      key={o.text}
                      onPress={() => setBps((a) => a.map((x, j) => (j === qi ? o.score : x)))}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${q.text} ${o.text}`}
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
                      <AppText variant="small" weight="700" color={selected ? t.colors.primaryText : t.colors.text}>
                        {o.text}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          ))}
          <Card style={{ gap: 10 }}>
            <AppText>{PC.bps.values}</AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[true, false].map((v) => {
                const selected = conflict === v;
                return (
                  <Pressable
                    key={String(v)}
                    onPress={() => setConflict(v)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={{ flex: 1, minHeight: 44, borderRadius: t.radius.md, borderWidth: 2, borderColor: selected ? t.colors.primary : t.colors.border, backgroundColor: selected ? t.colors.primary : t.colors.surface, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <AppText weight="700" color={selected ? t.colors.primaryText : t.colors.text}>
                      {v ? tr('pcampus.setup.yes') : tr('pcampus.setup.no')}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </Card>
          {band ? (
            <Card style={{ gap: 6, borderWidth: 2, borderColor: band.id === 'possible' ? t.colors.warning : t.colors.success }}>
              <AppText variant="tiny" weight="800" muted>
                {tr('pcampus.setup.bpsResult', { score })}
              </AppText>
              <AppText variant="h3">{band.title}</AppText>
              <AppText variant="small">{band.text}</AppText>
              {conflict ? (
                <AppText variant="small" muted>
                  {PC.bps.valuesNote}
                </AppText>
              ) : null}
            </Card>
          ) : null}
        </>
      ) : null}

      {step === 'values' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('pcampus.setup.valuesTitle')}
          </AppText>
          <AppText muted>{tr('pcampus.setup.valuesHint')}</AppText>
          <View style={{ gap: 10 }}>
            {PC.values.map((v) => (
              <ChoiceCard
                key={v.id}
                multi
                emoji={v.emoji}
                label={v.label}
                description={v.text}
                selected={valueIds.includes(v.id)}
                onPress={() => {
                  if (!valueIds.includes(v.id) && valueIds.length >= MAX_VALUES) {
                    setError(tr('pcampus.setup.valuesMax'));
                    return;
                  }
                  setError(null);
                  setValueIds((a) => toggle(a, v.id));
                }}
              />
            ))}
          </View>
          {error ? (
            <AppText variant="small" color={t.colors.danger} accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
        </>
      ) : null}

      {step === 'activities' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('pcampus.setup.activitiesTitle')}
          </AppText>
          <AppText muted>{tr('pcampus.setup.activitiesHint')}</AppText>
          <AppText variant="small" weight="800" color={activityIds.length >= MIN_ACTIVITIES ? t.colors.success : t.colors.primary}>
            {tr('pcampus.setup.activitiesCount', { count: activityIds.length })}
          </AppText>
          {PC.activityCategories.map((c) => (
            <View key={c.id} style={{ gap: 8 }}>
              <AppText weight="800">
                {c.emoji} {c.label}
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {PC.activities
                  .filter((a) => a.category === c.id)
                  .map((a) => (
                    <Chip
                      key={a.id}
                      emoji={a.emoji}
                      label={a.label}
                      selected={activityIds.includes(a.id)}
                      onPress={() => {
                        setError(null);
                        setActivityIds((x) => toggle(x, a.id));
                      }}
                    />
                  ))}
              </View>
            </View>
          ))}
          {error ? (
            <AppText variant="small" color={t.colors.danger} accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
        </>
      ) : null}

      {step === 'goal' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('pcampus.setup.goalTitle')}
          </AppText>
          <AppText muted>{tr('pcampus.setup.goalHint')}</AppText>
          <View style={{ gap: 10 }}>
            {PC_GOALS.map((g) => (
              <ChoiceCard key={g} label={tr(`pcampus.setup.goal.${g}`)} description={tr(`pcampus.setup.goal.${g}Desc`)} selected={goal === g} onPress={() => setGoal(g)} />
            ))}
          </View>
        </>
      ) : null}

      {step === 'summary' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('pcampus.setup.summaryTitle')}
          </AppText>
          <Card style={{ gap: 12 }}>
            <SummaryRow label={tr('pcampus.setup.summaryGoal')} value={tr(`pcampus.setup.goal.${goal}`)} />
            <SummaryRow label={tr('pcampus.setup.summaryValues')} value={PC.values.filter((v) => valueIds.includes(v.id)).map((v) => `${v.emoji} ${v.label}`).join('\n') || tr('pcampus.setup.none')} />
            <SummaryRow label={tr('pcampus.setup.summaryActivities')} value={PC.activities.filter((a) => activityIds.includes(a.id)).map((a) => `${a.emoji} ${a.label}`).join('\n') || tr('pcampus.setup.none')} />
            {band ? <SummaryRow label={tr('pcampus.setup.summaryBps')} value={`${score}/10 · ${band.title}`} /> : null}
          </Card>
        </>
      ) : null}

      {step === 'env' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('pcampus.setup.envTitle')}
          </AppText>
          <AppText muted>{tr('pcampus.setup.envHint')}</AppText>
          <View style={{ padding: 12, borderRadius: t.radius.md, backgroundColor: tint(t.colors.primary, '14') }}>
            <PcEnvChecklist doneIds={envIds} onToggle={(id) => setEnvIds((a) => toggle(a, id))} title={tr('pcampus.home.envTitle')} />
          </View>
        </>
      ) : null}

      {step === 'commit' ? <CommitmentView /> : null}
    </Screen>
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
