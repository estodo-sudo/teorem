import { useEffect, useRef, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, ProgressRing, Screen, useTheme } from '@/components';
import { MC, type McUrgeAction } from '@/features/campus/masturbation/content';
import { LapseDialog, UseDialog } from '@/features/campus/masturbation/ui';
import { Chip } from '@/features/campus/smoking/ui';
import { cancelHaptics, playCue } from '@/features/training/haptics';
import { useNow } from '@/lib/useNow';
import { useSafeKeepAwake } from '@/lib/useSafeKeepAwake';
import { useCampusStore } from '@/stores/campusStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { goBack } from '@/lib/nav';

/** Each tip stays on screen this long during the action. */
const TIP_MS = 20_000;

/**
 * Urge flow: pick a "do this now" action → timed action with its steps and a
 * reminder of the user's reasons → log the result (passed / lapse) and the trigger.
 */
export default function UrgeScreen() {
  const [action, setAction] = useState<McUrgeAction | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [result, setResult] = useState<null | 'early' | 'full'>(null);

  if (result && action) {
    return (
      <UrgeResult
        early={result === 'early'}
        actionId={action.id}
        onAgain={() => {
          setAction(null);
          setResult(null);
        }}
      />
    );
  }
  if (action) {
    return <UrgeAction key={startedAt} action={action} startedAt={startedAt} onFinish={setResult} onChange={() => setAction(null)} />;
  }
  return (
    <ActionPicker
      onPick={(a) => {
        setStartedAt(Date.now());
        setAction(a);
      }}
    />
  );
}

