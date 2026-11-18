import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, ProgressBar, Screen, useTheme } from '@/components';
import { ALC } from '@/features/campus/alcohol/content';
import { AUDIT_QUESTIONS, auditBand, auditScore, CUT_LIMITS, QUIT_GOALS, WITHDRAWAL_QUESTIONS, withdrawalRisk, type AlcMode } from '@/features/campus/alcohol/logic';
import { WithdrawalBanner } from '@/features/campus/alcohol/ui';
import { InfoToggle, tint } from '@/features/campus/shared/ui';
import { Chip, GuideStepView } from '@/features/campus/smoking/ui';
import { goBack } from '@/lib/nav';
import { CommitmentView, useCommitGate } from '@/features/campus/shared/commit';
import { useCampusStore } from '@/stores/campusStore';

type FormStep = 'audit' | 'withdrawal' | 'reasons' | 'path' | 'triggers' | 'summary' | 'commit';
type Step = FormStep | { guide: string };

/** Enrolment: test → safety → reasons → goal → risky situations, with the six guide sections in between. */
const ENROL_STEPS: Step[] = [
  { guide: 'what' },
  'audit',
  { guide: 'safety' },
  'withdrawal',
  'reasons',
  { guide: 'track' },
  'path',
  { guide: 'situations' },
  'triggers',
  { guide: 'body' },
  { guide: 'support' },
  'summary',
  'commit',
];
const EDIT_STEPS: Step[] = ['reasons', 'path', 'triggers', 'summary'];

