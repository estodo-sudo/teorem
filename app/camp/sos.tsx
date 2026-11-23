import type { IconName } from '@/components/Icon';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Header, Icon, Screen, useTheme } from '@/components';
import { Button, Card, IconTile, ScalePressable } from '@/components/ui';
import { mmss, useCountdown } from '@/features/camps/core/sosTools';
import { CAMP_ONBOARDING as ONB, CAMP_SOS as SOS } from '@/features/camps/smoking/content';
import { triggerOrder } from '@/features/camps/smoking/engine/panel';
import { resistedCount } from '@/features/camps/smoking/engine/sos';
import { DELAY_MINUTES, DelayTimer, ReasonsView } from '@/features/camps/smoking/sosTools';
import { currentAttempt } from '@/features/camps/smoking/state';
import type { ActiveToolId, ToolId, TriggerId } from '@/features/camps/smoking/types';
import { BlockPuzzle } from '@/features/games/BlockPuzzle/BlockPuzzle';
import { goBack } from '@/lib/nav';
import { useScreenReader } from '@/lib/useScreenReader';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

type Stage = 'start' | 'tools' | 'end' | 'resisted' | 'smoked';
type SosTool = Exclude<ActiveToolId, 'call171'>;
/** The block puzzle, the delay and the reasons (breathing removed, user request 2026-11-23). */
export const SOS_TOOL_ORDER: { id: SosTool; icon: IconName }[] = [
  { id: 'puzzle', icon: 'blocks' },
  { id: 'delay', icon: 'hourglass' },
  { id: 'reasons', icon: 'target' },
];

/**
 * "Canım çekiyor" crisis tool (always free, never behind the paywall), calm, in the app theme (it used
 * to be always dark; in the light theme that read as a broken screen).
 * Flow: what triggered it → Başla → a tool → "Bitirdim" → outcome. The urge-strength gauges were removed
 * (user request 2026-11-23: "miktarı kaldır, sadece ne tetikledi kalsın"); the log keeps 0 = not rated. "Hâlâ zor" suggests the next tool not used yet. The 10-minute delay keeps
 * running as a small chip while another tool is open.
 */
export default function CampSos() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <CampSosBody />
    </>
  );
}

