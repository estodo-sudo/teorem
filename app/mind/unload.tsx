import { useEffect, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Header, Screen, useTheme } from '@/components';
import { playCue } from '@/features/training/haptics';
import { toDateKey } from '@/lib/date';
import { createRng, makeId } from '@/lib/random';
import { useHistoryStore } from '@/stores/historyStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * "Mind unload": write what's on your mind, press Release and watch the words
 * drift away. Nothing is stored unless the user enabled it in settings.
 */
export default function Unload() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const [text, setText] = useState('');
  const [released, setReleased] = useState<string | null>(null);

  const release = () => {
    const v = text.trim();
    if (!v) return;
    if (settings.saveUnloadNotes) {
      useHistoryStore.getState().addNote({ id: makeId('u_'), date: toDateKey(), createdAt: new Date().toISOString(), text: v, kind: 'unload' });
    }
    playCue('breatheOut', settings.hapticStrength);
    useProgressStore.getState().setLastMindSession(toDateKey());
    setReleased(v);
    setText('');
  };

  return (
    <Screen
      footer={
        released === null ? (
          <Button label={tr('mind.unload.release')} size="lg" variant="accent" disabled={!text.trim()} onPress={release} />
        ) : (
          <Button label={tr('mind.unload.again')} size="lg" variant="secondary" onPress={() => setReleased(null)} />
        )
      }
    >
      <Header title={tr('mind.unload.title')} close />
      {released === null ? (
        <>
          <AppText muted>{tr('mind.unload.intro')}</AppText>
          <TextInput maxFontSizeMultiplier={1.3}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            maxLength={2000}
            placeholder={tr('mind.unload.placeholder')}
            placeholderTextColor={t.colors.textMuted}
            accessibilityLabel={tr('mind.unload.title')}
            style={{ minHeight: 200, color: t.colors.text, backgroundColor: t.colors.surface, borderColor: t.colors.border, borderWidth: 1, borderRadius: t.radius.lg, padding: 16, fontSize: 18, lineHeight: 26, textAlignVertical: 'top' }}
          />
          <AppText variant="small" muted>
            {settings.saveUnloadNotes ? tr('mind.unload.savedHint') : tr('mind.unload.privateHint')}
          </AppText>
        </>
      ) : (
        <>
          <DriftingWords text={released} />
          <Card style={{ gap: 6 }}>
            <AppText variant="h3">{tr('mind.unload.afterTitle')}</AppText>
            <AppText muted>{tr('mind.unload.afterBody')}</AppText>
          </Card>
        </>
      )}
    </Screen>
  );
}

function DriftingWords({ text }: { text: string }) {
  const words = useMemo(() => text.split(/\s+/).filter(Boolean).slice(0, 80), [text]);
  const rng = useMemo(() => createRng(text), [text]);
  const params = useMemo(() => words.map(() => ({ dx: (rng() - 0.5) * 160, dy: -120 - rng() * 220, rot: (rng() - 0.5) * 60, delay: rng() * 600 })), [words, rng]);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: 200, paddingVertical: 24 }} accessibilityLabel="" importantForAccessibility="no-hide-descendants">
      {words.map((w, i) => (
        <Word key={`${w}-${i}`} word={w} {...params[i]!} />
      ))}
    </View>
  );
}

function Word({ word, dx, dy, rot, delay }: { word: string; dx: number; dy: number; rot: number; delay: number }) {
  const t = useTheme();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }));
  }, [p, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [{ translateX: dx * p.value }, { translateY: dy * p.value }, { rotate: `${rot * p.value}deg` }, { scale: 1 - 0.4 * p.value }],
  }));
  return (
    <Animated.View style={style}>
      <AppText variant="h3" color={t.colors.textMuted}>
        {word}
      </AppText>
    </Animated.View>
  );
}