export default function AlcSetup() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const existing = useCampusStore((x) => x.alcohol);
  const editing = edit === '1' && existing.setupDone;
  const steps = editing ? EDIT_STEPS : ENROL_STEPS;

  const [stepIdx, setStepIdx] = useState(0);
  const [audit, setAudit] = useState<(number | null)[]>(() => existing.audit ?? Array<number | null>(AUDIT_QUESTIONS).fill(null));
  const [withdrawal, setWithdrawal] = useState<(boolean | null)[]>(() => existing.withdrawal ?? Array<boolean | null>(WITHDRAWAL_QUESTIONS).fill(null));
  const [reasonIds, setReasonIds] = useState<string[]>(editing ? existing.reasonIds : []);
  const [triggerIds, setTriggerIds] = useState<string[]>(editing ? existing.triggerIds : []);
  const [mode, setMode] = useState<AlcMode>(editing ? existing.mode : 'cut');
  const [limit, setLimit] = useState<number>(editing ? existing.weeklyLimit : 10);
  const [quitGoal, setQuitGoal] = useState<number>(editing ? existing.quitGoalDays : 30);
  const [showError, setShowError] = useState(false);

  const step = steps[stepIdx]!;
  // The commitment page holds the enrol button for a few seconds.
  const commitLeft = useCommitGate(step === 'commit');
  const locked = step === 'commit' && commitLeft > 0;
  const guide = typeof step === 'object' ? ALC.steps.findIndex((x) => x.id === step.guide) : -1;
  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  const auditDone = audit.every((a) => a !== null);
  const score = auditScore(auditDone ? (audit as number[]) : null);
  const band = auditDone ? auditBand(score, ALC.audit.bands) : undefined;
  const withdrawalDone = withdrawal.every((a) => a !== null);
  const risk = withdrawalRisk(withdrawalDone ? (withdrawal as boolean[]) : existing.withdrawal);

  const next = () => {
    if (step === 'reasons' && reasonIds.length === 0) {
      setShowError(true);
      return;
    }
    setShowError(false);
    if (stepIdx === steps.length - 1) {
      useCampusStore.getState().saveAlcSetup({
        mode,
        ...(mode === 'cut' ? { weeklyLimit: limit } : { quitGoalDays: quitGoal }),
        reasonIds,
        triggerIds,
        ...(editing
          ? {}
          : { audit: auditDone ? (audit as number[]) : null, withdrawal: withdrawalDone ? (withdrawal as boolean[]) : null, guideReadIds: ALC.steps.map((x) => x.id) }),
      });
      router.replace('/campus/alcohol');
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
  const nextLabel = stepIdx === 0 && !editing ? tr('acampus.setup.start') : isLast ? (editing ? tr('acampus.setup.save') : tr('acampus.setup.enrol')) : tr('common.next');

  return (
    <Screen footer={<Button label={locked ? tr('campusCommit.wait', { count: commitLeft }) : nextLabel} size="lg" variant={isLast ? 'accent' : 'primary'} disabled={locked} onPress={next} />}>
      <Header title={tr('acampus.setup.header')} onBack={back} />
      <View style={{ gap: 6 }}>
        <ProgressBar value={(stepIdx + 1) / steps.length} height={6} accessibilityLabel={tr('acampus.setup.stepOf', { n: stepIdx + 1, total: steps.length })} />
        <AppText variant="tiny" muted>
          {tr('acampus.setup.stepOf', { n: stepIdx + 1, total: steps.length })}
        </AppText>
      </View>

      {guide >= 0 ? (
        <>
          <GuideStepView step={ALC.steps[guide]!} n={guide + 1} total={ALC.steps.length} />
          {stepIdx === 0 ? (
            <AppText variant="small" muted center>
              {tr('acampus.setup.privacy')}
            </AppText>
          ) : null}
        </>
      ) : null}

      {step === 'audit' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('acampus.setup.auditTitle')}
          </AppText>
          <AppText muted>{tr('acampus.setup.auditHint')}</AppText>
          <InfoToggle title={ALC.info.audit.title} text={ALC.info.audit.text} />
          <View style={{ padding: 12, borderRadius: t.radius.md, backgroundColor: tint(t.colors.primary, '1A') }}>
            <AppText variant="small">🍺 {ALC.audit.standardNote}</AppText>
          </View>
          {ALC.audit.questions.map((q, qi) => (
            <Card key={q.id} style={{ gap: 8 }}>
              <AppText weight="800">
                {qi + 1}. {q.text}
              </AppText>
              {q.options.map((o) => {
                const selected = audit[qi] === o.score;
                return (
                  <Pressable
                    key={o.text}
                    onPress={() => setAudit((a) => a.map((x, j) => (j === qi ? o.score : x)))}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${q.text} ${o.text}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      minHeight: 44,
                      paddingHorizontal: 12,
                      borderRadius: t.radius.md,
                      borderWidth: 2,
                      borderColor: selected ? t.colors.primary : t.colors.border,
                      backgroundColor: selected ? tint(t.colors.primary, '22') : t.colors.surface,
                    }}
                  >
                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: selected ? t.colors.primary : t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
                      {selected ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.primary }} /> : null}
                    </View>
                    <AppText style={{ flex: 1 }}>{o.text}</AppText>
                  </Pressable>
                );
              })}
            </Card>
          ))}
          {band ? (
            <Card style={{ gap: 6, borderWidth: 2, borderColor: band.id === 'high' ? t.colors.danger : band.id === 'risky' ? t.colors.warning : t.colors.success }}>
              <AppText variant="tiny" weight="800" muted>
                {tr('acampus.setup.auditResult', { score })}
              </AppText>
              <AppText variant="h3">{band.title}</AppText>
              <AppText variant="small">{band.text}</AppText>
            </Card>
          ) : null}
          <AppText variant="tiny" muted>
            {ALC.audit.disclaimer}
          </AppText>
        </>
      ) : null}

      {step === 'withdrawal' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('acampus.setup.withdrawalTitle')}
          </AppText>
          <AppText muted>{tr('acampus.setup.withdrawalHint')}</AppText>
          {ALC.withdrawal.questions.map((q, i) => (
            <Card key={q.id} style={{ gap: 10 }}>
              <AppText>{q.text}</AppText>
              <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
                {[true, false].map((v) => {
                  const selected = withdrawal[i] === v;
                  return (
                    <Pressable
                      key={String(v)}
                      onPress={() => setWithdrawal((a) => a.map((x, j) => (j === i ? v : x)))}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${q.text} ${v ? tr('acampus.setup.yes') : tr('acampus.setup.no')}`}
                      style={{
                        flex: 1,
                        minHeight: 44,
                        borderRadius: t.radius.md,
                        borderWidth: 2,
                        borderColor: selected ? (v ? t.colors.danger : t.colors.primary) : t.colors.border,
                        backgroundColor: selected ? (v ? t.colors.danger : t.colors.primary) : t.colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AppText weight="700" color={selected ? '#FFFFFF' : t.colors.text}>
                        {v ? tr('acampus.setup.yes') : tr('acampus.setup.no')}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          ))}
          {withdrawalDone ? (
            risk ? (
              <WithdrawalBanner />
            ) : (
              <Card style={{ gap: 6, borderWidth: 2, borderColor: t.colors.success }}>
                <AppText variant="small">✅ {ALC.withdrawal.okText}</AppText>
                <AppText variant="small" weight="700">
                  {ALC.withdrawal.emergency}
                </AppText>
              </Card>
            )
          ) : null}
        </>
      ) : null}

      {step === 'reasons' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('acampus.setup.reasonsTitle')}
          </AppText>
          <AppText muted>{tr('acampus.setup.reasonsHint')}</AppText>
          <View style={{ gap: 10 }}>
            {ALC.reasons.map((r) => (
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
              {tr('acampus.setup.reasonsError')}
            </AppText>
          ) : null}
        </>
      ) : null}

      {step === 'path' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('acampus.setup.pathTitle')}
          </AppText>
          <AppText muted>{tr('acampus.setup.pathHint')}</AppText>
          {risk ? (
            <View style={{ padding: 12, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.danger, backgroundColor: tint(t.colors.danger, '14') }}>
              <AppText variant="small">⚠️ {tr('acampus.setup.riskNote')}</AppText>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(['cut', 'quit'] as const).map((id) => {
              const p = ALC.paths[id];
              const selected = mode === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setMode(id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${p.title}. ${p.text}`}
                  style={{
                    flex: 1,
                    gap: 6,
                    padding: 14,
                    borderRadius: t.radius.xl,
                    borderWidth: 2,
                    borderColor: selected ? t.colors.primary : t.colors.border,
                    backgroundColor: selected ? tint(t.colors.primary, '1A') : t.colors.surface,
                  }}
                >
                  <AppText variant="h1">{p.emoji}</AppText>
                  <AppText variant="h3">{p.title}</AppText>
                  <AppText variant="small" muted>
                    {p.text}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <Card style={{ gap: 6 }}>
            {ALC.paths[mode].points.map((pt) => (
              <View key={pt} style={{ flexDirection: 'row', gap: 8 }}>
                <AppText weight="800" color={t.colors.primary}>
                  ✓
                </AppText>
                <AppText variant="small" style={{ flex: 1 }}>
                  {pt}
                </AppText>
              </View>
            ))}
          </Card>
          <AppText variant="h3">{mode === 'cut' ? tr('acampus.setup.limitTitle') : tr('acampus.setup.quitTitle')}</AppText>
          <View style={{ gap: 10 }}>
            {mode === 'cut'
              ? CUT_LIMITS.map((l) => (
                  <ChoiceCard key={l} label={tr('acampus.setup.limitOption', { count: l })} description={tr(`acampus.setup.limitDesc.${l}`)} selected={limit === l} onPress={() => setLimit(l)} />
                ))
              : QUIT_GOALS.map((g) => (
                  <ChoiceCard key={g} label={tr('acampus.setup.quitOption', { count: g })} description={tr(`acampus.setup.quitDesc.${g}`)} selected={quitGoal === g} onPress={() => setQuitGoal(g)} />
                ))}
          </View>
        </>
      ) : null}

      {step === 'triggers' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('acampus.setup.triggersTitle')}
          </AppText>
          <AppText muted>{tr('acampus.setup.triggersHint')}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ALC.triggers.map((x) => (
              <Chip key={x.id} emoji={x.emoji} label={x.label} selected={triggerIds.includes(x.id)} onPress={() => setTriggerIds((a) => toggle(a, x.id))} />
            ))}
          </View>
        </>
      ) : null}

      {step === 'summary' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {tr('acampus.setup.summaryTitle')}
          </AppText>
          {risk ? <WithdrawalBanner /> : null}
          <Card style={{ gap: 12 }}>
            <SummaryRow label={tr('acampus.setup.summaryPath')} value={mode === 'cut' ? tr('acampus.setup.summaryCut', { count: limit }) : tr('acampus.setup.summaryQuit', { count: quitGoal })} />
            {band ? <SummaryRow label={tr('acampus.setup.summaryAudit')} value={`${score}/12 · ${band.title}`} /> : null}
            <SummaryRow label={tr('acampus.setup.summaryReasons')} value={ALC.reasons.filter((r) => reasonIds.includes(r.id)).map((r) => `${r.emoji} ${r.label}`).join('\n') || tr('acampus.setup.none')} />
            <SummaryRow label={tr('acampus.setup.summaryTriggers')} value={ALC.triggers.filter((x) => triggerIds.includes(x.id)).map((x) => `${x.emoji} ${x.label}`).join('\n') || tr('acampus.setup.none')} />
          </Card>
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
