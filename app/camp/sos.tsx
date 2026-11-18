import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { CAMP_ONBOARDING as ONB, CAMP_SOS as SOS } from '@/features/camp/content';
import { plansForTrigger, resistedCount } from '@/features/camp/engine/sos';
import { IntensityScale, DelayTimer, FourECard, MatchGameView, ReasonsView, SosBreath, UrgeSurf } from '@/features/camp/sosTools';
import { currentAttempt } from '@/features/camp/state';
import type { ToolId, TriggerId } from '@/features/camp/types';
import { tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

type Stage = 'start' | 'tools' | 'end' | 'resisted' | 'smoked';
type SosTool = Exclude<ToolId, 'coach' | 'call171'>;
const TOOLS: { id: SosTool; emoji: string }[] = [
  { id: 'surf', emoji: '🌊' },
  { id: 'breath', emoji: '🫁' },
  { id: 'delay', emoji: '⏳' },
  { id: 'four_e', emoji: '✋' },
  { id: 'reasons', emoji: '🎯' },
  { id: 'game', emoji: '🧩' },
];
const TOOL_TITLE: Record<SosTool, string> = { surf: SOS.surf.title, breath: SOS.breath.title, delay: SOS.delay.title, four_e: SOS.fourE.title, reasons: SOS.reasons.title, game: SOS.game.title };

/**
 * "Canım çekiyor" crisis tool (always free, never behind the paywall). Full-screen, calm colours,
 * one hand: strength and trigger → urge surfing by default, other tools a tap away → how do you feel now.
 */
export default function CampSos() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const camp = useCampStore();
  const cravings = useCampEventsStore((s) => s.cravings);
  const [startedAt] = useState(() => Date.now());
  const [stage, setStage] = useState<Stage>('start');
  const [before, setBefore] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [trigger, setTrigger] = useState<TriggerId | null>(null);
  const [tool, setTool] = useState<SosTool>('surf');
  const [used, setUsed] = useState<ToolId[]>([]);
  const [hardNote, setHardNote] = useState(false);
  const [planUsed, setPlanUsed] = useState<string | null>(null);
  const profile = camp.profile;
  const attempt = currentAttempt(camp);
  const triggers = ONB.triggers.filter((x) => (profile?.triggers.length ? profile.triggers.includes(x.id) : true));
  const plans = plansForTrigger(camp.plans, trigger);
  const markUsed = (id: ToolId) => setUsed((u) => (u.includes(id) ? u : [...u, id]));

  const log = (outcome: 'resisted' | 'still_hard' | 'smoked') =>
    useCampEventsStore.getState().logCraving({ intensityBefore: before ?? 5, intensityAfter: after ?? undefined, trigger: trigger ?? undefined, toolUsed: used, outcome, durationSec: Math.round((Date.now() - startedAt) / 1000) });

  const close = () => {
    // Leaving mid-way after trying something still counts as a (hard) craving in the log.
    if (stage === 'tools' && used.length) log('still_hard');
    goBack('/camp');
  };
  const call171 = () => {
    markUsed('call171');
    void Linking.openURL('tel:171');
  };

  const footer =
    stage === 'resisted' || stage === 'smoked' ? (
      <Button label={tr('camp.sos.backToPanel')} size="lg" variant="primary" onPress={() => goBack('/camp')} />
    ) : (
      <View style={{ gap: 8 }}>
        {stage === 'start' ? <Button label={tr('camp.sos.go')} size="lg" variant="accent" disabled={before === null} onPress={() => setStage('tools')} /> : null}
        {stage === 'tools' ? <Button label={tr('camp.sos.finish')} size="lg" variant="primary" onPress={() => setStage('end')} /> : null}
        <Pressable
          onPress={call171}
          accessibilityRole="button"
          accessibilityLabel={tr('camp.ui.call171')}
          style={{ minHeight: 48, borderRadius: t.radius.pill, borderWidth: 1.5, borderColor: t.colors.success, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
        >
          <AppText>📞</AppText>
          <AppText weight="800" color={t.colors.success}>
            {tr('camp.ui.call171')}
          </AppText>
        </Pressable>
      </View>
    );

  return (
    <Screen footer={footer}>
      <Header title={tr('camp.sos.title')} close onBack={close} />

      {stage === 'start' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {SOS.intro}
          </AppText>
          <AppText weight="800">{tr('camp.sos.howStrong')}</AppText>
          <IntensityScale value={before} onChange={setBefore} label={tr('camp.sos.howStrong')} />
          <AppText weight="800">{tr('camp.sos.whatTriggered')}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {triggers.map((x) => {
              const on = trigger === x.id;
              return (
                <Pressable
                  key={x.id}
                  onPress={() => setTrigger(on ? null : x.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 48,
                    paddingHorizontal: 12,
                    borderRadius: t.radius.pill,
                    borderWidth: 1.5,
                    borderColor: on ? t.colors.accent : t.colors.border,
                    backgroundColor: on ? tint(t.colors.accent, '1A') : t.colors.surface,
                  }}
                >
                  <AppText>{x.emoji}</AppText>
                  <AppText variant="small" weight="700">
                    {x.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <AppText variant="tiny" muted>
            {tr('camp.sos.triggerOptional')}
          </AppText>
          {plans.map((p) => (
            <Card key={p.id} style={{ gap: 6, borderLeftWidth: 4, borderLeftColor: t.colors.accent }}>
              <AppText variant="tiny" weight="800" color={t.colors.accent}>
                {tr('camp.sos.yourPlan')}
              </AppText>
              <AppText weight="700">
                {tr('camp.plan.if')} {p.ifText}, {tr('camp.plan.then')} {p.thenText}.
              </AppText>
              <Button
                label={planUsed === p.id ? tr('camp.sos.planOn') : tr('camp.sos.planUse')}
                icon={planUsed === p.id ? 'check' : undefined}
                variant="secondary"
                disabled={planUsed === p.id}
                onPress={() => {
                  setPlanUsed(p.id);
                  useCampStore.getState().usePlan(p.id);
                }}
              />
            </Card>
          ))}
        </>
      ) : null}

      {stage === 'tools' ? (
        <>
          {hardNote ? (
            <Card style={{ borderLeftWidth: 4, borderLeftColor: t.colors.primary }}>
              <AppText variant="small">{SOS.end.hardBody}</AppText>
            </Card>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }} accessibilityRole="tablist">
            {TOOLS.map((x) => {
              const on = tool === x.id;
              return (
                <Pressable
                  key={x.id}
                  onPress={() => {
                    setTool(x.id);
                    // Reading-only tools count as used when opened.
                    if (x.id === 'four_e' || x.id === 'reasons') markUsed(x.id);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 48,
                    paddingHorizontal: 14,
                    borderRadius: t.radius.pill,
                    backgroundColor: on ? t.colors.primary : t.colors.surface,
                    borderWidth: 1.5,
                    borderColor: on ? t.colors.primary : t.colors.border,
                  }}
                >
                  <AppText>{x.emoji}</AppText>
                  <AppText variant="small" weight="800" color={on ? t.colors.primaryText : t.colors.text}>
                    {TOOL_TITLE[x.id]}
                  </AppText>
                  {used.includes(x.id) && !on ? <AppText variant="tiny">✓</AppText> : null}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => {
                markUsed('coach');
                router.push({ pathname: '/camp/coach', params: { scenario: 'craving' } });
              }}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingHorizontal: 14, borderRadius: t.radius.pill, backgroundColor: t.colors.surface, borderWidth: 1.5, borderColor: t.colors.border }}
            >
              <AppText>🧑‍🏫</AppText>
              <AppText variant="small" weight="800">
                {tr('camp.coach.sosTab')}
              </AppText>
            </Pressable>
          </ScrollView>
          <AppText variant="h2" accessibilityRole="header">
            {TOOL_TITLE[tool]}
          </AppText>
          {tool === 'surf' ? <UrgeSurf onUsed={() => markUsed('surf')} /> : null}
          {tool === 'breath' ? <SosBreath onUsed={() => markUsed('breath')} /> : null}
          {tool === 'delay' ? <DelayTimer onUsed={() => markUsed('delay')} /> : null}
          {tool === 'four_e' ? <FourECard /> : null}
          {tool === 'reasons' ? profile ? <ReasonsView profile={profile} /> : <AppText muted>{SOS.reasons.empty}</AppText> : null}
          {tool === 'game' ? <MatchGameView onUsed={() => markUsed('game')} /> : null}
          <AppText variant="small" muted>
            {SOS.alo}
          </AppText>
        </>
      ) : null}

      {stage === 'end' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {SOS.end.question}
          </AppText>
          <IntensityScale value={after} onChange={setAfter} label={SOS.end.question} />
          <View style={{ gap: 10, marginTop: 6 }}>
            <Button
              label={SOS.end.resisted}
              size="lg"
              variant="accent"
              onPress={() => {
                log('resisted');
                setStage('resisted');
              }}
            />
            <Button
              label={SOS.end.hard}
              variant="secondary"
              onPress={() => {
                setHardNote(true);
                const next = TOOLS.find((x) => !used.includes(x.id) && x.id !== tool);
                if (next) setTool(next.id);
                setStage('tools');
              }}
            />
            <Button
              label={SOS.end.smoked}
              variant="ghost"
              onPress={() => {
                log('smoked');
                // After the quit a cigarette is a slip: the slip flow logs it and helps plan the next time.
                if (attempt?.status === 'active') {
                  router.replace({ pathname: '/camp/slip', params: trigger ? { trigger } : {} });
                  return;
                }
                if (attempt) useCampEventsStore.getState().logCigarette({ attemptId: attempt.id, isSlip: false, trigger: trigger ?? undefined });
                setStage('smoked');
              }}
            />
          </View>
        </>
      ) : null}

      {stage === 'resisted' ? (
        <View style={{ alignItems: 'center', gap: 12, marginTop: 30 }}>
          <AppText variant="display">💪</AppText>
          <AppText variant="h1" center accessibilityRole="header">
            {SOS.end.resistedTitle}
          </AppText>
          <AppText muted center>
            {SOS.end.resistedBody}
          </AppText>
          <Card style={{ alignSelf: 'stretch', alignItems: 'center', backgroundColor: tint(t.colors.success, '14'), borderColor: t.colors.success, borderWidth: 2 }}>
            <AppText variant="h3" color={t.colors.success} center>
              {tr('camp.sos.resistedCount', { count: resistedCount(cravings) })}
            </AppText>
          </Card>
        </View>
      ) : null}

      {stage === 'smoked' ? (
        <View style={{ alignItems: 'center', gap: 12, marginTop: 30 }}>
          <AppText variant="display">🌱</AppText>
          <AppText variant="h1" center accessibilityRole="header">
            {attempt?.status === 'preparing' ? tr('camp.sos.prepLoggedTitle') : SOS.end.smokedTitle}
          </AppText>
          <AppText muted center>
            {attempt?.status === 'preparing' ? tr('camp.sos.prepLogged') : SOS.end.smokedBody}
          </AppText>
          <Button label={tr('camp.sos.tryAgain')} variant="secondary" onPress={() => router.replace('/camp/sos')} style={{ alignSelf: 'stretch' }} />
        </View>
      ) : null}
    </Screen>
  );
}
