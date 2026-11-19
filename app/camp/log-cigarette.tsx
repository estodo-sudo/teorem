import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { CAMP_ONBOARDING as ONB } from '@/features/camps/smoking/content';
import { todayCount, triggerFrequency } from '@/features/camps/smoking/engine/diary';
import { MIN_MS } from '@/features/camps/core/time';
import { campAttempt } from '@/features/camps/smoking/state';
import type { Score5, TriggerId } from '@/features/camps/smoking/types';
import { tint } from '@/features/campus/shared/ui';
import { goBack } from '@/lib/nav';
import { useCampEventsStore, useCampStore } from '@/stores/campStore';

const AGO = [0, 15, 30, 60] as const;
const MOODS: { v: Score5; emoji: string }[] = [
  { v: 1, emoji: '😣' },
  { v: 2, emoji: '😕' },
  { v: 3, emoji: '😐' },
  { v: 4, emoji: '🙂' },
  { v: 5, emoji: '😄' },
];

/**
 * Quick cigarette log (≤3 taps: trigger, need, save). Time is automatic; mood, a place label and
 * "a little earlier" are optional. No location services. After the quit an entry counts as a slip.
 */
export default function CampLogCigarette() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const camp = useCampStore();
  const ev = useCampEventsStore();
  const attempt = campAttempt(camp);
  const [trigger, setTrigger] = useState<TriggerId | null>(null);
  const [need, setNeed] = useState<Score5 | null>(null);
  const [mood, setMood] = useState<Score5 | null>(null);
  const [tag, setTag] = useState('');
  const [ago, setAgo] = useState<number>(0);
  const [showAll, setShowAll] = useState(false);
  const [saved, setSaved] = useState(false);
  // After the quit (also after graduation) a cigarette is a slip.
  const slip = attempt !== null && attempt.status !== 'preparing';
  const back = () => goBack('/camp');

  if (!attempt) {
    return (
      <Screen>
        <Header title={tr('camp.log.title')} close onBack={back} />
        <AppText muted>{tr('camp.log.noAttempt')}</AppText>
      </Screen>
    );
  }

  const freq = triggerFrequency(camp.profile?.triggers ?? [], ev.cigarettes, ev.cravings).map((x) => x.trigger);
  const others = ONB.triggers.map((x) => x.id).filter((id) => !freq.includes(id));
  const shown = showAll ? [...freq, ...others] : freq.length ? freq : others;
  const label = (id: TriggerId) => ONB.triggers.find((x) => x.id === id)!;

  if (saved) {
    return (
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            <Button label={tr('camp.log.done')} size="lg" variant="primary" onPress={back} />
            <Button
              label={tr('camp.log.another')}
              variant="secondary"
              onPress={() => {
                setSaved(false);
                setTrigger(null);
                setNeed(null);
                setMood(null);
                setTag('');
                setAgo(0);
              }}
            />
          </View>
        }
      >
        <Header title={tr('camp.log.title')} close onBack={back} />
        <View style={{ alignItems: 'center', gap: 10, marginTop: 30 }}>
          <AppText variant="display">{slip ? '🌱' : '📝'}</AppText>
          <AppText variant="h1" center accessibilityRole="header">
            {slip ? tr('camp.log.slipSavedTitle') : tr('camp.log.savedTitle')}
          </AppText>
          <AppText muted center>
            {slip ? tr('camp.log.slipSavedBody') : tr('camp.log.savedBody', { count: todayCount(ev.cigarettes, new Date()) })}
          </AppText>
          {slip ? <Button label={tr('camp.log.toSlip')} variant="primary" onPress={() => router.replace({ pathname: '/camp/slip', params: { logged: '1', ...(trigger ? { trigger } : {}) } })} /> : null}
          <Button label={tr('camp.log.openDiary')} variant="ghost" onPress={() => router.replace('/camp/diary')} />
        </View>
      </Screen>
    );
  }

  const save = () => {
    useCampEventsStore.getState().logCigarette({
      attemptId: attempt.id,
      at: new Date(Date.now() - ago * MIN_MS).toISOString(),
      trigger: trigger ?? undefined,
      need: need ?? undefined,
      mood: mood ?? undefined,
      tag: tag.trim() ? tag.trim().slice(0, 30) : undefined,
      isSlip: slip,
    });
    setSaved(true);
  };

  const chip = (on: boolean) => ({
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: t.radius.pill,
    borderWidth: 1.5,
    borderColor: on ? t.colors.accent : t.colors.border,
    backgroundColor: on ? tint(t.colors.accent, '1A') : t.colors.surface,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  });

  return (
    <Screen footer={<Button label={tr('camp.log.save')} size="lg" variant="primary" icon="check" onPress={save} />}>
      <Header title={tr('camp.log.title')} close onBack={back} />
      {slip ? (
        <Card style={{ borderLeftWidth: 4, borderLeftColor: t.colors.primary }}>
          <AppText variant="small">{tr('camp.log.slipNote')}</AppText>
        </Card>
      ) : (
        <AppText muted>{tr('camp.log.prepNote')}</AppText>
      )}

      <AppText weight="800">{tr('camp.log.when')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {AGO.map((m) => (
          <Pressable key={m} onPress={() => setAgo(m)} accessibilityRole="radio" accessibilityState={{ selected: ago === m }} style={chip(ago === m)}>
            <AppText variant="small" weight="700">
              {m === 0 ? tr('camp.log.now') : tr('camp.log.ago', { count: m })}
            </AppText>
          </Pressable>
        ))}
      </View>

      <AppText weight="800">{tr('camp.log.trigger')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {shown.map((id) => {
          const x = label(id);
          const on = trigger === id;
          return (
            <Pressable key={id} onPress={() => setTrigger(on ? null : id)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={chip(on)}>
              <AppText>{x.emoji}</AppText>
              <AppText variant="small" weight="700">
                {x.label}
              </AppText>
            </Pressable>
          );
        })}
        {!showAll && others.length && freq.length ? (
          <Pressable onPress={() => setShowAll(true)} accessibilityRole="button" style={chip(false)}>
            <AppText variant="small" weight="700" color={t.colors.primary}>
              {tr('camp.log.more')}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <AppText weight="800">{tr('camp.log.need')}</AppText>
      <View style={{ flexDirection: 'row', gap: 6 }} accessibilityRole="radiogroup">
        {([1, 2, 3, 4, 5] as Score5[]).map((v) => {
          const on = need === v;
          return (
            <Pressable
              key={v}
              onPress={() => setNeed(v)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${v}. ${tr(`camp.log.needLabel.${v}`)}`}
              style={{
                flex: 1,
                minHeight: 52,
                borderRadius: t.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: on ? t.colors.primary : t.colors.border,
                backgroundColor: on ? t.colors.primary : t.colors.surface,
              }}
            >
              <AppText variant="h3" weight="800" color={on ? t.colors.primaryText : t.colors.text}>
                {v}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText variant="small" muted center>
        {need ? tr(`camp.log.needLabel.${need}`) : tr('camp.log.needHint')}
      </AppText>

      <AppText weight="800">{tr('camp.log.mood')}</AppText>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityRole="radiogroup">
        {MOODS.map((m) => {
          const on = mood === m.v;
          return (
            <Pressable
              key={m.v}
              onPress={() => setMood(on ? null : m.v)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={tr(`camp.log.moodLabel.${m.v}`)}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: on ? t.colors.accent : 'transparent',
                backgroundColor: on ? tint(t.colors.accent, '1A') : t.colors.surfaceAlt,
              }}
            >
              <AppText style={{ fontSize: 28, lineHeight: 34 }}>{m.emoji}</AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText weight="800">{tr('camp.log.tag')}</AppText>
      <TextInput
        value={tag}
        onChangeText={setTag}
        maxLength={30}
        placeholder={tr('camp.log.tagPlaceholder')}
        placeholderTextColor={t.colors.textMuted}
        accessibilityLabel={tr('camp.log.tag')}
        style={{ minHeight: 48, borderRadius: t.radius.md, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, paddingHorizontal: 14, color: t.colors.text, fontSize: 16 }}
      />
    </Screen>
  );
}
