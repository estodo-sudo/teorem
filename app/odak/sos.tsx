import type { IconName } from '@/components/Icon';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, Icon, ProgressBar, Screen, useTheme } from '@/components';
import { IconTile } from '@/components/ui';
import { mmss, useCountdown } from '@/features/camps/core/sosTools';
import { BlockPuzzle } from '@/features/games/BlockPuzzle/BlockPuzzle';
import { useScreenReader } from '@/lib/useScreenReader';
import { fill, ODAK_PANEL as P, ODAK_SOS as SOS } from '@/features/camps/odak/content';
import { buildUrge, dayyCount, managedCount, nextTool, noDayy, SOS_TOOLS, type Dayy } from '@/features/camps/odak/engine/sos';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import type { BehaviorKind, OdakToolId, UrgeEvent } from '@/features/camps/odak/types';
import { tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';

type Step = 'check' | 'relocate' | 'tools' | 'end' | 'result';

/**
 * "Dürtü anı" (SOS, SPEC_ODAK_KAMPI 5.2): DAYY check (whole rows) → move first (60 s) → tools
 * ("Yapabileceklerin": simple steps anyone can take, ticked as done; and the block puzzle) → managed /
 * still hard (the other tool) / slipped (no judgement). Breath, movement, values, future self, "write
 * to someone", the urge gauge and the "still hard" note were removed (user request 2026-11-23).
 * Always free; calm, in the focus (indigo) tone and the app theme.
 */
export default function OdakSos() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <OdakSosBody />
    </>
  );
}

