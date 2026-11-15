import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppText, Button, useTheme } from '@/components';
import { playCue } from '@/features/training/haptics';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';

import { ACHIEVEMENTS } from './achievements';

/** Global overlay that celebrates newly unlocked achievements one by one. */
export function Celebration() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const queue = useProgressStore((s) => s.celebrationQueue);
  const shift = useProgressStore((s) => s.shiftCelebration);
  const strength = useSettingsStore((s) => s.settings.hapticStrength);
  const id = queue[0];
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  const scale = useSharedValue(0.3);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (!id) return;
    scale.value = 0.3;
    scale.value = withSpring(1, { damping: 8, stiffness: 140 });
    rotate.value = withSequence(withTiming(-12, { duration: 120 }), withTiming(12, { duration: 160 }), withTiming(0, { duration: 140 }));
    playCue('sessionEnd', strength);
  }, [id, scale, rotate, strength]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }] }));

  if (!id || !def) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={shift} statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: t.colors.overlay }]} onPress={shift} accessible={false}>
        <View style={[styles.card, { backgroundColor: t.colors.surface, borderRadius: t.radius.xl }]} accessibilityViewIsModal>
          <AppText variant="small" weight="700" color={t.colors.accent} center>
            {tr('achievements.unlocked')}
          </AppText>
          <Animated.View style={[styles.medal, { backgroundColor: t.dark ? t.colors.surfaceAlt : '#FFF3EB', borderColor: t.colors.accent }, style]}>
            <AppText style={{ fontSize: 56, lineHeight: 68 }}>{def.emoji}</AppText>
          </Animated.View>
          <AppText variant="h2" center accessibilityRole="header">
            {tr(`achievements.items.${def.id}.title`)}
          </AppText>
          <AppText muted center>
            {tr(`achievements.items.${def.id}.desc`)}
          </AppText>
          <Button label={tr('achievements.great')} variant="accent" onPress={shift} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 28 },
  card: { padding: 24, gap: 12, alignItems: 'stretch' },
  medal: { alignSelf: 'center', width: 120, height: 120, borderRadius: 60, borderWidth: 4, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
});
