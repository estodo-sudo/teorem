import type { IconName } from '@/components/Icon';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Icon, Screen, useTheme } from '@/components';
import { Button, Card, Chip, IconTile, ScalePressable } from '@/components/ui';
import { ThemeOverride } from '@/components/useTheme';
import { CAMP_ONBOARDING as ONB, CAMP_SOS as SOS } from '@/features/camps/smoking/content';
import { plansForTrigger, resistedCount } from '@/features/camps/smoking/engine/sos';
import { IntensityScale, DelayTimer, FourECard, MatchGameView, ReasonsView, SosBreath, UrgeSurf } from '@/features/camps/smoking/sosTools';
import { currentAttempt } from '@/features/camps/smoking/state';
import type { ToolId, TriggerId } from '@/features/camps/smoking/types';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

type Stage = 'start' | 'tools' | 'end' | 'resisted' | 'smoked';
type SosTool = Exclude<ToolId, 'coach' | 'call171'>;
const TOOLS: { id: SosTool; icon: IconName }[] = [
  { id: 'surf', icon: 'waves' },
  { id: 'breath', icon: 'wind' },
  { id: 'delay', icon: 'hourglass' },
  { id: 'four_e', icon: 'hand' },
  { id: 'reasons', icon: 'target' },
  { id: 'game', icon: 'puzzle' },
];
const TOOL_TITLE: Record<SosTool, string> = { surf: SOS.surf.title, breath: SOS.breath.title, delay: SOS.delay.title, four_e: SOS.fourE.title, reasons: SOS.reasons.title, game: SOS.game.title };

/**
 * "Canım çekiyor" crisis tool (always free, never behind the paywall). Full-screen, calm colours,
 * one hand: strength and trigger → urge surfing by default, other tools a tap away → how do you feel now.
 * ui-v3 (SPEC_UI_V3 §7.13): always dark and calm — a big slider, icon chips, big tool cards and the
 * support line as an outline button at the bottom.
 */
export default function CampSos() {
  return (
    <ThemeOverride dark>
      <StatusBar style="light" />
      <CampSosBody />
    </ThemeOverride>
  );
}

