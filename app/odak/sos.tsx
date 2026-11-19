import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, ChoiceCard, Header, Icon, ProgressBar, Screen, useTheme } from '@/components';
import { IntensityScale, mmss, SosBreath, UrgeSurf, useCountdown } from '@/features/camps/core/sosTools';
import { fill, ODAK_ONBOARDING as ONB, ODAK_PANEL as P, ODAK_SOS as SOS } from '@/features/camps/odak/content';
import { buildUrge, dayyCount, LETTER_MAX, managedCount, nextTool, noDayy, SOS_TOOLS, type Dayy } from '@/features/camps/odak/engine/sos';
import { QuickExitButton } from '@/features/camps/odak/privacy/quickExit';
import { useOdakStore } from '@/features/camps/odak/store';
import { OdakLock } from '@/features/camps/odak/ui';
import { useAccess } from '@/features/purchases/useGate';
import type { BehaviorKind, OdakToolId, UrgeEvent } from '@/features/camps/odak/types';
import { tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';

type Step = 'check' | 'relocate' | 'tools' | 'end' | 'result';

/**
 * "Dürtü anı" (SOS, SPEC_ODAK_KAMPI 5.2): DAYY check + intensity → move first (60 s) → tools →
 * "Şimdi nasılsın?" → managed / still hard (another tool) / slipped (no judgement). Always free.
 */
export default function OdakSos() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const urges = useOdakStore((s) => s.urges);
  const [startedAt] = useState(() => new Date());
  const [step, setStep] = useState<Step>('check');
  const [dayy, setDayy] = useState<Dayy>(noDayy);
  const [before, setBefore] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [tool, setTool] = useState<OdakToolId>('surf');
  const [used, setUsed] = useState<OdakToolId[]>([]);
  const [hardNote, setHardNote] = useState<string | null>(null);
  const [result, setResult] = useState<UrgeEvent | null>(null);
  const [slipLogged, setSlipLogged] = useState(false);
  const use = useCallback((id: OdakToolId) => setUsed((u) => (u.includes(id) ? u : [...u, id])), []);
  const onValuesUsed = useCallback(() => use('values'), [use]);
  const onFutureUsed = useCallback(() => use('futureSelf'), [use]);
  const toolTitle = (id: OdakToolId) => SOS.tools.items.find((x) => x.id === id)?.title ?? id;

  const finish = async (outcome: UrgeEvent['outcome']) => {
    const u = buildUrge({ startedAt, endedAt: new Date(), intensityBefore: before ?? 5, intensityAfter: after, dayy, toolsUsed: used, outcome });
    await useOdakStore.getState().logUrge(u);
    setResult(u);
    setStep('result');
  };
  const stillHard = () => {
    const n = nextTool(used);
    setTool(n);
    setHardNote(fill(SOS.end.hardBody, { tool: toolTitle(n) }));
    setAfter(null);
    setStep('tools');
  };
  const logSlip = async (kind: BehaviorKind) => {
    await useOdakStore.getState().logBehavior(kind);
    setSlipLogged(true);
  };

  const footer =
    step === 'check' ? (
      <Button label={tr('odak.sos.next')} size="lg" disabled={before === null} onPress={() => setStep('relocate')} />
    ) : step === 'relocate' ? (
      <Button label={tr('odak.sos.toTools')} size="lg" onPress={() => setStep('tools')} />
    ) : step === 'tools' ? (
      <Button label={tr('odak.sos.toEnd')} size="lg" variant="accent" onPress={() => setStep('end')} />
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
              <ChoiceCard key={it.id} multi emoji={it.emoji} label={`${it.letter} · ${it.label}`} selected={dayy[it.id]} onPress={() => setDayy((d) => ({ ...d, [it.id]: !d[it.id] }))} />
            ))}
          </View>
          {dayyCount(dayy) ? (
            <Card style={{ gap: 6, borderLeftWidth: 4, borderLeftColor: t.colors.primary }}>
              {SOS.check.items
                .filter((it) => dayy[it.id])
                .map((it) => (
                  <AppText key={it.id} variant="small">
                    {it.emoji} {it.tip}
                  </AppText>
                ))}
            </Card>
          ) : null}
          <AppText weight="800">{SOS.check.intensity}</AppText>
          <IntensityScale value={before} onChange={setBefore} label={SOS.check.intensity} labels={SOS.check.intensityLabels} />
        </>
      ) : null}

      {step === 'relocate' ? <Relocate onUsed={() => use('relocate')} /> : null}

      {step === 'tools' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {SOS.tools.title}
          </AppText>
          {hardNote ? (
            <Card style={{ borderLeftWidth: 4, borderLeftColor: t.colors.accent }}>
              <AppText variant="small">{hardNote}</AppText>
            </Card>
          ) : (
            <AppText muted>{SOS.tools.hint}</AppText>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
                  style={{ width: 128, minHeight: 88, padding: 12, gap: 4, borderRadius: t.radius.lg, borderWidth: 2, borderColor: on ? t.colors.primary : t.colors.border, backgroundColor: on ? tint(t.colors.primary, '1F') : t.colors.surface }}
                >
                  <AppText variant="h2">{it.emoji}</AppText>
                  <AppText weight="800" variant="small">
                    {it.title}
                  </AppText>
                  {used.includes(id) ? <Icon name="check" color={t.colors.success} size={14} strokeWidth={3} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
          {tool === 'surf' ? <UrgeSurf key="surf" onUsed={() => use('surf')} text={SOS.surf} /> : null}
          {tool === 'breath' ? <SosBreath key="breath" onUsed={() => use('breath')} desc={SOS.breath.desc} /> : null}
          {tool === 'move' ? <Move key="move" onUsed={() => use('move')} /> : null}
          {tool === 'values' ? <ValuesView key="values" onUsed={onValuesUsed} /> : null}
          {tool === 'futureSelf' ? <FutureSelf key="future" onUsed={onFutureUsed} /> : null}
          {tool === 'supporter' ? <Supporter key="supporter" onUsed={() => use('supporter')} /> : null}
          <Button label={`🧑‍🏫 ${tr('odak.coach.fromSos')}`} variant="ghost" onPress={() => router.push({ pathname: '/odak/coach', params: { scenario: 'urge' } })} />
        </>
      ) : null}

      {step === 'end' ? (
        <>
          <AppText variant="h2" accessibilityRole="header">
            {SOS.end.question}
          </AppText>
          <IntensityScale value={after} onChange={setAfter} label={SOS.end.question} labels={SOS.check.intensityLabels} />
          <View style={{ gap: 10 }}>
            <Button label={SOS.end.managed} size="lg" variant="primary" onPress={() => void finish('managed')} />
            <Button label={SOS.end.hard} size="lg" variant="secondary" onPress={stillHard} />
            <Button label={SOS.end.slipped} variant="ghost" onPress={() => void finish('slipped')} />
          </View>
        </>
      ) : null}

      {step === 'result' && result ? (
        result.outcome === 'managed' ? (
          <Card style={{ gap: 10, alignItems: 'center', padding: 20 }}>
            <AppText variant="display">🌿</AppText>
            <AppText variant="h2" center accessibilityRole="header">
              {SOS.end.managedTitle}
            </AppText>
            <AppText center>{SOS.end.managedBody}</AppText>
            <AppText weight="800" center color={t.colors.success} accessibilityLiveRegion="polite">
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
              <AppText weight="800" color={t.colors.success}>
                {fill(SOS.end.count, { n: managedCount(urges) })}
              </AppText>
            </Card>
            <Button label={tr('odak.sos.toSlip')} variant="secondary" onPress={() => router.replace({ pathname: '/odak/slip', params: { from: slipLogged ? 'log' : 'sos' } })} />
            {slipLogged ? (
              <Card>
                <AppText variant="small" weight="700">
                  ✓ {P.log.saved}
                </AppText>
              </Card>
            ) : (
              <Card style={{ gap: 8 }}>
                <AppText weight="800">{SOS.end.logSlip}</AppText>
                {P.log.options.map((o) => (
                  <ChoiceCard key={o.id} emoji={o.emoji} label={o.label} selected={false} onPress={() => void logSlip(o.id as BehaviorKind)} />
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
        <Card style={{ borderLeftWidth: 4, borderLeftColor: t.colors.success }}>
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
      <View style={{ gap: 8 }}>
        {SOS.relocate.steps.map((s) => (
          <ChoiceCard key={s} multi label={s} selected={done.includes(s)} onPress={() => setDone((d) => (d.includes(s) ? d.filter((x) => x !== s) : [...d, s]))} />
        ))}
      </View>
    </>
  );
}

/** Two-minute movement set: four moves, 30 s each. */
function Move({ onUsed }: { onUsed: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const cd = useCountdown(SOS.move.seconds);
  const per = SOS.move.seconds / SOS.move.steps.length;
  const current = Math.min(SOS.move.steps.length - 1, Math.floor(cd.elapsed / per));
  return (
    <View style={{ gap: 12 }}>
      <AppText muted>{SOS.move.desc}</AppText>
      <AppText variant="display" center style={{ fontSize: 48, lineHeight: 56 }} accessibilityLabel={tr('camp.sos.timeLeft', { time: mmss(cd.left) })}>
        {mmss(cd.left)}
      </AppText>
      <ProgressBar value={cd.elapsed / SOS.move.seconds} height={8} />
      {SOS.move.steps.map((s, i) => {
        const active = (cd.running || cd.elapsed > 0) && !cd.finished && i === current;
        return (
          <View key={s} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: t.radius.md, backgroundColor: active ? tint(t.colors.primary, '1F') : t.colors.surface }}>
            <AppText weight="800" color={active ? t.colors.primary : t.colors.textMuted}>
              {i + 1}
            </AppText>
            <AppText weight={active ? '800' : '400'} style={{ flex: 1 }}>
              {s}
            </AppText>
          </View>
        );
      })}
      {cd.finished ? (
        <Card style={{ borderLeftWidth: 4, borderLeftColor: t.colors.success }}>
          <AppText weight="700">{SOS.move.done}</AppText>
        </Card>
      ) : (
        <Button
          label={cd.running ? tr('camp.sos.pause') : cd.elapsed > 0 ? tr('camp.sos.resume') : SOS.move.start}
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
    </View>
  );
}

/** The user's own values and sentence. */
function ValuesView({ onUsed }: { onUsed: () => void }) {
  const t = useTheme();
  const profile = useOdakStore((s) => s.profile);
  // Reading the values counts as using the tool.
  useEffect(onUsed, [onUsed]);
  const cards = ONB.values.cards.filter((c) => profile?.values.includes(c.id));
  return (
    <View style={{ gap: 10 }}>
      <AppText muted>{SOS.values.desc}</AppText>
      {cards.length || profile?.valuesText ? (
        <>
          {profile?.valuesText ? (
            <Card style={{ borderLeftWidth: 4, borderLeftColor: t.colors.primary }}>
              <AppText variant="h3">“{profile.valuesText}”</AppText>
            </Card>
          ) : null}
          {cards.map((c) => (
            <Card key={c.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <AppText variant="h2">{c.emoji}</AppText>
              <AppText weight="800">{c.label}</AppText>
            </Card>
          ))}
        </>
      ) : (
        <AppText muted>{SOS.values.empty}</AppText>
      )}
    </View>
  );
}

/** Letter to the future self: read it in a hard moment, or write it now. Stored in the vault. */
function FutureSelf({ onUsed }: { onUsed: () => void }) {
  const t = useTheme();
  const letter = useOdakStore((s) => s.letter);
  const premium = useAccess()('odak');
  const { t: tr } = useTranslation();
  const [editing, setEditing] = useState(!letter);
  const [text, setText] = useState(letter?.text ?? '');
  const [saved, setSaved] = useState(false);
  const hasLetter = letter !== null;
  // Reading an existing letter counts as using the tool.
  useEffect(() => {
    if (hasLetter) onUsed();
  }, [hasLetter, onUsed]);
  return (
    <View style={{ gap: 10 }}>
      <AppText muted>{SOS.futureSelf.desc}</AppText>
      {editing && !premium ? (
        <OdakLock title={tr('odak.premium.letter')} />
      ) : editing ? (
        <>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            maxLength={LETTER_MAX}
            placeholder={SOS.futureSelf.placeholder}
            accessibilityLabel={SOS.futureSelf.placeholder}
            placeholderTextColor={t.colors.textMuted}
            style={{ minHeight: 160, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, padding: 14, color: t.colors.text, fontSize: 16, textAlignVertical: 'top' }}
          />
          <Button
            label={SOS.futureSelf.save}
            disabled={!text.trim()}
            onPress={() =>
              void useOdakStore
                .getState()
                .saveLetter(text.trim())
                .then(() => {
                  onUsed();
                  setSaved(true);
                  setEditing(false);
                })
            }
          />
        </>
      ) : (
        <>
          <Card style={{ borderLeftWidth: 4, borderLeftColor: t.colors.primary }}>
            <AppText>{letter?.text}</AppText>
          </Card>
          {saved ? (
            <AppText variant="small" weight="700" color={t.colors.success}>
              ✓ {SOS.futureSelf.saved}
            </AppText>
          ) : null}
          {premium ? <Button label={SOS.futureSelf.edit} variant="ghost" onPress={() => setEditing(true)} /> : null}
        </>
      )}
    </View>
  );
}

/** A neutral message to a supporter through the system share sheet (no details). */
function Supporter({ onUsed }: { onUsed: () => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <AppText muted>{SOS.supporter.desc}</AppText>
      <Card style={{ borderLeftWidth: 4, borderLeftColor: t.colors.primary }}>
        <AppText variant="h3">“{SOS.supporter.message}”</AppText>
      </Card>
      <Button
        label={SOS.supporter.share}
        icon="bell"
        onPress={() => {
          onUsed();
          void Share.share({ message: SOS.supporter.message }).catch(() => undefined);
        }}
      />
    </View>
  );
}