function CampSosBody() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const camp = useCampStore();
  const cravings = useCampEventsStore((s) => s.cravings);
  const cigarettes = useCampEventsStore((s) => s.cigarettes);
  const [startedAt] = useState(() => Date.now());
  const [stage, setStage] = useState<Stage>('start');
  const [triggers, setTriggers] = useState<TriggerId[]>([]);
  const [otherOn, setOtherOn] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [tool, setTool] = useState<SosTool>('puzzle');
  const [used, setUsed] = useState<ToolId[]>([]);
  const [hardNote, setHardNote] = useState(false);
  const [planUsed, setPlanUsed] = useState<string | null>(null);
  const screenReader = useScreenReader();
  const delay = useCountdown(DELAY_MINUTES * 60);
  const profile = camp.profile;
  const attempt = currentAttempt(camp);
  const order = triggerOrder(
    ONB.triggers.map((x) => x.id),
    cravings,
    cigarettes,
  );
  const assessed = new Set(profile?.triggers ?? []);
  const plans = camp.plans.filter((p) => p.trigger !== 'custom' && triggers.includes(p.trigger));
  const markUsed = (id: ToolId) => setUsed((u) => (u.includes(id) ? u : [...u, id]));
  const delayActive = delay.running || (delay.elapsed > 0 && !delay.finished);

  const log = (outcome: 'resisted' | 'still_hard' | 'smoked') =>
    useCampEventsStore.getState().logCraving({
      // 0 = not rated (kept out of averages); the gauge is no longer asked.
      intensityBefore: 0,
      trigger: triggers[0],
      triggers: triggers.length > 1 ? triggers : undefined,
      otherTrigger: otherOn && otherText.trim() ? otherText.trim() : undefined,
      toolUsed: used,
      outcome,
      durationSec: Math.round((Date.now() - startedAt) / 1000),
    });

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
        {stage === 'start' ? <Button label={tr('camp.sos.go')} size="lg" onPress={() => setStage('tools')} fullWidth /> : null}
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
            <AppText variant="title3">{tr('camp.sos.whatTriggered')}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm }}>
              {order.map((id) => {
                const x = ONB.triggers.find((o) => o.id === id)!;
                return <TriggerChip key={id} icon={x.icon} label={x.label} selected={triggers.includes(id)} assessed={assessed.has(id)} onPress={() => setTriggers((s) => (s.includes(id) ? s.filter((y) => y !== id) : [...s, id]))} />;
              })}
              <TriggerChip icon="plus" label={tr('camp.sos.other')} selected={otherOn} onPress={() => setOtherOn((v) => !v)} />
            </View>
            {otherOn ? (
              <TextInput maxFontSizeMultiplier={1.3}
                value={otherText}
                onChangeText={setOtherText}
                placeholder={tr('camp.sos.otherPlaceholder')}
                placeholderTextColor={t.tokens.subtle}
                maxLength={60}
                accessibilityLabel={tr('camp.sos.other')}
                style={{ minHeight: 48, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.tokens.border, paddingHorizontal: t.space.md, color: t.tokens.foreground, fontFamily: t.family.regular, fontSize: 16 }}
              />
            ) : null}
            <AppText variant="footnote" muted>
              {assessed.size ? tr('camp.sos.triggerHint') : tr('camp.sos.triggerOptional')}
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
          {delayActive && tool !== 'delay' ? (
            <Pressable
              onPress={() => setTool('delay')}
              accessibilityRole="button"
              accessibilityLabel={tr('camp.sos.delayChipA11y', { time: mmss(delay.left) })}
              style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingHorizontal: 12, borderRadius: t.radius.pill, backgroundColor: t.tokens.muted }}
            >
              <Icon name="hourglass" size="sm" color={t.tokens.foreground} />
              <AppText variant="footnote" weight="600" tabular>
                {mmss(delay.left)}
              </AppText>
            </Pressable>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -t.space.gutter }} contentContainerStyle={{ gap: t.space.sm, paddingHorizontal: t.space.gutter, paddingVertical: 2 }} accessibilityRole="tablist">
            {SOS_TOOL_ORDER.map((x) => (
              <ToolCard
                key={x.id}
                icon={x.icon}
                title={SOS[x.id].title}
                selected={tool === x.id}
                done={used.includes(x.id)}
                onPress={() => {
                  setTool(x.id);
                  // Reading-only tools count as used when opened.
                  if (x.id === 'reasons') markUsed(x.id);
                }}
              />
            ))}
          </ScrollView>
          <AppText variant="title2" accessibilityRole="header">
            {SOS[tool].title}
          </AppText>
          {tool === 'puzzle' ? (
            screenReader ? (
              <View style={{ gap: t.space.md }}>
                <AppText muted>{SOS.puzzle.srHint}</AppText>
                <Button label={SOS.delay.title} icon="hourglass" variant="secondary" onPress={() => setTool('delay')} />
              </View>
            ) : (
              <>
                <AppText muted>{SOS.puzzle.desc}</AppText>
                <BlockPuzzle color={t.tone.smokefree.fg} onPlayed={() => markUsed('puzzle')} />
              </>
            )
          ) : null}
          {tool === 'delay' ? <DelayTimer cd={delay} onUsed={() => markUsed('delay')} /> : null}
          {tool === 'reasons' ? profile ? <ReasonsView profile={profile} /> : <AppText muted>{SOS.reasons.empty}</AppText> : null}
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
                const next = SOS_TOOL_ORDER.find((x) => !used.includes(x.id) && x.id !== tool);
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
                  router.replace({ pathname: '/camp/slip', params: triggers[0] ? { trigger: triggers[0] } : {} });
                  return;
                }
                if (attempt) useCampEventsStore.getState().logCigarette({ attemptId: attempt.id, isSlip: false, trigger: triggers[0] });
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

/**
 * A trigger chip: every catalogue trigger is always shown (SPEC_V4 §C.2). Selected: filled with the
 * primary colour; picked in the assessment: a small dot.
 */
function TriggerChip({ icon, label, selected, assessed, onPress }: { icon: IconName; label: string; selected: boolean; assessed?: boolean; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const k = t.tokens;
  const fg = selected ? k.primaryForeground : k.foreground;
  return (
    <ScalePressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={assessed ? `${label}, ${tr('camp.sos.assessedA11y')}` : label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingHorizontal: 14, borderRadius: t.radius.pill, borderWidth: 1, borderColor: selected ? k.primary : k.border, backgroundColor: selected ? k.primary : 'transparent' }}
    >
      <Icon name={icon} size={16} color={fg} />
      <AppText variant="callout" weight="600" color={fg}>
        {label}
      </AppText>
      {assessed ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: selected ? fg : k.primary }} /> : null}
    </ScalePressable>
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