function OdakSosBody() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const urges = useOdakStore((s) => s.urges);
  const [startedAt] = useState(() => new Date());
  const [step, setStep] = useState<Step>('check');
  const [dayy, setDayy] = useState<Dayy>(noDayy);
  const [tool, setTool] = useState<OdakToolId>('actions');
  const screenReader = useScreenReader();
  const [used, setUsed] = useState<OdakToolId[]>([]);
  const [result, setResult] = useState<UrgeEvent | null>(null);
  const [slipLogged, setSlipLogged] = useState(false);
  const use = useCallback((id: OdakToolId) => setUsed((u) => (u.includes(id) ? u : [...u, id])), []);
  const toolTitle = (id: OdakToolId) => SOS.tools.items.find((x) => x.id === id)?.title ?? id;

  const finish = async (outcome: UrgeEvent['outcome']) => {
    const u = buildUrge({ startedAt, endedAt: new Date(), intensityBefore: 0, intensityAfter: null, dayy, toolsUsed: used, outcome });
    await useOdakStore.getState().logUrge(u);
    setResult(u);
    setStep('result');
  };
  const stillHard = () => {
    const n = nextTool(used);
    setTool(n);
    setStep('tools');
  };
  const logSlip = async (kind: BehaviorKind) => {
    await useOdakStore.getState().logBehavior(kind);
    setSlipLogged(true);
  };

  const footer =
    step === 'check' ? (
      <Button label={tr('odak.sos.next')} size="lg" onPress={() => setStep('relocate')} />
    ) : step === 'relocate' ? (
      <Button label={tr('odak.sos.toTools')} size="lg" onPress={() => setStep('tools')} />
    ) : step === 'tools' ? (
      <Button label={tr('odak.sos.toEnd')} size="lg" onPress={() => setStep('end')} />
    ) : step === 'result' ? (
      <Button label={SOS.end.back} size="lg" onPress={() => goBack('/odak')} />
    ) : undefined;

  return (
    <Screen footer={footer}>
      <Header title={P.sosStub.title} close onBack={() => goBack('/odak')} right={<QuickExitButton />} />

      {step === 'check' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {SOS.check.title}
          </AppText>
          <AppText muted>{SOS.check.hint}</AppText>
          <View style={{ gap: 10 }}>
            {SOS.check.items.map((it) => (
              <DayyRow key={it.id} icon={it.icon} letter={it.letter} label={it.label} selected={dayy[it.id]} onPress={() => setDayy((d) => ({ ...d, [it.id]: !d[it.id] }))} />
            ))}
          </View>
          {dayyCount(dayy) ? (
            <Card style={{ gap: 6, backgroundColor: t.tokens.muted, borderColor: t.tokens.muted }}>
              {SOS.check.items
                .filter((it) => dayy[it.id])
                .map((it) => (
                  <AppText key={it.id} variant="small">
                    {it.tip}
                  </AppText>
                ))}
            </Card>
          ) : null}
          {/* The urge-strength gauge was removed (user request 2026-11-23); the log keeps 0 = not rated. */}
        </>
      ) : null}

      {step === 'relocate' ? <Relocate onUsed={() => use('relocate')} /> : null}

      {step === 'tools' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {SOS.tools.title}
          </AppText>
          <AppText muted>{SOS.tools.hint}</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -t.space.gutter }} contentContainerStyle={{ gap: t.space.sm, paddingHorizontal: t.space.gutter }}>
            {SOS_TOOLS.map((id) => {
              const it = SOS.tools.items.find((x) => x.id === id)!;
              const on = tool === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setTool(id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${it.title}. ${it.desc}`}
                  style={{ width: 156, minHeight: 112, padding: t.space.md, gap: t.space.sm, borderRadius: t.radius.lg, borderWidth: on ? t.border.medium : t.border.thin, borderColor: on ? t.tokens.primary : t.tokens.border, backgroundColor: on ? t.tokens.primarySoft : t.tokens.card }}
                >
                  <IconTile icon={it.icon} tone="focus" />
                  <AppText variant="footnote" style={{ fontWeight: '600' }}>
                    {it.title}
                  </AppText>
                  {used.includes(id) ? <Icon name="check" color={t.tokens.primary} size="sm" /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
          {tool === 'puzzle' ? (
            screenReader ? (
              <View style={{ gap: t.space.md }}>
                <AppText muted>{SOS.puzzle.srHint}</AppText>
                <Button label={toolTitle('actions')} icon="clipboard" variant="secondary" onPress={() => setTool('actions')} />
              </View>
            ) : (
              <>
                <AppText muted>{SOS.puzzle.desc}</AppText>
                <BlockPuzzle color={t.tone.focus.fg} onPlayed={() => use('puzzle')} />
              </>
            )
          ) : null}
          {tool === 'actions' ? <Actions key="actions" onUsed={() => use('actions')} /> : null}
        </>
      ) : null}

      {step === 'end' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {SOS.end.question}
          </AppText>
          <View style={{ gap: 10 }}>
            <Button label={SOS.end.managed} size="lg" variant="primary" onPress={() => void finish('managed')} />
            <Button label={SOS.end.hard} size="lg" variant="secondary" onPress={stillHard} />
            <Button label={SOS.end.slipped} variant="ghost" onPress={() => void finish('slipped')} />
          </View>
        </>
      ) : null}

      {step === 'result' && result ? (
        result.outcome === 'managed' ? (
          <Card style={{ gap: 10, alignItems: 'center', padding: t.space.gutter }}>
            <IconTile icon="leaf" tone="focus" size="lg" round />
            <AppText variant="h2" center accessibilityRole="header">
              {SOS.end.managedTitle}
            </AppText>
            <AppText center>{SOS.end.managedBody}</AppText>
            <AppText weight="800" center color={t.tokens.success} accessibilityLiveRegion="polite">
              {fill(SOS.end.count, { n: managedCount(urges) })}
            </AppText>
          </Card>
        ) : (
          <>
            <Card style={{ gap: 10 }}>
              <AppText variant="h2" accessibilityRole="header">
                {SOS.end.slippedTitle}
              </AppText>
              <AppText>{SOS.end.slippedBody}</AppText>
              <AppText weight="800" color={t.tokens.success}>
                {fill(SOS.end.count, { n: managedCount(urges) })}
              </AppText>
            </Card>
            <Button label={tr('odak.sos.toSlip')} variant="secondary" onPress={() => router.replace({ pathname: '/odak/slip', params: { from: slipLogged ? 'log' : 'sos' } })} />
            {slipLogged ? (
              <Card>
                <AppText variant="small" weight="700">
                  {P.log.saved}
                </AppText>
              </Card>
            ) : (
              <Card style={{ gap: t.space.sm }}>
                <AppText weight="800">{SOS.end.logSlip}</AppText>
                {P.log.options.map((o) => (
                  <ChoiceCard key={o.id} icon={o.icon} label={o.label} selected={false} onPress={() => void logSlip(o.id as BehaviorKind)} />
                ))}
              </Card>
            )}
          </>
        )
      ) : null}

      <AppText variant="tiny" muted>
        {SOS.emergency}
      </AppText>
    </Screen>
  );
}

/** Move first: a 60-second "change place" timer with four small actions. */
function Relocate({ onUsed }: { onUsed: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const cd = useCountdown(SOS.relocate.seconds);
  const [done, setDone] = useState<string[]>([]);
  return (
    <>
      <AppText variant="h2" accessibilityRole="header">
        {SOS.relocate.title}
      </AppText>
      <AppText variant="h3">{SOS.relocate.lead}</AppText>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <AppText variant="display" style={{ fontSize: 56, lineHeight: 64 }} accessibilityLabel={tr('camp.sos.timeLeft', { time: mmss(cd.left) })}>
          {mmss(cd.left)}
        </AppText>
        <View style={{ alignSelf: 'stretch' }}>
          <ProgressBar value={cd.elapsed / SOS.relocate.seconds} height={8} />
        </View>
      </View>
      {cd.finished ? (
        <Card style={{ backgroundColor: t.tokens.muted, borderColor: t.tokens.muted}}>
          <AppText weight="700">{SOS.relocate.done}</AppText>
        </Card>
      ) : (
        <Button
          label={cd.running ? tr('camp.sos.pause') : cd.elapsed > 0 ? tr('camp.sos.resume') : SOS.relocate.start}
          icon={cd.running ? 'pause' : 'play'}
          variant={cd.running ? 'secondary' : 'primary'}
          onPress={() => {
            if (cd.running) cd.pause();
            else {
              onUsed();
              cd.start();
            }
          }}
        />
      )}
      <View style={{ gap: t.space.sm }}>
        {SOS.relocate.steps.map((s) => (
          <ChoiceCard key={s} multi label={s} selected={done.includes(s)} onPress={() => setDone((d) => (d.includes(s) ? d.filter((x) => x !== s) : [...d, s]))} />
        ))}
      </View>
    </>
  );
}





/**
 * A DAYY row (SPEC_V4 §D.2): the whole row is the control (no small checkbox). Selected: primary
 * border and a check.
 */
function DayyRow({ icon, letter, label, selected, onPress }: { icon: IconName; letter: string; label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  const k = t.tokens;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 60, paddingHorizontal: t.space.lg, borderRadius: t.radius.lg, borderWidth: selected ? 2 : 1, borderColor: selected ? k.primary : k.border, backgroundColor: selected ? k.primarySoft : k.card, transform: [{ scale: pressed ? 0.99 : 1 }] })}
    >
      <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? k.primary : k.muted }}>
        <AppText variant="callout" weight="700" color={selected ? k.primaryForeground : k.foreground}>
          {letter}
        </AppText>
      </View>
      <Icon name={icon} size={20} color={k.mutedForeground} />
      <AppText variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </AppText>
      {selected ? <Icon name="check" size={22} color={k.primary} /> : null}
    </Pressable>
  );
}

/**
 * "Yapabileceklerin" (2026-11-23): eight short steps anyone can take anywhere (change the room, put the
 * phone away, cold water, a walk, busy hands, a shower, the next task, decide in 15 minutes). Ticking
 * one counts the tool as used.
 */
function Actions({ onUsed }: { onUsed: () => void }) {
  const t = useTheme();
  const A = SOS.actions;
  const [done, setDone] = useState<string[]>([]);
  const toggle = (id: string) => {
    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
    onUsed();
  };
  return (
    <View style={{ gap: t.space.md }}>
      <AppText variant="callout" muted>
        {A.lead}
      </AppText>
      <Card style={{ padding: 0 }}>
        {A.items.map((it, i) => {
          const on = done.includes(it.id);
          return (
            <Pressable
              key={it.id}
              onPress={() => toggle(it.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${it.title}. ${it.text}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 64, paddingHorizontal: t.space.lg, paddingVertical: t.space.md, borderTopWidth: i ? t.border.thin : 0, borderTopColor: t.tokens.border, backgroundColor: on ? tint(t.tone.focus.fg, '14') : 'transparent' }}
            >
              <IconTile icon={it.icon} tone="focus" />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong">{it.title}</AppText>
                <AppText variant="footnote" muted>
                  {it.text}
                </AppText>
              </View>
              <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: t.border.medium, borderColor: on ? t.tone.focus.fg : t.tokens.subtle, backgroundColor: on ? t.tone.focus.fg : 'transparent' }}>
                {on ? <Icon name="check" size={14} color={t.tokens.primaryForeground} /> : null}
              </View>
            </Pressable>
          );
        })}
      </Card>
      {done.length ? (
        <AppText variant="footnote" weight="600" color={t.tone.focus.fg} accessibilityLiveRegion="polite">
          {fill(A.doneCount, { n: done.length })}
        </AppText>
      ) : null}
      <AppText variant="footnote" muted>
        {A.note}
      </AppText>
    </View>
  );
}