function ActionPicker({ onPick }: { onPick: (a: McUrgeAction) => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { width } = useWindowDimensions();
  const tile = (Math.min(width, 520) - 40 - 12) / 2;
  return (
    <Screen>
      <Header title={tr('mcampus.urge.title')} close />
      <AppText variant="h2" accessibilityRole="header">
        {tr('mcampus.urge.pickTitle')}
      </AppText>
      <AppText muted>{tr('mcampus.urge.pickHint')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {MC.urge.actions.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => onPick(a)}
            accessibilityRole="button"
            accessibilityLabel={`${a.title}, ${tr('mcampus.urge.minutes', { count: a.minutes })}`}
            style={({ pressed }) => ({
              width: tile,
              minHeight: 120,
              padding: 14,
              gap: 6,
              borderRadius: t.radius.lg,
              borderWidth: 1,
              borderColor: t.colors.border,
              backgroundColor: t.colors.surface,
              justifyContent: 'space-between',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="h2">{a.emoji}</AppText>
            </View>
            <AppText weight="800">{a.title}</AppText>
            <AppText variant="tiny" weight="700" color={t.colors.primary}>
              {tr('mcampus.urge.minutes', { count: a.minutes })}
            </AppText>
          </Pressable>
        ))}
      </View>
      <Card style={{ gap: 4, backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.surfaceAlt }}>
        <AppText variant="small">💡 {MC.urge.tips[0]}</AppText>
      </Card>
    </Screen>
  );
}

function UrgeAction({ action, startedAt, onFinish, onChange }: { action: McUrgeAction; startedAt: number; onFinish: (r: 'early' | 'full') => void; onChange: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { width } = useWindowDimensions();
  useSafeKeepAwake();
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const reasonIds = useCampusStore((s) => s.masturbation.reasonIds);
  const now = useNow(250).getTime();
  const totalMs = action.minutes * 60_000;
  const elapsed = Math.max(0, now - startedAt);
  const remaining = Math.max(0, totalMs - elapsed);
  const tipIdx = Math.floor(elapsed / TIP_MS);
  const tip = MC.urge.tips[tipIdx % MC.urge.tips.length]!;
  const reasons = MC.reasons.filter((r) => reasonIds.includes(r.id));
  const reason = reasons.length ? reasons[tipIdx % reasons.length] : undefined;

  const finished = useRef(false);
  useEffect(() => {
    if (remaining > 0 || finished.current) return;
    finished.current = true;
    playCue('exerciseEnd', strength);
    onFinish('full');
  }, [remaining, strength, onFinish]);
  useEffect(() => () => cancelHaptics(), []);

  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);
  const time = `${mm}:${String(ss).padStart(2, '0')}`;
  const ring = Math.min(240, width - 120);

  return (
    <Screen footer={<Button label={tr('mcampus.urge.passedEarly')} size="lg" variant="accent" icon="check" onPress={() => onFinish('early')} />}>
      <Header title={action.title} close />
      <View style={{ alignItems: 'center', gap: 8 }}>
        <ProgressRing size={ring} stroke={10} value={elapsed / totalMs} color={t.colors.primary}>
          <AppText variant="display">{action.emoji}</AppText>
          <AppText variant="h2" weight="800" accessibilityLabel={tr('mcampus.urge.remaining', { time })}>
            {time}
          </AppText>
        </ProgressRing>
      </View>

      <Card style={{ gap: 10 }}>
        <AppText variant="tiny" weight="800" color={t.colors.primary}>
          {tr('mcampus.urge.stepsTitle').toLocaleUpperCase('tr-TR')}
        </AppText>
        {action.steps.map((st, i) => (
          <View key={st} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="tiny" weight="800" color={t.colors.primaryText}>
                {i + 1}
              </AppText>
            </View>
            <AppText style={{ flex: 1 }}>{st}</AppText>
          </View>
        ))}
      </Card>

      <Card style={{ gap: 6, backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.surfaceAlt }} accessibilityLiveRegion="polite">
        <AppText variant="small">💡 {tip}</AppText>
        {reason ? (
          <AppText variant="small" weight="700">
            {tr('mcampus.urge.reason', { reason: `${reason.emoji} ${reason.label}` })}
          </AppText>
        ) : null}
      </Card>

      <Button label={tr('mcampus.urge.change')} variant="ghost" onPress={onChange} />
    </Screen>
  );
}

function UrgeResult({ early, actionId, onAgain }: { early: boolean; actionId: string; onAgain: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const userTriggers = useCampusStore((s) => s.masturbation.triggerIds);
  const triggers = [...MC.triggers].sort((a, b) => Number(userTriggers.includes(b.id)) - Number(userTriggers.includes(a.id)));
  const [triggerId, setTriggerId] = useState<string | null>(null);
  const mode = useCampusStore((s) => s.masturbation.mode);
  const [lapseOpen, setLapseOpen] = useState(false);
  const [useOpen, setUseOpen] = useState(false);
  const help = MC.help[0];

  return (
    <Screen
      footer={
        <Button
          label={tr('mcampus.urge.save')}
          size="lg"
          variant="accent"
          icon="check"
          onPress={() => {
            useCampusStore.getState().logUrge({ triggerId, actionId, passed: true });
            goBack('/campus/masturbation');
          }}
        />
      }
    >
      <Header title={tr('mcampus.urge.title')} close />
      <AppText variant="display" center>
        🎉
      </AppText>
      <AppText variant="h1" center accessibilityRole="header">
        {early ? tr('mcampus.urge.doneTitleEarly') : tr('mcampus.urge.doneTitle')}
      </AppText>
      <AppText muted center>
        {tr('mcampus.urge.doneBody')}
      </AppText>

      <AppText variant="h3">{tr('mcampus.urge.triggerQuestion')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {triggers.map((x) => (
          <Chip key={x.id} emoji={x.emoji} label={x.label} selected={triggerId === x.id} onPress={() => setTriggerId((cur) => (cur === x.id ? null : x.id))} />
        ))}
      </View>

      <Button label={tr('mcampus.urge.again')} variant="secondary" icon="wind" onPress={onAgain} />
      <Button
        label={mode === 'control' ? tr('mcampus.urge.used') : tr('mcampus.urge.lapsed')}
        variant="ghost"
        onPress={() => {
          useCampusStore.getState().logUrge({ triggerId, actionId, passed: false });
          if (mode === 'control') setUseOpen(true);
          else setLapseOpen(true);
        }}
      />
      <LapseDialog
        visible={lapseOpen}
        onClose={() => {
          setLapseOpen(false);
          goBack('/campus/masturbation');
        }}
      />
      <UseDialog
        visible={useOpen}
        onClose={() => {
          setUseOpen(false);
          goBack('/campus/masturbation');
        }}
      />

      {help ? (
        <Card style={{ gap: 6, borderColor: t.colors.border }}>
          <AppText variant="small" muted>
            {tr('mcampus.urge.stillHard')}
          </AppText>
          <AppText variant="small">{help.text}</AppText>
        </Card>
      ) : null}
    </Screen>
  );
}