function CampSosBody() {
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
      <Button label={tr('camp.sos.backToPanel')} size="lg" onPress={() => goBack('/camp')} fullWidth />
    ) : (
      <View style={{ gap: t.space.sm }}>
        {stage === 'start' ? <Button label={tr('camp.sos.go')} size="lg" disabled={before === null} onPress={() => setStage('tools')} fullWidth /> : null}
        {stage === 'tools' ? <Button label={tr('camp.sos.finish')} size="lg" onPress={() => setStage('end')} fullWidth /> : null}
        <Button label={tr('camp.ui.call171')} icon="phone" variant="outline" onPress={call171} fullWidth />
      </View>
    );

  return (
    <Screen footer={footer}>
      <Header title={tr('camp.sos.title')} close onBack={close} />

      {stage === 'start' ? (
        <>
          <AppText variant="title2" accessibilityRole="header">
            {SOS.intro}
          </AppText>
          <View style={{ gap: t.space.sm }}>
            <AppText variant="title3">{tr('camp.sos.howStrong')}</AppText>
            <IntensityScale value={before} onChange={setBefore} label={tr('camp.sos.howStrong')} />
          </View>
          <View style={{ gap: t.space.sm }}>
            <AppText variant="title3">{tr('camp.sos.whatTriggered')}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }} accessibilityRole="radiogroup">
              {triggers.map((x) => (
                <Chip key={x.id} icon={x.icon} label={x.label} selected={trigger === x.id} onPress={() => setTrigger(trigger === x.id ? null : x.id)} />
              ))}
            </View>
            <AppText variant="footnote" muted>
              {tr('camp.sos.triggerOptional')}
            </AppText>
          </View>
          {plans.map((p) => (
            <Card key={p.id} style={{ gap: t.space.sm, padding: t.space.lg }}>
              <AppText variant="caption" muted>
                {tr('camp.sos.yourPlan')}
              </AppText>
              <AppText variant="bodyStrong">
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
            <View style={{ padding: t.space.lg, borderRadius: t.radius.lg, backgroundColor: t.tokens.muted }}>
              <AppText variant="callout">{SOS.end.hardBody}</AppText>
            </View>
          ) : null}
          {/* Big tool cards in one scrolling row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -t.space.gutter }} contentContainerStyle={{ gap: t.space.sm, paddingHorizontal: t.space.gutter, paddingVertical: 2 }} accessibilityRole="tablist">
            {TOOLS.map((x) => (
              <ToolCard
                key={x.id}
                icon={x.icon}
                title={TOOL_TITLE[x.id]}
                selected={tool === x.id}
                done={used.includes(x.id)}
                onPress={() => {
                  setTool(x.id);
                  // Reading-only tools count as used when opened.
                  if (x.id === 'four_e' || x.id === 'reasons') markUsed(x.id);
                }}
              />
            ))}
            <ToolCard
              icon="chat"
              title={tr('camp.coach.sosTab')}
              selected={false}
              done={used.includes('coach')}
              onPress={() => {
                markUsed('coach');
                router.push({ pathname: '/camp/coach', params: { scenario: 'craving' } });
              }}
            />
          </ScrollView>
          <AppText variant="title2" accessibilityRole="header">
            {TOOL_TITLE[tool]}
          </AppText>
          {tool === 'surf' ? <UrgeSurf onUsed={() => markUsed('surf')} /> : null}
          {tool === 'breath' ? <SosBreath onUsed={() => markUsed('breath')} /> : null}
          {tool === 'delay' ? <DelayTimer onUsed={() => markUsed('delay')} /> : null}
          {tool === 'four_e' ? <FourECard /> : null}
          {tool === 'reasons' ? profile ? <ReasonsView profile={profile} /> : <AppText muted>{SOS.reasons.empty}</AppText> : null}
          {tool === 'game' ? <MatchGameView onUsed={() => markUsed('game')} /> : null}
          <AppText variant="footnote" muted>
            {SOS.alo}
          </AppText>
        </>
      ) : null}

      {stage === 'end' ? (
        <>
          <AppText variant="title2" accessibilityRole="header">
            {SOS.end.question}
          </AppText>
          <IntensityScale value={after} onChange={setAfter} label={SOS.end.question} />
          <View style={{ gap: 10, marginTop: 6 }}>
            <Button
              label={SOS.end.resisted}
              size="lg"
              fullWidth
              onPress={() => {
                log('resisted');
                setStage('resisted');
              }}
            />
            <Button
              label={SOS.end.hard}
              variant="secondary"
              fullWidth
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
              fullWidth
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
        <View style={{ alignItems: 'center', gap: t.space.md, marginTop: 30 }}>
          <IconTile icon="dumbbell" tone="smokefree" size="lg" round />
          <AppText variant="title1" center accessibilityRole="header">
            {SOS.end.resistedTitle}
          </AppText>
          <AppText muted center>
            {SOS.end.resistedBody}
          </AppText>
          <View style={{ alignSelf: 'stretch', alignItems: 'center', padding: t.space.lg, borderRadius: t.radius.lg, backgroundColor: t.tokens.successSoft }}>
            <AppText variant="title3" center>
              {tr('camp.sos.resistedCount', { count: resistedCount(cravings) })}
            </AppText>
          </View>
        </View>
      ) : null}

      {stage === 'smoked' ? (
        <View style={{ alignItems: 'center', gap: t.space.md, marginTop: 30 }}>
          <IconTile icon="sprout" tone="smokefree" size="lg" round />
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

/** A big SOS tool card in the scrolling row: icon tile, title, a small check once used. */
function ToolCard({ icon, title, selected, done, onPress }: { icon: IconName; title: string; selected: boolean; done: boolean; onPress: () => void }) {
  const t = useTheme();
  const k = t.tokens;
  return (
    <ScalePressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      style={{ width: 128, minHeight: 112, padding: t.space.md, gap: t.space.sm, borderRadius: t.radius.lg, borderWidth: selected ? t.border.medium : t.border.thin, borderColor: selected ? k.primary : k.border, backgroundColor: selected ? k.primarySoft : k.card }}
    >
      <IconTile icon={icon} tone="smokefree" />
      <AppText variant="footnote" style={{ fontWeight: '600' }}>
        {title}
      </AppText>
      {done ? (
        <View style={{ position: 'absolute', right: t.space.sm, top: t.space.sm }}>
          <Icon name="check" size="sm" color={k.primary} />
        </View>
      ) : null}
    </ScalePressable>
  );
}
